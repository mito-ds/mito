# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.env_vars.utils import get_env_vars, set_env_var, delete_env_var
from mito_ai.settings.utils import ensure_settings_file_exists


class EnvVarsHandler(APIHandler):
    """Handler for environment variable operations."""

    @tornado.web.authenticated
    @ensure_settings_file_exists
    def get(self, key: str = '') -> None:
        """Return all stored environment variables."""
        self.finish(json.dumps({"env_vars": get_env_vars()}))

    @tornado.web.authenticated
    @ensure_settings_file_exists
    def put(self, key: str) -> None:
        """Set or update an environment variable."""
        data = json.loads(self.request.body)
        if "value" not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "value is required"}))
            return
        set_env_var(key, data["value"])
        self.finish(json.dumps({"status": "updated", "key": key}))

    @tornado.web.authenticated
    @ensure_settings_file_exists
    def delete(self, key: str) -> None:
        """Delete an environment variable."""
        delete_env_var(key)
        self.finish(json.dumps({"status": "deleted", "key": key}))
