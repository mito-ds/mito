import os
import json
import logging
import time
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Awaitable, Dict, Optional, List
from threading import Lock

import tornado
import tornado.ioloop
import tornado.web
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler
from openai.types.chat import ChatCompletionMessageParam

from .logger import get_logger
from .models import (
    AllIncomingMessageTypes,
    CompletionError,
    CompletionItem,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    ErrorMessage,
    ChatMessageMetadata,
    SmartDebugMessageMetadata,
    CodeExplainMessageMetadata,
    InlineCompletionMessageMetadata,
    HistoryReply
)
from .prompt_builders import remove_inner_thoughts_from_message
from .providers import OpenAIProvider
from .utils.create import initialize_user
from .utils.schema import MITO_FOLDER

__all__ = ["CompletionHandler"]

# Global message history with thread-safe access
class GlobalMessageHistory:
    def __init__(self, save_file: str = os.path.join(MITO_FOLDER, "message_history.json")):
        self._lock = Lock()
        self._llm_history: List[Dict[str, str]] = []
        self._display_history: List[Dict[str, str]] = []
        self._save_file = save_file

        # Load from disk on startup
        self._load_from_disk()
    
    def _load_from_disk(self):
        """Load existing history from disk, if it exists."""
        if os.path.exists(self._save_file):
            try:
                with open(self._save_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._llm_history = data.get("llm_history", [])
                    self._display_history = data.get("display_history", [])
            except Exception as e:
                print(f"Error loading history file: {e}")
    
    def _save_to_disk(self):
        """Save current history to disk."""
        data = {
            "llm_history": self._llm_history,
            "display_history": self._display_history,
        }
        # Using a temporary file and rename for safer "atomic" writes
        tmp_file = f"{self._save_file}.tmp"
        try:
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_file, self._save_file)
        except Exception as e:
            # log or handle error
            print(f"Error saving history file: {e}")

    def get_histories(self) -> tuple[List[Dict[str, str]], List[Dict[str, str]]]:
        with self._lock:
            return self._llm_history[:], self._display_history[:]

    def clear_histories(self) -> None:
        with self._lock:
            self._llm_history = []
            self._display_history = []

    def append_message(self, llm_message: Dict[str, str], display_message: Dict[str, str]) -> None:
        with self._lock:
            self._llm_history.append(llm_message)
            self._display_history.append(display_message)
            self._save_to_disk()

    def truncate_histories(self, index: int) -> None:
        with self._lock:
            self._llm_history = self._llm_history[:index]
            self._display_history = self._display_history[:index]
            self._save_to_disk()

# Global history instance
message_history = GlobalMessageHistory()

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
            message_history.clear_histories()
            return
        
        if type == "fetch_history":
            _, display_history = message_history.get_histories()
            reply = HistoryReply(
                parent_id=parsed_message.get('message_id'),
                items=display_history
            )
            
            self.reply(reply)
            return
        
        messages = []

        # Generate new message based on message type
        if type == "inline_completion":
            prompt = InlineCompletionMessageMetadata(**metadata_dict).prompt
            new_llm_message = {"role": "user", "content": prompt}
            llm_history = [new_llm_message]  # Inline completion uses its own history
        else:
            llm_history, display_history = message_history.get_histories()

            if type == "chat":
                metadata = ChatMessageMetadata(**metadata_dict)
                if metadata.index is not None:
                    message_history.truncate_histories(metadata.index)
                    llm_history, display_history = message_history.get_histories()
                prompt = metadata.prompt
                display_message = metadata.display_message
            elif type == "codeExplain":
                metadata = CodeExplainMessageMetadata(**metadata_dict)
                prompt = metadata.prompt
                display_message = metadata.display_message
            elif type == "smartDebug":
                metadata = SmartDebugMessageMetadata(**metadata_dict)
                prompt = metadata.prompt
                display_message = metadata.display_message

            new_llm_message = {"role": "user", "content": prompt}
            new_display_message = {"role": "user", "content": display_message}
            message_history.append_message(new_llm_message, new_display_message)
            llm_history, display_history = message_history.get_histories()

        self.log.info(f"LLM message history: {json.dumps(llm_history, indent=2)}")
        self.log.info(f"Display message history: {json.dumps(display_history, indent=2)}")

        request = CompletionRequest(
            type=type,
            message_id=parsed_message.get('message_id'),
            messages=llm_history,
            stream=parsed_message.get('stream', False)
        )
        
        try:
            if request.stream and self._llm.can_stream:
                await self._handle_stream_request(request, prompt_type=request.type)
            else:
                await self._handle_request(request, prompt_type=request.type)
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

    async def _handle_request(self, request: CompletionRequest, prompt_type: str) -> None:
        """Handle completion request.

        Args:
            request: The completion request description.
        """
        start = time.time()
        reply = await self._llm.request_completions(request, prompt_type)
        self.reply(reply)

        # Save to the message history
        # Inline completion is ephemeral and does not need to be saved
        if request.type != "inline_completion":
            response = reply.items[0].content if reply.items else ""

            if request.type == "smartDebug":
                response = remove_inner_thoughts_from_message(response)

            message = {
                "role": "assistant", 
                "content": response
            }
            message_history.append_message(message, message)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Completion handler resolved in {latency_ms} ms.")
        self.log.info(f"LLM message history: {json.dumps(message_history.get_histories()[0], indent=2)}")
        self.log.info(f"Display message history: {json.dumps(message_history.get_histories()[1], indent=2)}")
    async def _handle_stream_request(self, request: CompletionRequest, prompt_type: str) -> None:
        """Handle stream completion request."""
        start = time.time()

        # Use a string buffer to accumulate the full response from streaming chunks.
        # We need to accumulate the response on the backend so that we can save it to
        # the message history after the streaming is complete.
        accumulated_response = ""
        async for reply in self._llm.stream_completions(request, prompt_type):
            if isinstance(reply, CompletionStreamChunk):
                accumulated_response += reply.chunk.content

            self.reply(reply)
        
        if request.type != "inline_completion":
            message = {
                "role": "assistant", 
                "content": accumulated_response
            }
            message_history.append_message(message, message)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Completion streaming completed in {latency_ms} ms.")

    def reply(self, reply: Any) -> None:
        """Write a reply object to the WebSocket connection.

        Args:
            reply: The completion reply object.
                It must be a dataclass instance.
        """
        message = asdict(reply)
        self.log.info(f"Replying with: {json.dumps(message)}")
        super().write_message(message)

    def _send_error(self, change: Dict[str, Optional[CompletionError]]) -> None:
        """Send an error message to the client."""
        error = change["new"]

        self.reply(
            ErrorMessage(**asdict(error))
            if error is not None
            else ErrorMessage(error_type="", title="No error", traceback="")
        )
