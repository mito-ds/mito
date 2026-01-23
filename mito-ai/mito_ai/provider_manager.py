# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
import asyncio
from typing import Any, Callable, Dict, List, Optional, Union, cast
from mito_ai import constants
from openai.types.chat import ChatCompletionMessageParam
from traitlets import Instance
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
from mito_ai.utils.litellm_utils import is_litellm_configured
from mito_ai.utils.telemetry_utils import (
    MITO_SERVER_KEY,
    USER_KEY,
    log_ai_completion_error,
    log_ai_completion_retry,
    log_ai_completion_success,
)
from mito_ai.utils.provider_utils import get_model_provider
from mito_ai.utils.model_utils import get_available_models, get_fast_model_for_selected_model, get_smartest_model_for_selected_model

__all__ = ["ProviderManager"]

class ProviderManager(LoggingConfigurable):
    """Manage AI providers (Claude, Gemini, OpenAI) and route requests to the appropriate client."""

    last_error = Instance(
        CompletionError,
        allow_none=True,
        help="""Last error encountered when using the OpenAI provider.

This attribute is observed by the websocket provider to push the error to the client.""",
    )

    def __init__(self, **kwargs: Dict[str, Any]) -> None:
        config = kwargs.get('config', {})
        kwargs['config'] = config

        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._openai_client: Optional[OpenAIClient] = OpenAIClient(**config)
        # Initialize with the first available model to ensure it's always valid
        # This respects LiteLLM configuration: if LiteLLM is configured, uses first LiteLLM model
        # Otherwise, uses first standard model
        available_models = get_available_models()
        self._selected_model: str = available_models[0] if available_models else "gpt-4.1"
    
    def get_selected_model(self) -> str:
        """Get the currently selected model."""
        return self._selected_model
    
    def set_selected_model(self, model: str) -> None:
        """Set the selected model."""
        self._selected_model = model

    @property
    def capabilities(self) -> AICapabilities:
        """
        Returns the capabilities of the AI provider.
        """
        # TODO: We should validate that these keys are actually valid for the provider
        # otherwise it will look like we are using the user_key when actually falling back 
        # to the mito server because the key is invalid. 
        if is_litellm_configured():
            return AICapabilities(
                configuration={"model": "<dynamic>"},
                provider="LiteLLM",
            )
            
        if constants.OPENAI_API_KEY:
            return AICapabilities(
                configuration={"model": "<dynamic>"},
                provider="OpenAI",
            )
            
        if constants.ANTHROPIC_API_KEY:
            return AICapabilities(
                configuration={"model": "<dynamic>"},
                provider="Claude",
            )
            
        if constants.GEMINI_API_KEY:
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
        # TODO: We should validate that these keys are actually valid for the provider
        # otherwise it will look like we are using the user_key when actually falling back 
        # to the mito server because the key is invalid. 
        if is_litellm_configured():
            return USER_KEY
        
        if constants.ANTHROPIC_API_KEY or constants.GEMINI_API_KEY or constants.OPENAI_API_KEY or constants.OLLAMA_MODEL:  
            return USER_KEY
        
        return MITO_SERVER_KEY

    async def request_completions(
        self,
        message_type: MessageType,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[ResponseFormatInfo] = None,
        user_input: Optional[str] = None,
        thread_id: Optional[str] = None,
        max_retries: int = 3,
        use_fast_model: bool = False,
        use_smartest_model: bool = False
    ) -> str:
        """
        Request completions from the AI provider.
        
        Args:
            message_type: Type of message
            messages: List of chat messages
            response_format_info: Optional response format specification
            user_input: Optional user input for logging
            thread_id: Optional thread ID for logging
            max_retries: Maximum number of retries
            use_fast_model: If True, use the fastest model from the selected provider
            use_smartest_model: If True, use the smartest model from the selected provider
        """
        self.last_error = None
        completion = None
        last_message_content = str(messages[-1].get('content', '')) if messages else ""
        
        # Get the model to use (selected model, fast model, or smartest model if requested)
        selected_model = self.get_selected_model()
        if use_smartest_model:
            resolved_model = get_smartest_model_for_selected_model(selected_model)
        elif use_fast_model:
            resolved_model = get_fast_model_for_selected_model(selected_model)
        else:
            resolved_model = selected_model
        
        # Validate model is in allowed list (uses same function as endpoint)
        available_models = get_available_models()
        if resolved_model not in available_models:
            raise ValueError(f"Model {resolved_model} is not in the allowed model list: {available_models}")
        
        # Get model provider type
        model_type = get_model_provider(resolved_model)
        
        # Retry loop
        for attempt in range(max_retries + 1):
            try:
                if model_type == "litellm":
                    from mito_ai.enterprise.litellm_client import LiteLLMClient
                    if not constants.LITELLM_BASE_URL:
                        raise ValueError("LITELLM_BASE_URL is required for LiteLLM models")
                    litellm_client = LiteLLMClient(api_key=constants.LITELLM_API_KEY, base_url=constants.LITELLM_BASE_URL)
                    completion = await litellm_client.request_completions(
                        messages=messages,
                        model=resolved_model,
                        response_format_info=response_format_info,
                        message_type=message_type
                    )
                elif model_type == "claude":
                    api_key = constants.ANTHROPIC_API_KEY
                    anthropic_client = AnthropicClient(api_key=api_key)
                    completion = await anthropic_client.request_completions(messages, resolved_model, response_format_info, message_type)
                elif model_type == "gemini":
                    api_key = constants.GEMINI_API_KEY
                    gemini_client = GeminiClient(api_key=api_key)
                    messages_for_gemini = [dict(m) for m in messages]
                    completion = await gemini_client.request_completions(messages_for_gemini, resolved_model, response_format_info, message_type)
                elif model_type == "openai":
                    if not self._openai_client:
                        raise RuntimeError("OpenAI client is not initialized.")
                    completion = await self._openai_client.request_completions(
                        message_type=message_type,
                        messages=messages,
                        model=resolved_model,
                        response_format_info=response_format_info
                    )
                else:
                    raise ValueError(f"No AI provider configured for model: {resolved_model}")
                
                # Success! Log and return
                log_ai_completion_success(
                    key_type=USER_KEY if self.key_type == USER_KEY else MITO_SERVER_KEY,
                    message_type=message_type,
                    last_message_content=last_message_content,
                    response={"completion": completion},
                    user_input=user_input or "",
                    thread_id=thread_id or "",
                    model=resolved_model
                )
                return completion # type: ignore
            
            except PermissionError as e:
                # If we hit a free tier limit, then raise an exception right away without retrying.
                self.log.exception(f"Error during request_completions: {e}")
                self.last_error = CompletionError.from_exception(e)
                log_ai_completion_error(USER_KEY if self.key_type != MITO_SERVER_KEY else MITO_SERVER_KEY, thread_id or "", message_type, e)
                raise

            except BaseException as e:
                # Check if we should retry (not on the last attempt)
                if attempt < max_retries:
                    # Exponential backoff: wait 2^attempt seconds
                    wait_time = 2 ** attempt
                    self.log.info(f"Retrying request_completions after {wait_time}s (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
                    log_ai_completion_retry(USER_KEY if self.key_type != MITO_SERVER_KEY else MITO_SERVER_KEY, thread_id or "", message_type, e)
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    # Final failure after all retries - set error state and raise
                    self.log.exception(f"Error during request_completions after {attempt + 1} attempts: {e}")
                    self.last_error = CompletionError.from_exception(e)
                    log_ai_completion_error(USER_KEY if self.key_type != MITO_SERVER_KEY else MITO_SERVER_KEY, thread_id or "", message_type, e)
                    raise
        
        # This should never be reached due to the raise in the except block,
        # but added to satisfy the linter
        raise RuntimeError("Unexpected code path in request_completions")

    async def stream_completions(
        self,
        message_type: MessageType,
        messages: List[ChatCompletionMessageParam],
        message_id: str,
        thread_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
        user_input: Optional[str] = None,
        response_format_info: Optional[ResponseFormatInfo] = None,
        use_fast_model: bool = False,
        use_smartest_model: bool = False
    ) -> str:
        """
        Stream completions from the AI provider and return the accumulated response.
        
        Args:
            message_type: Type of message
            messages: List of chat messages
            message_id: ID of the message being processed
            thread_id: Thread ID for logging
            reply_fn: Function to call with each chunk for streaming replies
            user_input: Optional user input for logging
            response_format_info: Optional response format specification
            use_fast_model: If True, use the fastest model from the selected provider
            use_smartest_model: If True, use the smartest model from the selected provider
            
        Returns: The accumulated response string.
        """
        self.last_error = None
        accumulated_response = ""
        last_message_content = str(messages[-1].get('content', '')) if messages else ""
        
        # Get the model to use (selected model, fast model, or smartest model if requested)
        selected_model = self.get_selected_model()
        if use_smartest_model:
            resolved_model = get_smartest_model_for_selected_model(selected_model)
        elif use_fast_model:
            resolved_model = get_fast_model_for_selected_model(selected_model)
        else:
            resolved_model = selected_model
                    
        # Validate model is in allowed list (uses same function as endpoint)
        available_models = get_available_models()
        if resolved_model not in available_models:
            raise ValueError(f"Model {resolved_model} is not in the allowed model list: {available_models}")
        
        # Get model provider type
        model_type = get_model_provider(resolved_model)
        reply_fn(CompletionReply(
            items=[
                CompletionItem(content="", isIncomplete=True, token=message_id)
            ],
            parent_id=message_id,
        ))

        try:
            if model_type == "litellm":
                from mito_ai.enterprise.litellm_client import LiteLLMClient
                if not constants.LITELLM_BASE_URL:
                    raise ValueError("LITELLM_BASE_URL is required for LiteLLM models")
                litellm_client = LiteLLMClient(
                    api_key=constants.LITELLM_API_KEY,
                    base_url=constants.LITELLM_BASE_URL
                )
                accumulated_response = await litellm_client.stream_completions(
                    messages=messages,
                    model=resolved_model,
                    message_type=message_type,
                    message_id=message_id,
                    reply_fn=reply_fn,
                    response_format_info=response_format_info
                )
            elif model_type == "claude":
                api_key = constants.ANTHROPIC_API_KEY
                anthropic_client = AnthropicClient(api_key=api_key)
                accumulated_response = await anthropic_client.stream_completions(
                    messages=messages,
                    model=resolved_model,
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
                    model=resolved_model,
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
                    model=resolved_model,
                    message_id=message_id,
                    thread_id=thread_id,
                    reply_fn=reply_fn,
                    user_input=user_input,
                    response_format_info=response_format_info
                )
            else:
                raise ValueError(f"No AI provider configured for model: {resolved_model}")

            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY if self.key_type == USER_KEY else MITO_SERVER_KEY,
                message_type=message_type,
                last_message_content=last_message_content,
                response={"completion": accumulated_response},
                user_input=user_input or "",
                thread_id=thread_id,
                model=resolved_model
            )
            return accumulated_response

        except BaseException as e:
            self.log.exception(f"Error during stream_completions: {e}")
            self.last_error = CompletionError.from_exception(e)
            log_ai_completion_error(USER_KEY if self.key_type != MITO_SERVER_KEY else MITO_SERVER_KEY, thread_id, message_type, e)

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
