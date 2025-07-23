# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final, Union
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.rules.utils import RULES_DIR_PATH, get_all_rules, get_rule, set_rules_file, delete_rule, rename_rule


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
            
        set_rules_file(key, data['content'])
        self.finish(json.dumps({"status": "updated", "rules file ": key}))

    @tornado.web.authenticated
    def delete(self, key: str) -> None:
        """Delete a specific rule by key"""
        if key is None or key == '':
            self.set_status(400)
            self.finish(json.dumps({"error": "Rule key is required"}))
            return
            
        success = delete_rule(key)
        if success:
            self.finish(json.dumps({"status": "deleted", "rule": key}))
        else:
            self.set_status(404)
            self.finish(json.dumps({"error": f"Rule with key '{key}' not found"}))

    @tornado.web.authenticated
    def post(self, *args: Any) -> None:
        """Rename a rule and optionally update its content"""
        data = json.loads(self.request.body)
        old_key = data.get('old_key')
        new_key = data.get('new_key')
        new_content = data.get('content')  # Optional
        
        if not old_key or not new_key:
            self.set_status(400)
            self.finish(json.dumps({"error": "Both old_key and new_key are required"}))
            return
        
        # Check if old rule exists
        if get_rule(old_key) is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"Rule with key '{old_key}' not found"}))
            return
        
        # Check if new key already exists
        if get_rule(new_key) is not None:
            self.set_status(409)
            self.finish(json.dumps({"error": f"Rule with key '{new_key}' already exists"}))
            return
        
        # Perform the rename
        success = rename_rule(old_key, new_key, new_content)
        if success:
            self.finish(json.dumps({
                "status": "renamed", 
                "old_key": old_key, 
                "new_key": new_key,
                "content_updated": new_content is not None
            }))
        else:
            self.set_status(500)
            self.finish(json.dumps({"error": "Failed to rename rule"}))


