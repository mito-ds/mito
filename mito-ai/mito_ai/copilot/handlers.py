# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import Any

import tornado.web
from jupyter_server.base.handlers import APIHandler

from mito_ai.copilot import service as copilot_service


class GitHubCopilotLoginStatusHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        self.finish(json.dumps(copilot_service.get_login_status()))


class GitHubCopilotLoginHandler(APIHandler):
    @tornado.web.authenticated
    def post(self) -> None:
        device_verification_info = copilot_service.login()
        if device_verification_info is None:
            self.set_status(500)
            self.finish(
                json.dumps(
                    {
                        "error": "Failed to start GitHub device login. Check server logs."
                    }
                )
            )
            return
        self.finish(json.dumps(device_verification_info))


class GitHubCopilotLogoutHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        self.finish(json.dumps(copilot_service.logout()))


