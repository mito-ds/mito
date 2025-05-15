# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
from typing import Any, Final
from mito_ai.utils.schema import MITO_FOLDER

APP_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER)
CONNECTIONS_PATH: Final[str] = os.path.join(APP_DIR_PATH, 'db', 'connections.json')


class ConnectionsHandler(tornado.web.RequestHandler):
    """
    Handler for retrieving and updating database connections.
    """
    def check_xsrf_cookie(self) -> None:
        """Override to disable CSRF protection for this handler."""
        pass

    def get(self, *args: Any, **kwargs: Any) -> None:
        with open(CONNECTIONS_PATH, 'r') as f:
            connections = json.load(f)

        self.write(connections)
        self.finish()
    
    def post(self, *args: Any, **kwargs: Any) -> None:
        with open(CONNECTIONS_PATH, 'r') as f:
            connections = json.load(f)

        self.write("yo")

    def delete(self, *args: Any, **kwargs: Any) -> None:
        with open(CONNECTIONS_PATH, 'r') as f:
            connections = json.load(f)

        self.write("deleted")
        self.finish()
