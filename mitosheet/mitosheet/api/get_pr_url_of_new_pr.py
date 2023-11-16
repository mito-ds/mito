import string
from typing import Any, Dict

from mitosheet.scheduling import get_automation_files_for_new_automation, create_github_pr

from mitosheet.types import StepsManagerType


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
            automation_description,
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