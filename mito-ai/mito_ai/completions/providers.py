# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
import asyncio
from typing import Any, Callable, Dict, List, Optional, Union, cast
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
    ResponseFormatInfo, CompletionItemError,
)
from mito_ai.utils.telemetry_utils import (
    KEY_TYPE_PARAM,
    MITO_AI_COMPLETION_ERROR,
    MITO_AI_COMPLETION_RETRY,
    MITO_SERVER_KEY,
    USER_KEY,
    log,
    log_ai_completion_error,
    log_ai_completion_retry,
    log_ai_completion_success,
)
from mito_ai.utils.provider_utils import get_model_provider
from mito_ai.utils.mito_server_utils import ProviderCompletionException

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
        config = kwargs.get('config', {})
        if 'api_key' in kwargs:
            config['OpenAIClient'] = {'api_key': kwargs['api_key']}
        kwargs['config'] = config

        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._openai_client: Optional[OpenAIClient] = OpenAIClient(**config)

    @property
    def capabilities(self) -> AICapabilities:
        """
        Returns the capabilities of the AI provider.
        """
        if constants.CLAUDE_API_KEY and not self.api_key:
            return AICapabilities(
                configuration={"model": "<dynamic>"},
                provider="Claude",
            )
        if constants.GEMINI_API_KEY and not self.api_key:
            return AICapabilities(
                configuration={"model": "<dynamic>"},
                provider="Gemini",
            )
        if self._openai_client:
            return self._openai_client.capabilities
        
        return AICapabilities(
            configuration={"model": "<dynamic>"},
            provider="Mito server",
        )

    @property
    def key_type(self) -> str:
        if constants.CLAUDE_API_KEY and not self.api_key:
            return "claude"
        if constants.GEMINI_API_KEY and not self.api_key:
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
        thread_id: Optional[str] = None,
        max_retries: int = 3
    ) -> str:
        """
        Request completions from the AI provider.
        """
        self.last_error = None
        completion = None
        last_message_content = str(messages[-1].get('content', '')) if messages else ""
        model_type = get_model_provider(model)
        
        # Retry loop
        for attempt in range(max_retries + 1):
            try:
                if model_type == "claude":
                    api_key = constants.CLAUDE_API_KEY
                    anthropic_client = AnthropicClient(api_key=api_key)
                    completion = await anthropic_client.request_completions(messages, model, response_format_info, message_type)
                elif model_type == "gemini":
                    api_key = constants.GEMINI_API_KEY
                    gemini_client = GeminiClient(api_key=api_key)
                    messages_for_gemini = [dict(m) for m in messages]
                    completion = await gemini_client.request_completions(messages_for_gemini, model, response_format_info, message_type)
                elif model_type == "openai":
                    if not self._openai_client:
                        raise RuntimeError("OpenAI client is not initialized.")
                    completion = await self._openai_client.request_completions(
                        message_type=message_type,
                        messages=messages,
                        model=model,
                        response_format_info=response_format_info
                    )
                else:
                    raise ValueError(f"No AI provider configured for model: {model}")
                
                # Success! Log and return
                log_ai_completion_success(
                    key_type=USER_KEY if self.key_type == "user" else MITO_SERVER_KEY,
                    message_type=message_type,
                    last_message_content=last_message_content,
                    response={"completion": completion},
                    user_input=user_input or "",
                    thread_id=thread_id or "",
                    model=model
                )
                return completion # type: ignore
            
            except PermissionError as e:
                # If we hit a free tier limit, then raise an exception right away without retrying.
                self.log.exception(f"Error during request_completions: {e}")
                self.last_error = CompletionError.from_exception(e)
                log_ai_completion_error('user_key' if self.key_type != MITO_SERVER_KEY else 'mito_server_key', message_type, e)
                raise

            except BaseException as e:
                # Check if we should retry (not on the last attempt)
                if attempt < max_retries:
                    # Exponential backoff: wait 2^attempt seconds
                    wait_time = 2 ** attempt
                    self.log.info(f"Retrying request_completions after {wait_time}s (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
                    log_ai_completion_retry('user_key' if self.key_type != MITO_SERVER_KEY else 'mito_server_key', message_type, e)
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    # Final failure after all retries - set error state and raise
                    self.log.exception(f"Error during request_completions after {attempt + 1} attempts: {e}")
                    self.last_error = CompletionError.from_exception(e)
                    log_ai_completion_error('user_key' if self.key_type != MITO_SERVER_KEY else 'mito_server_key', message_type, e)
                    raise
        
        # This should never be reached due to the raise in the except block,
        # but added to satisfy the linter
        raise RuntimeError("Unexpected code path in request_completions")

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
        self.last_error = None
        accumulated_response = ""
        last_message_content = str(messages[-1].get('content', '')) if messages else ""
        model_type = get_model_provider(model)
        reply_fn(CompletionReply(
            items=[
                CompletionItem(content="", isIncomplete=True, token=message_id)
            ],
            parent_id=message_id,
        ))

        try:
            if model_type == "claude":
                api_key = constants.CLAUDE_API_KEY
                anthropic_client = AnthropicClient(api_key=api_key)
                accumulated_response = await anthropic_client.stream_completions(
                    messages=messages,
                    model=model,
                    message_type=message_type,
                    message_id=message_id,
                    reply_fn=reply_fn
                )
            elif model_type == "gemini":
                api_key = constants.GEMINI_API_KEY
                gemini_client = GeminiClient(api_key=api_key)
                # TODO: We shouldn't need to do this because the messages should already be dictionaries... 
                # but if we do have to do some pre-processing, we should do it in the gemini_client instead.
                messages_for_gemini = [dict(m) for m in messages]
                accumulated_response = await gemini_client.stream_completions(
                    messages=messages_for_gemini,
                    model=model,
                    message_id=message_id,
                    reply_fn=reply_fn,
                    message_type=message_type
                )
            elif model_type == "openai":
                if not self._openai_client:
                    raise RuntimeError("OpenAI client is not initialized.")
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
                raise ValueError(f"No AI provider configured for model: {model}")

            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY if self.key_type == "user" else MITO_SERVER_KEY,
                message_type=message_type,
                last_message_content=last_message_content,
                response={"completion": accumulated_response},
                user_input=user_input or "",
                thread_id=thread_id,
                model=model
            )
            return accumulated_response

        except BaseException as e:
            self.log.exception(f"Error during stream_completions: {e}")
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

