import json
import logging
import time
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Awaitable, Dict, Optional, Literal, Type

import tornado
import tornado.ioloop
import tornado.web
from pydantic import BaseModel
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.logger import get_logger
from mito_ai.models import (
    AllIncomingMessageTypes,
    CodeExplainMessageBuilder,
    CompletionError,
    CompletionItem,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    ErrorMessage,
    ChatMessageBuilder,
    InlineCompletionMessageBuilder,
    SmartDebugMessageBuilder,
    AgentMessageBuilder,
)
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.create import initialize_user
from mito_ai.utils.version_utils import is_pro

__all__ = ["CompletionHandler"]


# This handler is responsible for the mito-ai/completions endpoint.
# It takes a message from the user, sends it to the OpenAI API, and returns the response.
# Important: Because this is a server extension, print statements are sent to the
# jupyter server terminal by default (ie: the terminal you ran `jupyter lab`)
class CompletionHandler(JupyterHandler, WebSocketHandler):
    """Completion websocket handler."""

    def initialize(self, llm: OpenAIProvider) -> None:
        super().initialize()
        self.log.debug("Initializing websocket connection %s", self.request.path)
        self._llm = llm
        self.full_message_history = []
        self.is_pro = is_pro()

    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger"""
        return get_logger()

    @tornado.web.authenticated
    def head(self) -> None:
        """Handle a HEAD request for the websocket."""
        self.set_status(HTTPStatus.OK)
        self.finish()

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

        initialize_user()

        reply = super().get(*args, **kwargs)
        if reply is not None:
            await reply

    def on_close(self) -> None:
        """Invoked when the WebSocket is closed.

        If the connection was closed cleanly and a status code or reason
        phrase was supplied, these values will be available as the attributes
        ``self.close_code`` and ``self.close_reason``.
        """
        # Stop observing the provider error
        self._llm.unobserve(self._send_error, "last_error")

        # Clear the message history
        self.full_message_history = []

    async def on_message(self, message: str) -> None:
        """Handle incoming messages on the WebSocket.

        Args:
            message: The message received on the WebSocket.
        """
        # first, verify that the message is an `CompletionRequest`.
        self.log.debug("Message received: %s", message)
        try:
            parsed_message = json.loads(message)

            metadata_dict = parsed_message.get('metadata', {})
            type: AllIncomingMessageTypes = parsed_message.get('type')
        except ValueError as e:
            self.log.error("Invalid completion request.", exc_info=e)
            return

        # Clear history if the type is "clear_history"
        if type == "clear_history":
            self.full_message_history = []
            return
        
        messages = []
        response_format = None

        # Generate new message based on message type
        if type == "inline_completion":
            inlineCompletionPromptBuilder = InlineCompletionMessageBuilder(**metadata_dict)
            prompt = inlineCompletionPromptBuilder.prompt
            model = inlineCompletionPromptBuilder.pro_model if self.is_pro else inlineCompletionPromptBuilder.os_model
        elif type == "chat":
            chatMessagePromptBuilder = ChatMessageBuilder(**metadata_dict)
            prompt = chatMessagePromptBuilder.prompt
            model = chatMessagePromptBuilder.pro_model if self.is_pro else chatMessagePromptBuilder.os_model

            if chatMessagePromptBuilder.index is not None:
                # Clear the chat history after the specified index (inclusive)
                self.full_message_history = self.full_message_history[:chatMessagePromptBuilder.index]

        elif type == "codeExplain":
            codeExplainPromptBuilder = CodeExplainMessageBuilder(**metadata_dict)
            prompt = codeExplainPromptBuilder.prompt
            model = codeExplainPromptBuilder.pro_model if self.is_pro else codeExplainPromptBuilder.os_model
        elif type == "smartDebug":
            smartDebugPromptBuilder = SmartDebugMessageBuilder(**metadata_dict)
            prompt = smartDebugPromptBuilder.prompt
            model = smartDebugPromptBuilder.pro_model if self.is_pro else smartDebugPromptBuilder.os_model
        elif type == "agent:planning":
            agentMessageBuilder = AgentMessageBuilder(**metadata_dict)
            prompt = agentMessageBuilder.prompt
            model = agentMessageBuilder.pro_model if self.is_pro else agentMessageBuilder.os_model
            response_format = agentMessageBuilder.response_format
        else:
            raise ValueError(f"Invalid message type: {type}")

        new_message = {
            "role": "user", 
            "content": prompt
        }

        # Inline completion uses its own websocket
        #   so we can reuse the full_message_history variable
        if type == "inline_completion":
            self.full_message_history = [new_message]
        else:
            self.full_message_history.append(new_message)

        request = CompletionRequest(
            type=type,
            message_id=parsed_message.get('message_id'),
            messages=self.full_message_history,
            stream=parsed_message.get('stream', False)
        )

        try:
            if request.stream and self._llm.can_stream:
                await self._handle_stream_request(request, prompt_type=request.type, model=model)
            else:
                await self._handle_request(
                    request,
                    prompt_type=request.type,
                    model=model,
                    response_format=response_format
                )
        except Exception as e:
            await self.handle_exception(e, request)

    def open(self, *args: str, **kwargs: str) -> Optional[Awaitable[None]]:
        """Invoked when a new WebSocket is opened.

        The arguments to `open` are extracted from the `tornado.web.URLSpec`
        regular expression, just like the arguments to
        `tornado.web.RequestHandler.get`.

        `open` may be a coroutine. `on_message` will not be called until
        `open` has returned.
        """
        if self._llm.last_error:
            self._send_error({"new": self._llm.last_error})
        # Start observing the provider error
        self._llm.observe(self._send_error, "last_error")
        # Send the server capabilities to the client.
        self.reply(self._llm.capabilities)

    async def handle_exception(self, e: Exception, request: CompletionRequest):
        """
        Handles an exception raised in either ``handle_request`` or
        ``handle_stream_request``.

        Args:
            e: The exception raised.
            request: The completion request that caused the exception.
        """
        hint = ""
        if isinstance(e, PermissionError):
            hint = "You've reached the free tier limit for Mito AI. Upgrade to Pro for unlimited uses or supply your own OpenAI API key."
        elif "openai" in self._llm.capabilities.provider.lower():
            hint = "There was an error communicating with OpenAI. This might be due to a temporary OpenAI outage, a problem with your internet connection, or an incorrect API key. Please try again."
        else:
            hint = "There was an error communicating with Mito server. This might be due to a temporary server outage or a problem with your internet connection. Please try again."
        error = CompletionError.from_exception(e, hint=hint)
        self._send_error({"new": error})
        if request.stream:
            reply = CompletionStreamChunk(
                chunk=CompletionItem(content="", isIncomplete=True),
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

    async def _handle_request(
        self,
        request: CompletionRequest,
        prompt_type: str,
        model: str,
        response_format: Optional[Type[BaseModel]] = None,
    ) -> None:
        """Handle completion request.

        Args:
            request: The completion request description.
        """
        start = time.time()
        reply = await self._llm.request_completions(request, prompt_type, model, response_format)
        self.reply(reply)

        # Save to the message history
        # Inline completion is ephemeral and does not need to be saved
        if request.type != "inline_completion":
            self.full_message_history.append(
                {
                    "role": "assistant", 
                    "content": reply.items[0].content
                }
            )
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Completion handler resolved in {latency_ms} ms.")

    async def _handle_stream_request(self, request: CompletionRequest, prompt_type: str, model: str) -> None:
        """Handle stream completion request."""
        start = time.time()

        # Use a string buffer to accumulate the full response from streaming chunks.
        # We need to accumulate the response on the backend so that we can save it to
        # the full_message_history
        accumulated_response = ""
        async for reply in self._llm.stream_completions(request, prompt_type, model):
            if isinstance(reply, CompletionStreamChunk):
                accumulated_response += reply.chunk.content

            self.reply(reply)
        
        if request.type != "inline_completion":
            self.full_message_history.append(
                {
                    "role": "assistant", 
                    "content": reply.items[0].content
                }
            )
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

    def _send_error(self, change: Dict[str, Optional[CompletionError]]) -> None:
        """Send an error message to the client."""
        error = change["new"]

        self.reply(
            ErrorMessage(**asdict(error))
            if error is not None
            else ErrorMessage(error_type="", title="No error", traceback="")
        )
