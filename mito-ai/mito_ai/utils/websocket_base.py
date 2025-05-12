# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Dict, Optional

import tornado
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler

from mito_ai.logger import get_logger


class BaseWebSocketHandler(JupyterHandler, WebSocketHandler):
    """Base WebSocket handler with common functionality for Mito AI services."""

    def initialize(self) -> None:
        """Initialize the WebSocket handler."""
        super().initialize()
        self.log.debug("Initializing websocket connection %s", self.request.path)

    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()

    async def pre_get(self) -> None:
        """Handle WebSocket authentication/authorization."""
        # Authenticate the request before opening the WebSocket
        user = self.current_user
        if user is None:
            self.log.warning("Couldn't authenticate WebSocket connection")
            raise tornado.web.HTTPError(HTTPStatus.UNAUTHORIZED)

        # Authorize the user
        if not await ensure_async(
            self.authorizer.is_authorized(self, user, "execute", "mito-ai")
        ):
            raise tornado.web.HTTPError(HTTPStatus.FORBIDDEN)

    async def get(self, *args: Any, **kwargs: Dict[str, Any]) -> None:
        """Get an event to open a socket or check service availability."""
        # Check if this is just a service availability check
        if self.get_query_argument('check_availability', None) == 'true':
            self.set_status(HTTPStatus.OK)
            self.finish()
            return

        await ensure_async(self.pre_get())  # type: ignore

        reply = super().get(*args, **kwargs)
        if reply is not None:
            await reply

    def reply(self, reply: Any) -> None:
        """Write a reply object to the WebSocket connection.

        Args:
            reply: The reply object, which must be a dataclass instance.
        """
        message = asdict(reply)
        super().write_message(message)

    def on_close(self) -> None:
        """Invoked when the WebSocket is closed."""
        self.log.debug("WebSocket closed: %s", self.request.path)

    def parse_message(self, message: str) -> Dict[str, Any]:
        """Parse an incoming message.
        
        Args:
            message: The JSON message string to parse.
            
        Returns:
            The parsed message as a dict.
            
        Raises:
            ValueError: If the message is not valid JSON.
        """
        try:
            return json.loads(message) # type: ignore
        except ValueError as e:
            self.log.error("Invalid message: %s", e)
            raise 