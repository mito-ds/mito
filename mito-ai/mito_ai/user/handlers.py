# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
from jupyter_server.base.handlers import APIHandler
from typing import Final, Optional, Any
from mito_ai.utils.schema import MITO_FOLDER

# The path of the user.json file
USER_JSON_PATH: Final[str] = os.path.join(MITO_FOLDER, "user.json")


def get_user_field(field: str) -> Optional[Any]:
    """
    Returns the value stored at field in the user.json file,
    but may read a different file if it passed
    """
    try:
        with open(USER_JSON_PATH) as f:
            return json.load(f)[field]
    except:
        return None


class UserHandler(APIHandler):
    """Handler for operations on a specific user"""

    # @tornado.web.authenticated
    def get(self, key: str) -> None:
        value = get_user_field(key)
        if value is None:
            self.set_status(404)
            self.finish(json.dumps({"error": f"User field with key '{key}' not found"}))
        else:
            self.finish(json.dumps({"key": key, "value": value}))
