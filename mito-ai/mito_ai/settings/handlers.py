# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.settings.utils import (
    get_settings_field,
    set_settings_field,
    ensure_settings_file_exists,
)
from mito_ai.utils.version_utils import is_enterprise, is_pro


class SettingsHandler(APIHandler):
    """Handler for operations on a specific setting"""

    @tornado.web.authenticated
    @ensure_settings_file_exists
    def get(self, key: str) -> None:
        """Get a specific setting by key"""
        setting_value = get_settings_field(key)
        if setting_value is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"Setting with key '{key}' not found"}))
        else:
            self.finish(json.dumps({"key": key, "value": setting_value}))

    @tornado.web.authenticated
    @ensure_settings_file_exists
    def put(self, key: str) -> None:
        """Update or create a specific setting"""
        data = json.loads(self.request.body)
        if "value" not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Value is required"}))
            return

        set_settings_field(key, data["value"])
        self.finish(
            json.dumps({"status": "updated", "key": key, "value": data["value"]})
        )


class SubscriptionHandler(APIHandler):
    """Handler for getting a user's subscription status"""

    @tornado.web.authenticated
    def get(self) -> None:
        """Get a user's subscription status"""
        is_pro_user = is_pro()
        is_enterprise_user = is_enterprise()
        self.finish(
            json.dumps(
                {
                    "is_pro": is_pro_user,
                    "is_enterprise": is_enterprise_user,
                }
            )
        )
