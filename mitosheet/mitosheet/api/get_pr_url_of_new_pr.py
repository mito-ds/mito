import json
import os
import string
from typing import Dict

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
    commit_response = requests.post(f'{api_url}/git/commits', headers=headers, data=json.dumps(commit_data))

    if commit_response.status_code not in [200, 201]:
        raise Exception(f"Failed to create commit: {commit_response.json()}")

    commit_sha = commit_response.json()['sha']

    # Update the branch reference to point to the new commit
    update_branch_data = {
        'sha': commit_sha,
        'force': False
    }
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
    pr_response = requests.post(f'{api_url}/pulls', headers=headers, data=json.dumps(pr_data))

    if pr_response.status_code == 201:
        return pr_response.json()['html_url']
    else:
        raise Exception(f"Failed to create PR: {pr_response.content}")
    

def get_automation_files_for_new_automation(
        steps_manager: StepsManagerType, 
        file_base_folder: str,
    ) -> Dict[str, str]:
    """
    Returns the new files 
    new_files

    new_files
    """
    new_files: Dict[str, str] = {}

    # First, we get the CSV and Excel files the user has importer
    import_params = [param for param in steps_manager.param_metadata if param['type'] == 'import']
    file_paths = [param['original_value'] for param in import_params if 'file_path' in param['subtype'] and param['original_value'] is not None]

    for file_path in file_paths:
        file_name = os.path.basename(file_path)
        new_files[f'{file_base_folder}/data/{file_name}'] = open(file_path).read()

    # Then, we get these files from the parameters as the function call to the function
    new_files[f'{file_base_folder}/automation.py'] = steps_manager.fully_parameterized_function

    return new_files

def get_pr_url_of_new_pr(params: Dict[str, str], steps_manager: StepsManagerType) -> str:
    automation_name = params['automation_name']

    automation_name_safe_file_path = "".join(
        char for char in automation_name 
        if char in string.ascii_letters or char in string.digits
        else '_'
    )

    base_folder = f'automations/{automation_name_safe_file_path}'
    new_files = get_automation_files_for_new_automation(steps_manager, base_folder)

    pr_url = create_github_pr(
        'mito-ds/mito-automations-test', 
        f'new-automation-{automation_name_safe_file_path}', 
        f'Commit Message: add a new file',
        f'Add automation: {automation_name}', 
        f'This PR adds the automation {automation_name}', 
        new_files
    )

    print("NEW URL", pr_url)
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