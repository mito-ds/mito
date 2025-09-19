# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

# app_manager/handlers.py
import os
import time
import logging
from typing import Union
from mito_ai.utils.websocket_base import BaseWebSocketHandler
from mito_ai.app_manager.models import (
    App,
    AppManagerError,
    ManageAppRequest,
    ManageAppReply,
    CheckAppStatusRequest,
    CheckAppStatusReply,
    ErrorMessage,
    MessageType
)
from mito_ai.constants import ACTIVE_STREAMLIT_BASE_URL
from mito_ai.logger import get_logger
from mito_ai.app_manager.utils import convert_utc_to_local_time
import requests


class AppManagerHandler(BaseWebSocketHandler):
    """Handler for app management requests."""

    def initialize(self) -> None:
        """Initialize the WebSocket handler."""
        super().initialize()
        self.log.debug("Initializing app manager websocket connection %s", self.request.path)

    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()

    async def on_message(self, message: Union[str, bytes]) -> None:
        """Handle incoming messages on the WebSocket."""
        start = time.time()

        # Convert bytes to string if needed
        if isinstance(message, bytes):
            message = message.decode('utf-8')

        self.log.debug("App manager message received: %s", message)

        try:
            # Ensure message is a string before parsing
            if not isinstance(message, str):
                raise ValueError("Message must be a string")

            parsed_message = self.parse_message(message)
            message_type = parsed_message.get('type')
            message_id = parsed_message.get('message_id')

            if message_type == MessageType.MANAGE_APP.value:
                # Handle manage app request
                manage_app_request = ManageAppRequest(**parsed_message)
                await self._handle_manage_app(manage_app_request)
            elif message_type == MessageType.CHECK_APP_STATUS.value:
                # Handle check app status request
                check_status_request = CheckAppStatusRequest(**parsed_message)
                await self._handle_check_app_status(check_status_request)
            else:
                self.log.error(f"Unknown message type: {message_type}")
                error_response = ErrorMessage(
                    error_type="InvalidRequest",
                    title=f"Unknown message type: {message_type}",
                    message_id=message_id
                )
                self.reply(error_response)

        except ValueError as e:
            self.log.error("Invalid app manager request", exc_info=e)
            error_response = ErrorMessage(
                error_type=type(e).__name__,
                title=str(e),
                message_id=parsed_message.get('message_id') if 'parsed_message' in locals() else None
            )
            self.reply(error_response)
        except Exception as e:
            self.log.error("Error handling app manager message", exc_info=e)
            error_response = ErrorMessage(
                error_type=type(e).__name__,
                title=str(e),
                message_id=parsed_message.get('message_id') if 'parsed_message' in locals() else None
            )
            self.reply(error_response)

        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"App manager handler processed in {latency_ms} ms.")

    async def _handle_manage_app(self, request: ManageAppRequest) -> None:
        """Handle a manage app request with hardcoded data."""
        try:
            jwt_token = request.jwt_token
            headers = {}
            if jwt_token and jwt_token != 'placeholder-jwt-token':
                headers['Authorization'] = f'Bearer {jwt_token}'
            else:
                self.log.warning("No JWT token provided for API request")
                return

            manage_apps_response = requests.get(f"{ACTIVE_STREAMLIT_BASE_URL}/manage-apps",
                                        headers=headers)
            manage_apps_response.raise_for_status()

            apps_data = manage_apps_response.json()

            for app in apps_data:
                if 'last_deployed_at' in app:
                    app['last_deployed_at'] = convert_utc_to_local_time(app['last_deployed_at'])

            # Create successful response
            reply = ManageAppReply(
                apps=apps_data,
                message_id=request.message_id
            )
            self.reply(reply)

        except Exception as e:
            self.log.error(f"Error handling manage app request: {e}", exc_info=e)
            
            try:
                error = AppManagerError.from_exception(e)
            except Exception:
                error = AppManagerError(
                    error_type=type(e).__name__,
                    title=str(e)
                )

            # Return error response
            error_reply = ManageAppReply(
                apps=[],
                error=error,
                message_id=request.message_id
            )
            self.reply(error_reply)

    async def _handle_check_app_status(self, request: CheckAppStatusRequest) -> None:
        """Handle a check app status request."""
        self.log.info("In check app status")
        try:
            # Make a HEAD request to check if the app URL is accessible
            response = requests.head(request.app_url, timeout=10, verify=False)
            self.log.debug(f"Is app accessible: {response.status_code}")
            is_accessible = response.status_code==200

            # Create successful response
            reply = CheckAppStatusReply(
                is_accessible=is_accessible
            )

            self.reply(reply)

        except Exception as e:
            self.log.error(f"Error checking app status: {e}", exc_info=e)
            error = AppManagerError.from_exception(e)

            # Return error response
            error_reply = CheckAppStatusReply(
                is_accessible=False,
                error=error
            )
            self.reply(error_reply)