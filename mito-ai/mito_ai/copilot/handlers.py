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
                        "error": "Failed to start GitHub device login. "
                        "Set MITO_AI_GITHUB_OAUTH_CLIENT_ID or check server logs."
                    }
                )
            )
            return
        self.finish(json.dumps(device_verification_info))


class GitHubCopilotLogoutHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        self.finish(json.dumps(copilot_service.logout()))


class GitHubCopilotStoreTokenPreferenceHandler(APIHandler):
    @tornado.web.authenticated
    def put(self) -> None:
        try:
            body = json.loads(self.request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "Invalid JSON"}))
            return
        store = bool(body.get("store", False))
        copilot_service.set_store_github_access_token_preference(store)
        self.finish(json.dumps({"success": True}))
