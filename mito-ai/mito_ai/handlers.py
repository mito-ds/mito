import json
import time
import traceback
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Dict, List

import tornado
import tornado.ioloop
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler

from .models import (
    CompletionError,
    CompletionItem,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
)
from .providers import OpenAIProvider
from .utils.create import initialize_user

__all__ = ["CompletionHandler"]




# This handler is responsible for the mito-ai/chat-completions endpoint.
# It takes a message from the user, sends it to the OpenAI API, and returns the response.
# Important: Because this is a server extension, print statements are sent to the
# jupyter server terminal by default (ie: the terminal you ran `jupyter lab`)
class CompletionHandler(JupyterHandler, WebSocketHandler):
    """Completion websocket handler."""

    def initialize(self, llm: OpenAIProvider) -> None:
        super().initialize()
        self.log.debug("Initializing websocket connection %s", self.request.path)
        self._llm = llm

    async def pre_get(self) -> None:
        """Handles websocket authentication/authorization."""
        # authenticate the request before opening the websocket
        user = self.current_user
        if user is None:
            self.log.warning("Couldn't authenticate WebSocket connection")
            raise tornado.web.HTTPError(HTTPStatus.UNAUTHORIZED)

        # authorize the user.
        if not await ensure_async(
            self.authorizer.is_authorized(self, user, "execute", "mito-ai-completion")
        ):
            raise tornado.web.HTTPError(HTTPStatus.FORBIDDEN)

    async def get(self, *args, **kwargs) -> None:
        """Get an event to open a socket."""
        # This method ensure to call `pre_get` before opening the socket.
        await ensure_async(self.pre_get())
        reply = super().get(*args, **kwargs)
        if reply is not None:
            await reply

    async def on_message(self, message: str) -> None:
        """Handle incoming messages on the WebSocket.

        Args:
            message: The message received on the WebSocket.
        """

        initialize_user()

        # first, verify that the message is an `CompletionRequest`.
        self.log.debug("Message received: %s", message)
        try:
            parsed_message = json.loads(message)
            request = CompletionRequest(**parsed_message)
        except ValueError as e:
            self.log.error("Invalid completion request.", exc_info=e)
            return

        try:
            if request.stream and self._llm.can_stream:
                await self._handle_stream_request(request)
            else:
                await self._handle_request(request)
        except Exception as e:
            await self.handle_exception(e, request)

    async def handle_exception(self, e: Exception, request: CompletionRequest):
        """
        Handles an exception raised in either ``handle_request`` or
        ``handle_stream_request``.

        Args:
            e: The exception raised.
            request: The completion request that caused the exception.
        """
        error = CompletionError(
            type=e.__class__.__name__,
            title=e.args[0] if e.args else "Exception",
            traceback=traceback.format_exc(),
        )
        if request.stream:
            reply = CompletionStreamChunk(
                chunk=CompletionItem(
                    insertText="", isIncomplete=True
                ),
                parent_id=request.message_id,
                done=True,
                error=error,
            )
        else:
            reply = CompletionReply(
                items=[],
                error=error,
                parent_id=request.message_id,
            )
        self.reply(reply)

    async def _handle_request(self, request: CompletionRequest) -> None:
        """Handle completion request.

        Args:
            request: The completion request description.
        """
        start = time.time()
        reply = await self._llm.request_completions(request)
        self.reply(reply)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Completion handler resolved in {latency_ms} ms.")

    async def _handle_stream_request(self, request: CompletionRequest) -> None:
        """Handle stream completion request."""
        start = time.time()
        async for reply in self._llm.stream_completions(request):
            self.reply(reply)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Completion streaming completed in {latency_ms} ms.")

    def reply(self, reply: Any) -> None:
        """Write a reply object to the WebSocket connection.

        Args:
            reply: The completion reply object.
                It must be a dataclass instance.
        """
        message = asdict(reply)
        super().write_message(message)
