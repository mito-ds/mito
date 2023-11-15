import json
import os
import string
import sys
from typing import Any, Dict, Tuple

import requests

from mitosheet.types import StepsManagerType


def create_github_pr(
        github_repo, 
        new_branch_name, 
        commit_message,
        pr_title, 
        pr_description, 
        new_files
    ) -> str:
    """
    Create a new GitHub PR with the given parameters.
    """

    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        raise Exception("GitHub token not found in environment variables")

    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json',
    }

    api_url = f'https://api.github.com/repos/{github_repo}'

    # Check if the branch already exists
    print("Getting existing branch")
    existing_branch = requests.get(f'{api_url}/git/refs/heads/{new_branch_name}', headers=headers)
    if existing_branch.status_code == 200:
        raise Exception(f"Branch '{new_branch_name}' already exists")

    # Get the default branch of the repo
    repo_info = requests.get(api_url, headers=headers).json()
    default_branch = repo_info['default_branch']
    sha_latest_commit = requests.get(f'{api_url}/git/refs/heads/{default_branch}', headers=headers).json()['object']['sha']    

    # Create a new branch
    new_branch_data = {
        'ref': f'refs/heads/{new_branch_name}',
        'sha': sha_latest_commit
    }
    print("Creating new branch")
    requests.post(f'{api_url}/git/refs', headers=headers, data=json.dumps(new_branch_data))

    # Get the current tree of the latest commit to preserve existing files
    latest_commit = requests.get(f'{api_url}/git/commits/{sha_latest_commit}', headers=headers).json()
    base_tree_sha = latest_commit['tree']['sha']

    tree_elements = []
    for file_path, file_content in new_files.items():
        tree_elements.append({
            'path': file_path,
            'mode': '100644',  # Blob (file) mode
            'type': 'blob',
            'content': file_content
        })

    tree_data = {
        'tree': tree_elements,
        'base_tree': base_tree_sha  # This is important to preserve existing files
    }
    print("Adding tree")
    tree_response = requests.post(f'{api_url}/git/trees', headers=headers, data=json.dumps(tree_data))

    if tree_response.status_code not in [200, 201]:
        raise Exception(f"Failed to create tree: {tree_response.json()}")

    tree_sha = tree_response.json()['sha']

    # Create a commit with the new tree
    commit_data = {
        'message': commit_message,
        'parents': [sha_latest_commit],
        'tree': tree_sha
    }
    print("CREATING COMMIT")
    commit_response = requests.post(f'{api_url}/git/commits', headers=headers, data=json.dumps(commit_data))

    if commit_response.status_code not in [200, 201]:
        raise Exception(f"Failed to create commit: {commit_response.json()}")

    commit_sha = commit_response.json()['sha']

    # Update the branch reference to point to the new commit
    update_branch_data = {
        'sha': commit_sha,
        'force': False
    }
    print("UPDATING BRANCH")
    update_branch = requests.patch(f'{api_url}/git/refs/heads/{new_branch_name}', headers=headers, data=json.dumps(update_branch_data))
    if update_branch.status_code not in [200, 201]:
        raise Exception(f"Failed to update branch: {update_branch.json()}")

    # Create a pull request
    pr_data = {
        'title': pr_title,
        'head': new_branch_name,
        'base': default_branch,
        'body': pr_description
    }
    print("CREATING PR")
    pr_response = requests.post(f'{api_url}/pulls', headers=headers, data=json.dumps(pr_data))

    if pr_response.status_code == 201:
        return pr_response.json()['html_url']
    else:
        raise Exception(f"Failed to create PR: {pr_response.content}")
    
def get_minute_and_hour_from_time(time: str) -> Tuple[str, str]:
    hour = time.split(':')[0]
    minute = time.split(':')[1]

    # Handle AM and PM
    if time.endswith('AM'):
        if hour == '12':
            hour = '0'
    elif time.endswith('PM'):
        if hour != '12':
            hour = str(int(hour) + 12)

    return hour, minute

def get_cron_string_from_schedule(schedule: Dict[str, Any]) -> str:
    if schedule['type'] == 'Every Day':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        return f'{minute} {hour} * * *'

    elif schedule['type'] == 'Every Week':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        day_of_week = schedule['dayOfWeek']
        return f'{minute} {hour} * * {day_of_week}'

    elif schedule['type'] == 'Every Month':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        day_of_month = schedule['dayOfMonth']
        return f'{minute} {hour} {day_of_month} * *'

    else:
        raise Exception(f"Invalid schedule type: {schedule['type']}")

def get_automation_files_for_new_automation(
        steps_manager: StepsManagerType, 
        automation_name: str,
        file_base_folder: str,
        schedule: Dict[str, Any]
    ) -> Dict[str, str]:
    """
    Returns the new files 
    new_files

    new_files
    """
    new_files: Dict[str, str] = {}

    # First, we get the CSV and Excel files the user has importer
    import_params = [param for param in steps_manager.param_metadata if param['type'] == 'import']
    file_paths = [param['original_value'] for param in import_params if 'file' in param['subtype'] and param['original_value'] is not None]

    for file_path in file_paths:
        file_name = os.path.basename(file_path)
        new_files[f'{file_base_folder}/data/{file_name}'] = open(file_path).read()

    # Then, we get these files from the parameters as the function call to the function
    new_files[f'{file_base_folder}/automation.py'] = steps_manager.fully_parameterized_function


    # Add a requirements.txt file, with the correct version of mitosheet, as well as any other dependencies
    from mitosheet import __version__ as mitosheet_version
    if mitosheet_version == '0.3.131': # Handle development version
        mitosheet_version = '0.1.528'

    from pandas import __version__ as pandas_version
    new_files[f'{file_base_folder}/requirements.txt'] = f"""
mitosheet=={mitosheet_version}
pandas=={pandas_version}
"""

    # Then, we add the Github Actions workflow file. 
    # TODO: we could allow you to overrwite file paths in the workflow dispatch,
    # given the param metadata
    cron_string = get_cron_string_from_schedule(schedule)
    # Get the current Python version as a string of 3.10, for example
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    new_files[f'.github/workflows/automation.yml'] = f"""
name: "Automation: {automation_name}"
on:
  schedule:
    - cron: {cron_string}
  workflow_dispatch: null
  pull_request:
    branches:
        - main
    
jobs:
  run_automation:
    name: "Run {automation_name}"
    runs-on: ubuntu-latest      
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python {python_version}
        uses: actions/setup-python@v4
        with:
          python-version: {python_version}
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r {file_base_folder}/requirements.txt
      - name: Run automation
        run: python {file_base_folder}/automation.py
"""
    return new_files


def get_pr_url_of_new_pr(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    automation_name = params['automation_name']
    automation_description = params['automation_description']
    schedule = params['schedule']

    # TODO: make this better
    try:
        automation_name_safe_file_path = "".join(char for char in automation_name if char in string.ascii_letters or char in string.digits)

        base_folder = f'automations/{automation_name_safe_file_path}'
        new_files = get_automation_files_for_new_automation(
            steps_manager, 
            automation_name_safe_file_path,
            base_folder,
            schedule
        )

        pr_url = create_github_pr(
            'mito-ds/mito-automations-test', 
            f'new-automation-{automation_name_safe_file_path}', 
            f'Commit Message: add a new file',
            f'Add automation: {automation_name}', 
            automation_description, 
            new_files
        )
    except Exception as e:
        # TODO: error handling
        print(e)
        pr_url = None

    return pr_url


"""
pr_url = create_github_pr(
    'mito-ds/mito-automations-test', 
    'new-branch-6', 
    'Commit Message: add a new file',
    'A new PR', 
    'This is a test PR', 
    {
        'path/to/new_file1.py': 'x = 1',
        'path/to/new_file2.py': 'x = 2'
    }
)
print(pr_url)
"""