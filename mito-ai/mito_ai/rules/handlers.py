# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final, Union
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.rules.utils import (
    RULES_DIR_PATH,
    cleanup_rules_metadata,
    delete_rule,
    get_all_rules,
    get_rule,
    get_rule_default,
    set_rule_default,
    set_rules_file,
)


class RulesHandler(APIHandler):
    """Handler for operations on a specific setting"""
    
    @tornado.web.authenticated
    def get(self, key: Union[str, None] = None) -> None:
        """Get a specific rule by key or all rules if no key provided"""
        if key is None or key == '':
            # No key provided, return all rules with is_default flag
            rule_files = get_all_rules()
            rules = [
                {"name": name, "is_default": get_rule_default(name)}
                for name in rule_files
            ]
            self.finish(json.dumps(rules))
        else:
            # Key provided, return specific rule
            try:
                rule_content = get_rule(key)
                if rule_content is None:
                    self.set_status(404)
                    self.finish(json.dumps({"error": f"Rule with key '{key}' not found"}))
                else:
                    is_default = get_rule_default(key)
                    self.finish(json.dumps({"key": key, "content": rule_content, "is_default": is_default}))
            except ValueError as e:
                self.set_status(400)
                self.finish(json.dumps({"error": str(e)}))
    
    @tornado.web.authenticated
    def put(self, key: str) -> None:
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if 'content' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Content is required"}))
            return

        try:
            set_rules_file(key, data['content'])
            if 'is_default' in data:
                set_rule_default(key, bool(data['is_default']))
            cleanup_rules_metadata()
            self.finish(json.dumps({"status": "updated", "rules_file": key}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))

    @tornado.web.authenticated
    def delete(self, key: str) -> None:
        """Delete a rule by key (rule name)."""
        try:
            delete_rule(key)
            cleanup_rules_metadata()
            self.finish(json.dumps({"status": "deleted", "key": key}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))
