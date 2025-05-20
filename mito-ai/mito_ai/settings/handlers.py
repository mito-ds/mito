from dataclasses import dataclass
import json
from mito_ai.utils.db import get_user_field, set_user_field
import tornado

class SettingsHandler(tornado.web.RequestHandler):
    """Handler for operations on a specific setting"""
    
    def check_xsrf_cookie(self) -> None:
        """Override to disable CSRF protection for this handler."""
        pass
    
    def get(self, key):
        """Get a specific setting by key"""
        setting_value = get_user_field(key)
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
            
        set_user_field(key, data['value'])
        self.finish(json.dumps({"status": "updated", "key": key, "value": data['value']}))
