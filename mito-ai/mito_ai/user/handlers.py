# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.db import get_user_field, set_user_field
from mito_ai.utils.telemetry_utils import identify


class UserHandler(APIHandler):
    """Handler for operations on a specific user"""

    @tornado.web.authenticated
    def get(self, key: str) -> None:
        value = get_user_field(key)
        if value is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"User field with key '{key}' not found"}))
        else:
            self.finish(json.dumps({"key": key, "value": value}))

    @tornado.web.authenticated
    def put(self, key: str) -> None:
        data = json.loads(self.request.body)
        if "value" not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Value is required"}))
            return

        set_user_field(key, data["value"])
        identify() # Log the new user 
        self.finish(json.dumps({"status": "success", "key": key, "value": data["value"]}))