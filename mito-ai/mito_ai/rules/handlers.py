# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final, Union
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.rules.utils import RULES_DIR_PATH, get_all_rules, get_rule, set_rules_file
from mito_ai.rules.google_drive_service import GoogleDriveService
from mito_ai.rules.rules_storage import RulesStorage


class RulesHandler(APIHandler):
    """Handler for operations on a specific setting"""
    
    @tornado.web.authenticated
    def get(self, key: Union[str, None] = None) -> None:
        """Get a specific rule by key or all rules if no key provided"""
        if key is None or key == '':
            # No key provided, return all rules
            rules = get_all_rules()
            self.finish(json.dumps(rules))
        else:
            # Key provided, return specific rule
            rule_content = get_rule(key)
            if rule_content is None:
                self.set_status(404)
                self.finish(json.dumps({"error": f"Rule with key '{key}' not found"}))
            else:
                self.finish(json.dumps({"key": key, "content": rule_content}))
    
    @tornado.web.authenticated
    def put(self, key: str) -> None:
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if 'content' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Content is required"}))
            return
        
        # Check if this is a Google Drive rule
        google_drive_url = data.get('google_drive_url')
        
        if google_drive_url:
            # Use the new storage system for Google Drive rules
            RulesStorage.set_rule(key, data['content'], google_drive_url)
        else:
            # Use the legacy system for regular rules
            set_rules_file(key, data['content'])
        
        self.finish(json.dumps({"status": "updated", "rules file ": key}))
    
    @tornado.web.authenticated
    def post(self) -> None:
        """Handle POST requests for Google Drive content fetching"""
        data = json.loads(self.request.body)
        
        if 'action' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Action is required"}))
            return
        
        if data['action'] == 'fetch_google_drive_content':
            url = data.get('url')
            if not url:
                self.set_status(400)
                self.finish(json.dumps({"error": "URL is required"}))
                return
            
            # Validate URL
            if not GoogleDriveService.is_valid_google_docs_url(url):
                self.set_status(400)
                self.finish(json.dumps({"error": "Invalid Google Docs URL"}))
                return
            
            # Fetch content
            result = GoogleDriveService.fetch_content(url)
            
            if result['success']:
                self.finish(json.dumps({
                    "success": True,
                    "content": result['content'],
                    "file_type": result['file_type'],
                    "file_id": result['file_id']
                }))
            else:
                self.set_status(400)
                self.finish(json.dumps({
                    "success": False,
                    "error": result['error']
                }))
        elif data['action'] == 'refresh_google_drive_rules':
            # Refresh all Google Drive rules
            results = RulesStorage.refresh_google_drive_rules()
            self.finish(json.dumps(results))
        else:
            self.set_status(400)
            self.finish(json.dumps({"error": "Unknown action"}))


