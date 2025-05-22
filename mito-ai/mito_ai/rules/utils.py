from typing import Any, Final, List
import os
from mito_ai.utils.schema import MITO_FOLDER

RULES_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, 'rules')

def set_rules_file(rule_name: str, value: Any) -> None:
    """
    Updates the value of a specific rule file in the rules directory
    """
    # Create the file path to the rule name as a .md file
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    with open(file_path, 'w+') as f:
        f.write(value)
    

def get_rules_file(rule_name: str) -> str:
    """
    Retrieves the value of a specific rule file from the rules directory
    """
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    with open(file_path, 'r') as f:
        return f.read()


def get_all_rules() -> List[str]:
    """
    Retrieves all rule files from the rules directory
    """
    return [f for f in os.listdir(RULES_DIR_PATH) if f.endswith('.md')]
