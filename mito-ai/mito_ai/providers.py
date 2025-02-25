from __future__ import annotations

import os
from typing import Any, AsyncGenerator, Dict, List, Optional, Union, Type

import openai
from openai._streaming import AsyncStream
from openai.types.chat import ChatCompletionChunk, ChatCompletionMessageParam
from traitlets import  Instance, Unicode, default, validate
from pydantic import BaseModel
from traitlets.config import LoggingConfigurable

from mito_ai.logger import get_logger
from mito_ai.models import (
    AICapabilities,
    CompletionError,
    CompletionItem,
    CompletionItemError,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    MessageType,
)
from mito_ai.utils.open_ai_utils import (
    check_mito_server_quota,
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
    update_mito_server_quota,
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
    
    models: List[str] = ['gpt-4o-mini', 'o3-mini']
    
    last_error = Instance(
        CompletionError,
        allow_none=True,
        help="""Last error encountered when using the OpenAI provider.

This attribute is observed by the websocket provider to push the error to the client.""",
    )
    
    
    # Consider the request a failure if it takes longer than 45 seconds.
    # We will try a total of 3 times. Once on the initial request, 
    # and then twice more if the first request fails.
    # Note that max_retries cannot be set to None. If we want to disable it, set it to 0.
    timeout = 45
    max_retries = 2

    def __init__(self, **kwargs: Dict[str, Any]) -> None:
        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._async_client: Optional[openai.AsyncOpenAI] = None
        self._sync_client: Optional[openai.OpenAI] = None
        self._models: Optional[List[str]] = None

    @default("api_key")
    def _api_key_default(self) -> Optional[str]:
        default_key = os.environ.get("OPENAI_API_KEY")
        return self._validate_api_key(default_key)

    @validate("api_key")
    def _validate_api_key(self, api_key: Optional[str]) -> Optional[str]:
        if not api_key:
            self.log.debug(
                "No OpenAI API key provided; following back to Mito server API."
            )
            return None

        client = openai.OpenAI(api_key=api_key)
        models = []
        try:
            # Make an http request to OpenAI to get the models available
            # for this API key.
            # And then handle the exceptions if they are thrown.
            for model in client.models.list():
                models.append(model.id)
            self._models = models
        except openai.AuthenticationError as e:
            self.log.warning(
                "Invalid OpenAI API key provided.",
                exc_info=e,
            )
            self.last_error = CompletionError.from_exception(
                e,
                hint="You're missing the OPENAI_API_KEY environment variable. Run the following code in your terminal to set the environment variable and then relaunch the jupyter server `export OPENAI_API_KEY=<your-api-key>`",
            )
            return None
        except openai.PermissionDeniedError as e:
            self.log.warning(
                "Invalid OpenAI API key provided.",
                exc_info=e,
            )
            self.last_error = CompletionError.from_exception(e)
            return None
        except openai.InternalServerError as e:
            self.log.debug(
                "Unable to get OpenAI models due to OpenAI error.", exc_info=e
            )
            return api_key
        except openai.RateLimitError as e:
            self.log.debug(
                "Unable to get OpenAI models due to rate limit error.", exc_info=e
            )
            return api_key
        except openai.APIConnectionError as e:
            self.log.warning(
                "Unable to connect to OpenAI API.",
                exec_info=e,
            )
            self.last_error = CompletionError.from_exception(e)
            return None
        else:
            self.log.debug("User OpenAI API key validated.")
            return api_key

    @property
    def can_stream(self) -> bool:
        """Whether the provider supports streaming completions.

        Streaming is only supported if an OpenAI API key is provided.
        """
        return bool(self.api_key)

    @property
    def capabilities(self) -> AICapabilities:
        """Get the provider capabilities.

        Returns:
            The provider capabilities.
        """
        if self._models is None:
            self._validate_api_key(self.api_key)

        # If the user has an OpenAI API key, then we don't need to check the Mito server quota.
        if self.api_key:
            return AICapabilities(
                configuration={
                    "model": self.models,
                },
                provider="OpenAI (user key)",
            )

        try:
            check_mito_server_quota()
        except Exception as e:
            self.log.warning("Failed to set first usage date in user.json", exc_info=e)
            self.last_error = CompletionError.from_exception(e)

        return AICapabilities(
            configuration={
                "model": self.models,
            },
            provider="Mito server",
        )

    @property
    def _openAI_async_client(self) -> Optional[openai.AsyncOpenAI]:
        """Get the asynchronous OpenAI client."""
        if not self.api_key:
            return None

        if not self._async_client or self._async_client.is_closed():
            self._async_client = openai.AsyncOpenAI(
                api_key=self.api_key,
                max_retries=self.max_retries,
                timeout=self.timeout
            )

        return self._async_client
    
    @property
    def _openAI_sync_client(self) -> Optional[openai.OpenAI]:
        """Get the synchronous OpenAI client."""
        if not self.api_key:
            return None

        if not self._sync_client or self._sync_client.is_closed():
            self._sync_client = openai.OpenAI(
                api_key=self.api_key,
                max_retries=self.max_retries,
                timeout=self.timeout
            )
            
        return self._sync_client
        
        
    async def request_completions(
        self,
        message_type: MessageType,
        messages: List[ChatCompletionMessageParam], 
        model: str,
        response_format: Optional[Type[BaseModel]] = None
    ) -> str:
        """
        Request completions from the OpenAI API.
        
        Args:
            message_type: The type of message to request completions for.
            messages: The messages to request completions for.
            model: The model to request completions for.
        Returns:
            The completion from the OpenAI API.
        """
        try:
            # Reset the last error
            self.last_error = None
            
            # If we're using the user's key, make sure the model is supported.
            if self._openAI_sync_client and model not in self.models:
                model = "gpt-4o-mini"
        
            completion_function_params = get_open_ai_completion_function_params(
                model, messages, False, response_format
            )
            
            completion = None
            if self._openAI_sync_client is not None:
                self.log.debug(f"Requesting completion from OpenAI API with personal key with model: {model}")
                
                completion = self._openAI_sync_client.chat.completions.create(**completion_function_params)
                completion = completion.choices[0].message.content or ""
            else: 
                self.log.debug(f"Requesting completion from Mito server with model {model}.")
                
                last_message_content = str(messages[-1].get("content", "")) if messages else None
                completion = await get_ai_completion_from_mito_server(
                    last_message_content,
                    completion_function_params,
                    self.timeout,
                    self.max_retries,
                )
                
                update_mito_server_quota(message_type)
            
            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY if self._openAI_sync_client is not None else MITO_SERVER_KEY,
                message_type=message_type,
                last_message_content=str(messages[-1].get('content', '')),
                response={"completion": completion},
            )
            
            # Finally, return the completion
            return completion # type: ignore
                
        except BaseException as e:
            self.last_error = CompletionError.from_exception(e)
            key_type = MITO_SERVER_KEY if self.api_key is None else USER_KEY
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: key_type}, error=e)
            raise


    async def stream_completions(
        self, request: CompletionRequest, message_type: MessageType, model: str
    ) -> AsyncGenerator[Union[CompletionReply, CompletionStreamChunk], None]:
        """Stream completions from the OpenAI API.

        Args:
            request: The completion request description.
            prompt_type: The type of prompt that was sent to the AI (e.g. "chat", "smart_debug", "explain")
        Returns:
            An async generator yielding first an acknowledge completion reply without
            completion and then completion chunks from the third-party provider.
        """
        # The streaming completion has two steps:
        # Step 1: Acknowledge the request
        # Step 2: Stream the completion chunks coming from the OpenAI API
        self.last_error = None

        # Acknowledge the request
        yield CompletionReply(
            items=[
                CompletionItem(content="", isIncomplete=True, token=request.message_id)
            ],
            parent_id=request.message_id,
        )
        
        # Validate that the model is supported. If not fall back to gpt-4o-mini
        if model not in self.models:
            model = "gpt-4o-mini"

        # Send the completion request to the OpenAI API and returns a stream of completion chunks
        try:
            completion_function_params = get_open_ai_completion_function_params(model, request.messages, stream=True)
            client = self._openAI_async_client
            if client is None:
                raise ValueError("OpenAI client not initialized")
            stream: AsyncStream[ChatCompletionChunk] = await client.chat.completions.create(**completion_function_params)
            
            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY,
                message_type=message_type,
                last_message_content=str(request.messages[-1].get('content', '')),
                response={"completion": "not available for streamed completions"},
            )
            
        except BaseException as e:
            self.last_error = CompletionError.from_exception(e)
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: USER_KEY}, error=e)
            raise

        async for chunk in stream:
            try:
                is_finished = chunk.choices[0].finish_reason is not None
                yield CompletionStreamChunk(
                    parent_id=request.message_id,
                    chunk=CompletionItem(
                        content=chunk.choices[0].delta.content or "",
                        isIncomplete=True,
                        token=request.message_id,
                    ),
                    done=is_finished,
                )
            except BaseException as e:
                self.last_error = CompletionError.from_exception(e)
                yield CompletionStreamChunk(
                    parent_id=request.message_id,
                    chunk=CompletionItem(
                        content="",
                        isIncomplete=True,
                        error=CompletionItemError(
                            message=f"Failed to parse chunk completion: {e!r}"
                        ),
                        token=request.message_id,
                    ),
                    done=True,
                    error=CompletionError.from_exception(e),
                )
                break
