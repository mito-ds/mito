# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from typing import Any
from jupyter_server.base.handlers import APIHandler


class FileUploadHandler(APIHandler):
    """
    Endpoints for working with file uploads.
    """

    def get(self) -> None:
        self.write({"status": "success", "message": "File uploads endpoint"})
        self.finish()
