# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
from mito_ai.utils.schema import MITO_FOLDER
from mito_ai.rules.google_drive_service import GoogleDriveService

RULES_DIR_PATH: str = os.path.join(MITO_FOLDER, 'rules')
RULES_METADATA_FILE: str = os.path.join(RULES_DIR_PATH, 'metadata.json')

class RulesStorage:
    """Enhanced rules storage with metadata support"""
    
    @staticmethod
    def ensure_rules_directory():
        """Ensure the rules directory exists"""
        if not os.path.exists(RULES_DIR_PATH):
            os.makedirs(RULES_DIR_PATH)
    
    @staticmethod
    def load_metadata() -> Dict[str, Any]:
        """Load rules metadata from file"""
        RulesStorage.ensure_rules_directory()
        
        if not os.path.exists(RULES_METADATA_FILE):
            return {}
        
        try:
            with open(RULES_METADATA_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    
    @staticmethod
    def save_metadata(metadata: Dict[str, Any]):
        """Save rules metadata to file"""
        RulesStorage.ensure_rules_directory()
        
        with open(RULES_METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    @staticmethod
    def set_rule(rule_name: str, content: str, google_drive_url: Optional[str] = None) -> None:
        """Set a rule with optional Google Drive URL"""
        RulesStorage.ensure_rules_directory()
        
        # Save the content to the .md file
        file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
        with open(file_path, 'w') as f:
            f.write(content)
        
        # Update metadata
        metadata = RulesStorage.load_metadata()
        metadata[rule_name] = {
            'google_drive_url': google_drive_url,
            'last_updated': datetime.now().isoformat(),
            'is_google_drive_rule': google_drive_url is not None
        }
        RulesStorage.save_metadata(metadata)
    
    @staticmethod
    def get_rule(rule_name: str) -> Optional[str]:
        """Get rule content"""
        if rule_name.endswith('.md'):
            rule_name = rule_name[:-3]
        
        file_path = os.path.join(RULES_DIR_PATH, f"{rule_name}.md")
        
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            return f.read()
    
    @staticmethod
    def get_rule_metadata(rule_name: str) -> Optional[Dict[str, Any]]:
        """Get rule metadata"""
        metadata = RulesStorage.load_metadata()
        return metadata.get(rule_name)
    
    @staticmethod
    def get_all_rules() -> List[str]:
        """Get all rule names"""
        RulesStorage.ensure_rules_directory()
        
        try:
            return [f for f in os.listdir(RULES_DIR_PATH) if f.endswith('.md')]
        except OSError:
            return []
    
    @staticmethod
    def refresh_google_drive_rules() -> Dict[str, Any]:
        """Refresh all Google Drive rules"""
        metadata = RulesStorage.load_metadata()
        results = {'success': [], 'errors': []}
        
        for rule_name, rule_metadata in metadata.items():
            if rule_metadata.get('is_google_drive_rule') and rule_metadata.get('google_drive_url'):
                try:
                    # Fetch fresh content from Google Drive
                    result = GoogleDriveService.fetch_content(rule_metadata['google_drive_url'])
                    
                    if result['success']:
                        # Update the rule content
                        RulesStorage.set_rule(rule_name, result['content'], rule_metadata['google_drive_url'])
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
