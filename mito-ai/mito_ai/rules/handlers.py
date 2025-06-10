# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.rules.utils import RULES_DIR_PATH, get_all_rules, get_rule, set_rules_file


class RulesHandler(APIHandler):
    """Handler for operations on a specific setting"""
    
    @tornado.web.authenticated
    def get(self, key=None):
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
    def put(self, key):
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if 'content' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Content is required"}))
            return
            
        set_rules_file(key, data['content'])
        self.finish(json.dumps({"status": "updated", "rules file ": key}))


