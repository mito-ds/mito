# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, Final, List, Optional
import os
from mito_ai.utils.schema import MITO_FOLDER

RULES_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, 'rules')

def set_rules_file(rule_name: str, value: Any) -> None:
    """
    Updates the value of a specific rule file in the rules directory
    """
    # Ensure the directory exists
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)
    
    # Create the file path to the rule name as a .md file
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    with open(file_path, 'w+') as f:
        f.write(value)
    

def get_rule(rule_name: str) -> Optional[str]:
    """
    Retrieves the value of a specific rule file from the rules directory
    """
    
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'r') as f:
        return f.read()


def get_all_rules() -> List[str]:
    """
    Retrieves all rule files from the rules directory
    """
    # Ensure the directory exists
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)
        return []  # Return empty list if directory didn't exist
    
    try:
        return [f for f in os.listdir(RULES_DIR_PATH) if f.endswith('.md')]
    except OSError as e:
        # Log the error if needed and return empty list
        print(f"Error reading rules directory: {e}")
        return []
