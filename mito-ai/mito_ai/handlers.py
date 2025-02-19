import json
import logging
import time
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Dict, Optional, Union
import tornado
import tornado.ioloop
import tornado.web
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.logger import get_logger
from mito_ai.models import (
    CompletionError,
    CompletionItem,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    ErrorMessage,
    FetchHistoryReply,
    ChatMessageMetadata,
    SmartDebugMetadata,
    CodeExplainMetadata,
    AgentPlanningMetadata,
    InlineCompleterMetadata,
    MessageType
)
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.create import initialize_user
from mito_ai.utils.version_utils import is_pro
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completion_handlers.chat_completion_handler import get_chat_completion
from mito_ai.completion_handlers.smart_debug_handler import get_smart_debug_completion
from mito_ai.completion_handlers.code_explain_handler import get_code_explain_completion
from mito_ai.completion_handlers.inline_completer_handler import get_inline_completion
from mito_ai.completion_handlers.agent_planning_handler import get_agent_planning_completion
from mito_ai.completion_handlers.agent_execution_handler import get_agent_execution_completion
from mito_ai.completion_handlers.agent_auto_error_fixup_handler import get_agent_auto_error_fixup_completion


__all__ = ["CompletionHandler"]

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
        self.full_message_history: list[ChatCompletionMessageParam] = []
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

    async def get(self, *args: Any, **kwargs: dict[str, Any]) -> None:
        """Get an event to open a socket."""
        # This method ensure to call `pre_get` before opening the socket.
        await ensure_async(self.pre_get()) # type: ignore

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
        

    async def on_message(self, message: str) -> None: # type: ignore
        """Handle incoming messages on the WebSocket.

        Args:
            message: The message received on the WebSocket.
        """
        start = time.time()
        self.log.debug("Message received: %s", message)
        
        try:
            parsed_message = json.loads(message)
            metadata_dict = parsed_message.get('metadata', {})
            type: MessageType = MessageType(parsed_message.get('type'))
        except ValueError as e:
            self.log.error("Invalid completion request.", exc_info=e)
            return

        # Clear history if the type is "clear_history"
        if type == MessageType.CLEAR_HISTORY:
            message_history.clear_histories()
            return
        
        if type == MessageType.FETCH_HISTORY:
            _, display_history = message_history.get_histories()
            fetch_history_reply = FetchHistoryReply(
                parent_id=parsed_message.get('message_id'),
                items=display_history
            )
            self.reply(fetch_history_reply)
            return

        try:
            
            # Get completion based on message type
            completion = None
            if type == MessageType.CHAT:
                chatMetadata = ChatMessageMetadata(**metadata_dict)
                completion = await get_chat_completion(chatMetadata, self._llm, message_history)
            elif type == MessageType.SMART_DEBUG:
                smartDebugMetadata = SmartDebugMetadata(**metadata_dict)
                completion = await get_smart_debug_completion(smartDebugMetadata, self._llm, message_history)
            elif type == MessageType.CODE_EXPLAIN:
                codeExplainMetadata = CodeExplainMetadata(**metadata_dict)
                completion = await get_code_explain_completion(codeExplainMetadata, self._llm, message_history)
            elif type == MessageType.AGENT_PLANNING:
                agentPlanningMetadata = AgentPlanningMetadata(**metadata_dict)
                completion = await get_agent_planning_completion(agentPlanningMetadata, self._llm, message_history)
            elif type == MessageType.AGENT_EXECUTION:
                agentExecutionMetadata = ChatMessageMetadata(**metadata_dict)
                completion = await get_agent_execution_completion(agentExecutionMetadata, self._llm, message_history)
            elif type == MessageType.AGENT_AUTO_ERROR_FIXUP:
                agentAutoErrorFixupMetadata = SmartDebugMetadata(**metadata_dict)
                completion = await get_agent_auto_error_fixup_completion(agentAutoErrorFixupMetadata, self._llm, message_history)
            elif type == MessageType.INLINE_COMPLETION:
                inlineCompleterMetadata = InlineCompleterMetadata(**metadata_dict)
                completion = await get_inline_completion(inlineCompleterMetadata, self._llm, message_history)
            else:
                raise ValueError(f"Invalid message type: {type}")
            
            # Create and send reply
            reply = CompletionReply(
                items=[CompletionItem(content=completion, isIncomplete=False)],
                parent_id=parsed_message.get('message_id')
            )
            self.reply(reply)
            
            latency_ms = round((time.time() - start) * 1000)
            self.log.info(f"Completion handler resolved in {latency_ms} ms.")

        except Exception as e:
            error = CompletionError.from_exception(e)
            self._send_error({"new": error})
            reply = CompletionReply(
                items=[],
                error=error,
                parent_id=parsed_message.get('message_id')
            )
            self.reply(reply)
            

    def open(self, *args: str, **kwargs: str) -> None:
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
        

    async def handle_exception(self, e: Exception, request: CompletionRequest) -> None:
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
        
        error: CompletionError = CompletionError.from_exception(e, hint=hint)
        self._send_error({"new": error})
        
        reply: Union[CompletionStreamChunk, CompletionReply]
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
        

    async def _handle_stream_request(self, request: CompletionRequest, message_type: MessageType, model: str) -> None:
        """Handle stream completion request."""
        start = time.time()

        # Use a string buffer to accumulate the full response from streaming chunks.
        # We need to accumulate the response on the backend so that we can save it to
        # the message history after the streaming is complete.
        accumulated_response = ""
        async for reply in self._llm.stream_completions(request, message_type, model):
            if isinstance(reply, CompletionStreamChunk):
                accumulated_response += reply.chunk.content

            self.reply(reply)
        
        if request.type != "inline_completion":
            message: ChatCompletionMessageParam = {
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
        super().write_message(message)

    def _send_error(self, change: Dict[str, Optional[CompletionError]]) -> None:
        """Send an error message to the client."""
        error = change["new"]

        self.reply(
            ErrorMessage(**asdict(error))
            if error is not None
            else ErrorMessage(error_type="", title="No error", traceback="")
        )
