# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, Final, List, Optional, Dict
import os
import json
from datetime import datetime
from mito_ai.utils.schema import MITO_FOLDER

RULES_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, 'rules')
RULES_METADATA_FILE: str = os.path.join(RULES_DIR_PATH, 'metadata.json')

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


def load_rules_metadata() -> Dict[str, Any]:
    """Load rules metadata from file"""
    if not os.path.exists(RULES_METADATA_FILE):
        return {}
    
    try:
        with open(RULES_METADATA_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_rules_metadata(metadata: Dict[str, Any]) -> None:
    """Save rules metadata to file"""
    # Ensure the directory exists
    if not os.path.exists(RULES_DIR_PATH):
        os.makedirs(RULES_DIR_PATH)
    
    with open(RULES_METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)


def set_rule_with_metadata(rule_name: str, content: str, rule_type: str = "manual", google_drive_url: Optional[str] = None) -> None:
    """Set a rule with metadata including rule type and optional Google Drive URL"""
    # Save the content to the .md file
    set_rules_file(rule_name, content)
    
    # Update metadata
    metadata = load_rules_metadata()
    metadata[rule_name] = {
        'rule_type': rule_type,
        'google_drive_url': google_drive_url,
        'last_updated': datetime.now().isoformat()
    }
    save_rules_metadata(metadata)


def get_rule_metadata(rule_name: str) -> Optional[Dict[str, Any]]:
    """Get rule metadata"""
    metadata = load_rules_metadata()
    return metadata.get(rule_name)


def refresh_google_drive_rules() -> Dict[str, Any]:
    """Refresh all Google Drive rules"""
    from mito_ai.rules.google_drive_service import GoogleDriveService
    
    metadata = load_rules_metadata()
    results = {'success': [], 'errors': []}
    
    for rule_name, rule_metadata in metadata.items():
        if rule_metadata.get('rule_type') == 'google_doc' and rule_metadata.get('google_drive_url'):
            try:
                # Fetch fresh content from Google Drive
                result = GoogleDriveService.fetch_content(rule_metadata['google_drive_url'])
                
                if result['success']:
                    # Update the rule content
                    set_rule_with_metadata(rule_name, result['content'], 'google_doc', rule_metadata['google_drive_url'])
                    results['success'].append(rule_name)
                else:
                    results['errors'].append({
                        'rule': rule_name,
                        'error': result['error']
                    })
                    
            except Exception as e:
                results['errors'].append({
                    'rule': rule_name,
                    'error': str(e)
                })
    
    return results
