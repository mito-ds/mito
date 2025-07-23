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


def delete_rule(rule_name: str) -> bool:
    """
    Deletes a specific rule file from the rules directory
    
    Returns:
        bool: True if the file was successfully deleted, False if the file doesn't exist
    """
    if rule_name.endswith('.md'):
        rule_name = rule_name[:-3]
    
    file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
    
    if not os.path.exists(file_path):
        return False
    
    try:
        os.remove(file_path)
        return True
    except OSError as e:
        print(f"Error deleting rule file {file_path}: {e}")
        return False


def rename_rule(old_rule_name: str, new_rule_name: str, new_content: Optional[str] = None) -> bool:
    """
    Renames a rule file and optionally updates its content
    
    Args:
        old_rule_name: The current name of the rule
        new_rule_name: The new name for the rule
        new_content: Optional new content for the rule (if None, keeps existing content)
    
    Returns:
        bool: True if the rule was successfully renamed, False otherwise
    """
    # Remove .md extensions if present
    if old_rule_name.endswith('.md'):
        old_rule_name = old_rule_name[:-3]
    if new_rule_name.endswith('.md'):
        new_rule_name = new_rule_name[:-3]
    
    old_file_path = os.path.join(RULES_DIR_PATH, f"{old_rule_name}.md")
    new_file_path = os.path.join(RULES_DIR_PATH, f"{new_rule_name}.md")
    
    # Check if old file exists
    if not os.path.exists(old_file_path):
        return False
    
    # Check if new file already exists
    if os.path.exists(new_file_path):
        return False
    
    try:
        # If new_content is provided, write it to the new file
        if new_content is not None:
            with open(new_file_path, 'w') as f:
                f.write(new_content)
            # Remove the old file
            os.remove(old_file_path)
        else:
            # Just rename the file
            os.rename(old_file_path, new_file_path)
        
        return True
    except OSError as e:
        print(f"Error renaming rule file from {old_file_path} to {new_file_path}: {e}")
        return False


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
