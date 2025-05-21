# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final
import tornado
import os
from mito_ai.settings.utils import SETTINGS_PATH, get_settings_field, set_settings_field


class SettingsHandler(tornado.web.RequestHandler):
    """Handler for operations on a specific setting"""
    
    def prepare(self) -> None:
        """Called before any request handler method."""
        # Ensure the settings.json file exists
        if not os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, 'w') as f:
                json.dump({}, f, indent=4)
    
    def get(self, key):
        """Get a specific setting by key"""
        setting_value = get_settings_field(key)
        if setting_value is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"Setting with key '{key}' not found"}))
        else:
            self.finish(json.dumps({"key": key, "value": setting_value}))
    
    def put(self, key):
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if 'value' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Value is required"}))
            return
            
        set_settings_field(key, data['value'])
        self.finish(json.dumps({"status": "updated", "key": key, "value": data['value']}))


