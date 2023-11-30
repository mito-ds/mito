import os
import string
from typing import Any, Dict, Union

from mitosheet.scheduling import get_automation_files_for_new_automation, create_github_pr

from mitosheet.types import StepsManagerType
from mitosheet.utils import get_valid_python_identifier


def get_pr_url_of_new_pr(params: Dict[str, Any], steps_manager: StepsManagerType) -> Union[str, Dict[str, str]]:
    automation_name = params['automation_name']
    automation_description = params['automation_description']
    schedule = params['schedule']

    try:
        automation_name_safe = get_valid_python_identifier(automation_name, 'automation', 'automation_')

        base_folder = f'automations/{automation_name_safe}'
        new_files = get_automation_files_for_new_automation(
            steps_manager, 
            automation_name,
            automation_description,
            base_folder,
            schedule
        )

        repo = os.environ.get('MITO_CONFIG_GITHUB_AUTOMATION_REPO')
        if not repo:
            raise Exception("GitHub repo not found in environment variables. See docs here: TODO: insert link")

        pr_url = create_github_pr(
            repo, 
            f'new-automation-{automation_name_safe}', 
            f'Add data, Python, and workflow files for automation: {automation_name}',
            f'Add automation: {automation_name}', 
            automation_description, 
            new_files
        )
    except Exception as e:
        return {
            'error': str(e)
        }

    return pr_url