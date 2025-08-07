# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import time
import uuid
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Dict, Optional, Union
import tornado
import tornado.ioloop
import tornado.web
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import JupyterHandler
from tornado.websocket import WebSocketHandler
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.logger import get_logger
from mito_ai.completions.models import (
    AgentSmartDebugMetadata,
    CompletionError,
    CompletionItem,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    ErrorMessage,
    FetchHistoryReply,
    StartNewChatReply,
    FetchThreadsReply,
    DeleteThreadReply,
    ChatMessageMetadata,
    SmartDebugMetadata,
    CodeExplainMetadata,
    AgentExecutionMetadata,
    InlineCompleterMetadata,
    MessageType
)
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.utils.create import initialize_user
from mito_ai.utils.version_utils import is_pro
from mito_ai.completions.completion_handlers.chat_completion_handler import get_chat_completion, stream_chat_completion
from mito_ai.completions.completion_handlers.smart_debug_handler import get_smart_debug_completion, stream_smart_debug_completion
from mito_ai.completions.completion_handlers.code_explain_handler import get_code_explain_completion, stream_code_explain_completion
from mito_ai.completions.completion_handlers.inline_completer_handler import get_inline_completion
from mito_ai.completions.completion_handlers.agent_execution_handler import get_agent_execution_completion
from mito_ai.completions.completion_handlers.agent_auto_error_fixup_handler import get_agent_auto_error_fixup_completion
from mito_ai.utils.telemetry_utils import identify

FALLBACK_MODEL = "gpt-5"  # Default model to use for safety

# The GlobalMessageHistory is responsible for updating the message histories stored in the .mito/ai-chats directory.
# We create one GlobalMessageHistory per backend server instance instead of one per websocket connection so that the
# there is one manager of the locks for the .mito/ai-chats directory. This is my current understanding and it 
# might be incorrect!
message_history = GlobalMessageHistory()

# This handler is responsible for the mito_ai/completions endpoint.
# It takes a message from the user, sends it to the OpenAI API, and returns the response.
# Important: Because this is a server extension, print statements are sent to the
# jupyter server terminal by default (ie: the terminal you ran `jupyter lab`)
class CompletionHandler(JupyterHandler, WebSocketHandler):
    """Completion websocket handler."""

    def initialize(self, llm: OpenAIProvider) -> None:
        super().initialize()
        self.log.debug("Initializing websocket connection %s", self.request.path)
        self._llm = llm
        self.is_pro = is_pro()
        self._selected_model = FALLBACK_MODEL
        identify(llm.key_type)
        
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger"""
        return get_logger()

    async def pre_get(self) -> None:
        """Handles websocket authentication/authorization."""
        # authenticate the request before opening the websocket
        user = self.current_user
        if user is None:
            self.log.warning("Couldn't authenticate WebSocket connection")
            raise tornado.web.HTTPError(HTTPStatus.UNAUTHORIZED)

        # authorize the user.
        if not await ensure_async(
            self.authorizer.is_authorized(self, user, "execute", "mito_ai-completion")
        ):
            raise tornado.web.HTTPError(HTTPStatus.FORBIDDEN)

    async def get(self, *args: Any, **kwargs: Dict[str, Any]) -> None:
        """Get an event to open a socket or check service availability."""
        # Check if this is just a service availability check
        if self.get_query_argument('check_availability', None) == 'true':
            self.set_status(HTTPStatus.OK)
            self.finish()
            return

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
        
        reply: Union[StartNewChatReply, FetchThreadsReply, DeleteThreadReply, FetchHistoryReply, CompletionReply]

        # Clear history if the type is "start_new_chat"
        if type == MessageType.START_NEW_CHAT:
            thread_id = message_history.create_new_thread()
            
            reply = StartNewChatReply(
                parent_id=parsed_message.get("message_id"),
                thread_id=thread_id
            )
            self.reply(reply)
            return

        # Handle get_threads: return list of chat threads
        if type == MessageType.GET_THREADS:
            threads = message_history.get_threads()
            reply = FetchThreadsReply(
                parent_id=parsed_message.get("message_id"),
                threads=threads
            )
            self.reply(reply)
            return

        # Handle delete_thread: delete the specified thread
        if type == MessageType.DELETE_THREAD:
            thread_id_to_delete = metadata_dict.get('thread_id')
            if thread_id_to_delete:
                is_thread_deleted = message_history.delete_thread(thread_id_to_delete)
                reply = DeleteThreadReply(
                    parent_id=parsed_message.get("message_id"),
                    success=is_thread_deleted
                )
            else:
                reply = DeleteThreadReply(
                    parent_id=parsed_message.get("message_id"),
                    success=False
                )
            self.reply(reply)
            return
        if type == MessageType.FETCH_HISTORY:
            
            # If a thread_id is provided, use that thread's history; otherwise, use newest.
            thread_id = metadata_dict.get('thread_id')
            display_history = message_history.get_display_history(thread_id)
            
            reply = FetchHistoryReply(
                parent_id=parsed_message.get('message_id'),
                items=display_history
            )
            self.reply(reply)
            return
        
        # Updated handler for receiving model selection via websocket
        if type == MessageType.UPDATE_MODEL_CONFIG:
            model = metadata_dict.get('model')
            if model:
                self._selected_model = model
                self.log.info(f"Model updated to: {model}")
                reply = CompletionReply(
                    items=[CompletionItem(content=f"Model updated to {model}", isIncomplete=False)],
                    parent_id=parsed_message.get('message_id')
                )
                self.reply(reply)
            else:
                error = CompletionError(
                    error_type="InvalidModelConfig",
                    title="Invalid model configuration",
                    traceback="",
                    hint="Model name is required"
                )
                reply = CompletionReply(
                    items=[],
                    error=error,
                    parent_id=parsed_message.get('message_id')
                )
                self.reply(reply)
            return
        
        try:
            # Get completion based on message type
            completion = None
            message_id = parsed_message.get('message_id')
            stream = parsed_message.get('stream')

            # When handling completions, always use the selected model
            model = self._selected_model
            if type == MessageType.CHAT:
                chat_metadata = ChatMessageMetadata(**metadata_dict)
                
                # Handle streaming if requested and available
                if stream:
                    # Use stream_chat_completion to stream the response
                    await stream_chat_completion(
                        chat_metadata, 
                        self._llm, 
                        message_history, 
                        message_id,
                        self.reply,
                        model
                    )
                    return
                else:
                    # Regular non-streaming completion
                    completion = await get_chat_completion(chat_metadata, self._llm, message_history, model)
            elif type == MessageType.SMART_DEBUG:
                smart_debug_metadata = SmartDebugMetadata(**metadata_dict)
                # Handle streaming if requested and available
                if stream:
                    # Use stream_smart_debug_completion to stream the response
                    await stream_smart_debug_completion(
                        smart_debug_metadata, 
                        self._llm, 
                        message_history, 
                        message_id,
                        self.reply,
                        model
                    )
                    return
                else:
                    # Regular non-streaming completion
                    completion = await get_smart_debug_completion(smart_debug_metadata, self._llm, message_history, model)
            elif type == MessageType.CODE_EXPLAIN:
                code_explain_metadata = CodeExplainMetadata(**metadata_dict)

                # Handle streaming if requested and available
                if stream:
                    # Use stream_code_explain_completion to stream the response
                    await stream_code_explain_completion(
                        code_explain_metadata, 
                        self._llm, 
                        message_history,
                        message_id,
                        self.reply,
                        model
                    )
                    return
                else:
                    # Regular non-streaming completion
                    completion = await get_code_explain_completion(code_explain_metadata, self._llm, message_history, model)
            elif type == MessageType.AGENT_EXECUTION:
                agent_execution_metadata = AgentExecutionMetadata(**metadata_dict)
                completion = await get_agent_execution_completion(agent_execution_metadata, self._llm, message_history, model)
            elif type == MessageType.AGENT_AUTO_ERROR_FIXUP:
                agent_auto_error_fixup_metadata = AgentSmartDebugMetadata(**metadata_dict)
                completion = await get_agent_auto_error_fixup_completion(agent_auto_error_fixup_metadata, self._llm, message_history, model)
            elif type == MessageType.INLINE_COMPLETION:
                inline_completer_metadata = InlineCompleterMetadata(**metadata_dict)
                completion = await get_inline_completion(inline_completer_metadata, self._llm, message_history, model)
            else:
                raise ValueError(f"Invalid message type: {type}")
            
            # Create and send reply
            reply = CompletionReply(
                items=[CompletionItem(content=completion, isIncomplete=False)],
                parent_id=message_id
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
        
    def reply(self, reply: Any) -> None:
        """Write a reply object to the WebSocket connection.

        Args:
            reply: The completion reply object.
                It must be a dataclass instance.
        """
        message = asdict(reply)
        super().write_message(message)

    def _send_error(self, change: Dict[str, Any]) -> None:
        """Send an error message to the client."""
        error = change["new"]

        self.reply(
            ErrorMessage(**asdict(error))
            if error is not None
            else ErrorMessage(error_type="", title="No error", traceback="")
        )
