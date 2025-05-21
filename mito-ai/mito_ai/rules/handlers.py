from dataclasses import dataclass
import json
from typing import Any, Final
import tornado
import os
from mito_ai.rules.utils import RULES_DIR_PATH, get_rules_file, set_rules_file


class RulesHandler(tornado.web.RequestHandler):
    """Handler for operations on a specific setting"""
    
    def prepare(self) -> None:
        """Called before any request handler method."""
        # Ensure the rules directory exists
        if not os.path.exists(RULES_DIR_PATH):
            os.makedirs(RULES_DIR_PATH)
    
    def get(self, key):
        """Get a specific setting by key"""
        rule_content = get_rules_file(key)
        if rule_content is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"Rule with key '{key}' not found"}))
        else:
            self.finish(json.dumps({"key": key, "content": rule_content}))
    
    def put(self, key):
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if 'value' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Value is required"}))
            return
            
        set_rules_file(key, data['value'])
        self.finish(json.dumps({"status": "updated", "rules file ": key}))


