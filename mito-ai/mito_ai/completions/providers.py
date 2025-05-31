# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union, Type

from openai import api_key

from mito_ai import constants
from openai.types.chat import ChatCompletionMessageParam
from traitlets import Instance, Unicode, default, validate
from traitlets.config import LoggingConfigurable
from openai.types.chat import ChatCompletionMessageParam

from mito_ai import constants
from mito_ai.enterprise.utils import is_azure_openai_configured
from mito_ai.gemini_client import GeminiClient
from mito_ai.openai_client import OpenAIClient
from mito_ai.anthropic_client import AnthropicClient
from mito_ai.logger import get_logger
from mito_ai.completions.models import (
    AICapabilities,
    CompletionError,
    CompletionItem,
    CompletionItemError,
    CompletionReply,
    CompletionStreamChunk,
    MessageType,
    ResponseFormatInfo,
)
from mito_ai.utils.telemetry_utils import (
    KEY_TYPE_PARAM,
    MITO_AI_COMPLETION_ERROR,
    MITO_SERVER_KEY,
    USER_KEY,
    log,
    log_ai_completion_success,
)

__all__ = ["OpenAIProvider"]


class OpenAIProvider(LoggingConfigurable):
    """Provide AI feature through OpenAI services."""

    api_key = Unicode(
        config=True,
        allow_none=True,
        help="OpenAI API key. Default value is read from the OPENAI_API_KEY environment variable.",
    )

    last_error = Instance(
        CompletionError,
        allow_none=True,
        help="""Last error encountered when using the OpenAI provider.

This attribute is observed by the websocket provider to push the error to the client.""",
    )

    def __init__(self, **kwargs: Dict[str, Any]) -> None:
        # Create config for OpenAI client before parent initialization
        config = kwargs.get('config', {})
        if 'api_key' in kwargs:
            config['OpenAIClient'] = {'api_key': kwargs['api_key']}
        kwargs['config'] = config

        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._openai_client: Optional[OpenAIClient] = None
        self._gemini_client: Optional[GeminiClient] = None
        self._anthropic_client: Optional[AnthropicClient] = None

        # Initialize OpenAI client with the configured api_key
        self._openai_client = OpenAIClient(parent=self)

        # Initialize Gemini client if configured
        if constants.GEMINI_MODEL and constants.GEMINI_API_KEY:
            self._gemini_client = GeminiClient(
                api_key=constants.GEMINI_API_KEY,
                model=constants.GEMINI_MODEL
            )

        # Initialize Anthropic client if configured
        if constants.CLAUDE_MODEL and constants.CLAUDE_API_KEY:
            self._anthropic_client = AnthropicClient(
                api_key=constants.CLAUDE_API_KEY,
                model=constants.CLAUDE_MODEL
            )

    @property
    def capabilities(self) -> AICapabilities:
        """Get the provider capabilities."""
        if constants.CLAUDE_MODEL and constants.CLAUDE_API_KEY and not self.api_key:
            return AICapabilities(
                configuration={
                    "model": constants.CLAUDE_MODEL
                },
                provider="Claude",
            )

        if constants.GEMINI_MODEL and constants.GEMINI_API_KEY and not self.api_key:
            return AICapabilities(
                configuration={
                    "model": constants.GEMINI_MODEL
                },
                provider="Gemini",
            )

        if self._openai_client:
            return self._openai_client.capabilities

        return AICapabilities(
            configuration={
                "model": "gpt-4.1",
            },
            provider="Mito server",
        )

    @property
    def key_type(self) -> str:
        """Returns the authentication key type being used."""
        if constants.CLAUDE_MODEL and constants.CLAUDE_API_KEY and not self.api_key:
            return "claude"

        if constants.GEMINI_MODEL and constants.GEMINI_API_KEY and not self.api_key:
            return "gemini"

        if self._openai_client:
            return self._openai_client.key_type

        return MITO_SERVER_KEY

    async def request_completions(
            self,
            message_type: MessageType,
            messages: List[ChatCompletionMessageParam],
            model: str,
            response_format_info: Optional[ResponseFormatInfo] = None,
            user_input: Optional[str] = None,
            thread_id: Optional[str] = None
    ) -> str:
        """
        Request completions from the AI provider.

        Args:
            message_type: The type of message to request completions for.
            messages: The messages to request completions for.
            model: The model to request completions for.
        Returns:
            The completion from the AI provider.
        """
        # Reset the last error
        self.last_error = None
        completion = None
        last_message_content = str(messages[-1].get('content', '')) if messages else ""

        try:
            # Handle Claude API calls
            if constants.CLAUDE_MODEL and not self.api_key:
                if self._anthropic_client is None:
                    if constants.CLAUDE_API_KEY:
                        self._anthropic_client = AnthropicClient(
                            api_key=constants.CLAUDE_API_KEY,
                            model=constants.CLAUDE_MODEL
                        )
                    else:
                        self._anthropic_client = AnthropicClient(
                            api_key=None,
                            model=constants.CLAUDE_MODEL
                        )
                completion = await self._anthropic_client.request_completions(messages, response_format_info, message_type)

            # Handle Gemini API calls
            elif constants.GEMINI_MODEL and not self.api_key:
                if self._gemini_client is None:
                    if constants.GEMINI_API_KEY:
                        self._gemini_client = GeminiClient(
                            api_key=constants.GEMINI_API_KEY,
                            model=constants.GEMINI_MODEL
                        )
                    else:
                        self._gemini_client = GeminiClient(
                            api_key=None,
                            model=constants.GEMINI_MODEL
                        )
                completion = await self._gemini_client.request_completions(messages, response_format_info, message_type)

            # Handle OpenAI and other providers
            elif self._openai_client:
                completion = await self._openai_client.request_completions(
                    message_type=message_type,
                    messages=messages,
                    model=model,
                    response_format_info=response_format_info
                )
            else:
                raise ValueError("No AI provider configured")

            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY if self.key_type == "user" else MITO_SERVER_KEY,
                message_type=message_type,
                last_message_content=last_message_content,
                response={"completion": completion},
                user_input=user_input or "",
                thread_id=thread_id or ""
            )

            return completion

        except BaseException as e:
            self.log.exception(f"Error during request_completions: {e}")
            self.last_error = CompletionError.from_exception(e)
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: self.key_type}, error=e)
            raise

    async def stream_completions(
            self,
            message_type: MessageType,
            messages: List[ChatCompletionMessageParam],
            model: str,
            message_id: str,
            thread_id: str,
            reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
            user_input: Optional[str] = None,
            response_format_info: Optional[ResponseFormatInfo] = None
    ) -> str:
        """
        Stream completions from the AI provider and return the accumulated response.
        Returns: The accumulated response string.
        """
        # Reset the last error
        self.last_error = None
        accumulated_response = ""
        last_message_content = str(messages[-1].get('content', '')) if messages else ""

        # Send initial acknowledgment
        reply_fn(CompletionReply(
            items=[
                CompletionItem(content="", isIncomplete=True, token=message_id)
            ],
            parent_id=message_id,
        ))

        try:
            # Handle Claude API calls
            if constants.CLAUDE_MODEL and not self.api_key:
                if self._anthropic_client is None:
                    if constants.CLAUDE_API_KEY:
                        self._anthropic_client = AnthropicClient(
                            api_key=constants.CLAUDE_API_KEY,
                            model=constants.CLAUDE_MODEL
                        )
                    else:
                        self._anthropic_client = AnthropicClient(api_key=None, model=constants.CLAUDE_MODEL)

                accumulated_response = await self._anthropic_client.stream_response(
                    messages=messages,
                    message_type=message_type,
                    message_id=message_id,
                    reply_fn=reply_fn
                )

            # Handle Gemini API calls
            elif constants.GEMINI_MODEL and not self.api_key:
                if self._gemini_client is None:
                    if constants.GEMINI_API_KEY:
                        self._gemini_client = GeminiClient(
                            api_key=constants.GEMINI_API_KEY,
                            model=model
                        )
                    else:
                        self._gemini_client = GeminiClient(api_key=None, model=constants.GEMINI_MODEL)

                accumulated_response = await self._gemini_client.stream_completions(
                    messages=messages,
                    message_id=message_id,
                    reply_fn=reply_fn,
                )

            # Handle OpenAI and other providers
            elif self._openai_client:
                accumulated_response = await self._openai_client.stream_completions(
                    message_type=message_type,
                    messages=messages,
                    model=model,
                    message_id=message_id,
                    thread_id=thread_id,
                    reply_fn=reply_fn,
                    user_input=user_input,
                    response_format_info=response_format_info
                )
            else:
                raise ValueError("No AI provider configured")

            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY if self.key_type == "user" else MITO_SERVER_KEY,
                message_type=message_type,
                last_message_content=last_message_content,
                response={"completion": accumulated_response},
                user_input=user_input or "",
                thread_id=thread_id
            )

            return accumulated_response

        except BaseException as e:
            self.last_error = CompletionError.from_exception(e)
            log(
                MITO_AI_COMPLETION_ERROR,
                params={
                    KEY_TYPE_PARAM: self.key_type,
                    'message_type': message_type.value,
                },
                error=e
            )
            # Send error message to client before raising
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="",
                    isIncomplete=True,
                    error=CompletionItemError(
                        message=f"Failed to process completion: {e!r}"
                    ),
                    token=message_id,
                ),
                done=True,
                error=CompletionError.from_exception(e),
            ))
            raise

