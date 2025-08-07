# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union

from mito_ai.utils.mito_server_utils import ProviderCompletionException
import openai
from openai.types.chat import ChatCompletionMessageParam
from traitlets import Instance, Unicode, default, validate
from traitlets.config import LoggingConfigurable

from mito_ai import constants
from mito_ai.enterprise.utils import is_azure_openai_configured
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
from mito_ai.utils.open_ai_utils import (
    check_mito_server_quota,
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
    stream_ai_completion_from_mito_server,
)
from mito_ai.utils.server_limits import update_mito_server_quota
from mito_ai.utils.telemetry_utils import (
    MITO_SERVER_KEY,
    USER_KEY,
)

OPENAI_MODEL_FALLBACK = "gpt-5"

class OpenAIClient(LoggingConfigurable):
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

    # Consider the request a failure if it takes longer than 45 seconds.
    # We will try a total of 3 times. Once on the initial request,
    # and then twice more if the first request fails.
    # Note that max_retries cannot be set to None. If we want to disable it, set it to 0.
    timeout = 30
    max_retries = 1

    def __init__(self, **kwargs: Dict[str, Any]) -> None:
        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._async_client: Optional[openai.AsyncOpenAI] = None

    @default("api_key")
    def _api_key_default(self) -> Optional[str]:
        default_key = constants.OPENAI_API_KEY
        return self._validate_api_key(default_key)

    @validate("api_key")
    def _validate_api_key(self, api_key: Optional[str]) -> Optional[str]:
        if not api_key:
            self.log.debug(
                "No OpenAI API key provided; following back to Mito server API."
            )
            return None

        client = openai.OpenAI(api_key=api_key)
        try:
            # Make an http request to OpenAI to make sure it works
            client.models.list()
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
    def capabilities(self) -> AICapabilities:
        """Get the provider capabilities."""

        if is_azure_openai_configured():
            return AICapabilities(
                configuration={
                    "model": constants.AZURE_OPENAI_MODEL
                },
                provider="Azure OpenAI",
            )

        if constants.OLLAMA_MODEL and not self.api_key:
            return AICapabilities(
                configuration={
                    "model": constants.OLLAMA_MODEL
                },
                provider="Ollama",
            )

        if self.api_key:
            self._validate_api_key(self.api_key)

            return AICapabilities(
                configuration={
                    "model": OPENAI_MODEL_FALLBACK,
                },
                provider="OpenAI (user key)",
            )

        try:
            check_mito_server_quota(MessageType.CHAT)
        except Exception as e:
            self.log.warning("Failed to set first usage date in user.json", exc_info=e)
            self.last_error = CompletionError.from_exception(e)

        return AICapabilities(
            configuration={
                "model": OPENAI_MODEL_FALLBACK,
            },
            provider="Mito server",
        )

    @property
    def _active_async_client(self) -> Optional[openai.AsyncOpenAI]:
        if not self._async_client or self._async_client.is_closed():
            self._async_client = self._build_openai_client()
        return self._async_client
    
    
    @property
    def key_type(self) -> str:
        """Returns the authentication key type being used."""

        if self.api_key:
            return USER_KEY

        if constants.OLLAMA_MODEL:
            return "ollama"

        return MITO_SERVER_KEY

    def _build_openai_client(self) -> Optional[Union[openai.AsyncOpenAI, openai.AsyncAzureOpenAI]]:
        base_url = None
        llm_api_key = None
        
        if is_azure_openai_configured():
            self.log.debug(f"Using Azure OpenAI with model: {constants.AZURE_OPENAI_MODEL}")
                
            # The format for using Azure OpenAI is different than using
            # other providers, so we have a special case for it here.
            # Create Azure OpenAI client with explicit arguments
            return openai.AsyncAzureOpenAI(
                api_key=constants.AZURE_OPENAI_API_KEY,
                api_version=constants.AZURE_OPENAI_API_VERSION,
                azure_endpoint=constants.AZURE_OPENAI_ENDPOINT, # type: ignore
                max_retries=self.max_retries,
                timeout=self.timeout,
            )
        
        elif constants.OLLAMA_MODEL and not self.api_key:
            base_url = constants.OLLAMA_BASE_URL
            llm_api_key = "ollama"
            self.log.debug(f"Using Ollama with model: {constants.OLLAMA_MODEL}")
        elif self.api_key:
            llm_api_key = self.api_key
            self.log.debug("Using OpenAI with user-provided API key")
        else:
            self.log.warning("No valid API key or model configuration provided")
            return None

        # Create the client with explicit arguments to satisfy type checking
        client = openai.AsyncOpenAI(
            api_key=llm_api_key,
            max_retries=self.max_retries,
            timeout=self.timeout,
            base_url=base_url if base_url else None,
        )
        return client

    def _adjust_model_for_azure_or_ollama(self, model: str) -> str:
        
        # If they have set an Azure OpenAI model, then we always use it
        if is_azure_openai_configured() and constants.AZURE_OPENAI_MODEL is not None:
            self.log.debug(f"Resolving to Azure OpenAI model: {constants.AZURE_OPENAI_MODEL}")
            return constants.AZURE_OPENAI_MODEL
        
        # If they have set an Ollama model, then we use it
        if constants.OLLAMA_MODEL is not None:
            return constants.OLLAMA_MODEL
        
        # Otherwise, we use the model they provided
        return model
        

    async def request_completions(
            self,
            message_type: MessageType,
            messages: List[ChatCompletionMessageParam],
            model: str,
            response_format_info: Optional[ResponseFormatInfo] = None,
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
        # Reset the last error
        self.last_error = None
        completion = None
        
        # Note: We don't catch exceptions here because we want them to bubble up 
        # to the providers file so we can handle all client exceptions in one place.

        # Handle other providers as before
        completion_function_params = get_open_ai_completion_function_params(
            message_type, model, messages, False, response_format_info
        )
        
        # If they have set an Azure OpenAI or Ollama model, then we use it
        completion_function_params["model"] = self._adjust_model_for_azure_or_ollama(completion_function_params["model"])

        if self._active_async_client is not None:
            response = await self._active_async_client.chat.completions.create(**completion_function_params)
            completion = response.choices[0].message.content or ""
        else: 
            last_message_content = str(messages[-1].get("content", "")) if messages else None
            completion = await get_ai_completion_from_mito_server(
                last_message_content,
                completion_function_params,
                self.timeout,
                self.max_retries,
                message_type,
            )

        return completion

    
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
        Stream completions from the OpenAI API and return the accumulated response.
        Returns: The accumulated response string.
        """
        # Reset the last error
        self.last_error = None
        accumulated_response = ""
            
        # Send initial acknowledgment
        reply_fn(CompletionReply(
            items=[
                CompletionItem(content="", isIncomplete=True, token=message_id)
            ],
            parent_id=message_id,
        ))

        # Handle other providers as before
        completion_function_params = get_open_ai_completion_function_params(
            message_type, model, messages, True, response_format_info
        )
        
        completion_function_params["model"] = self._adjust_model_for_azure_or_ollama(completion_function_params["model"])

        try:
            if self._active_async_client is not None:
                # Stream from OpenAI
                client = self._active_async_client
                if client is None:
                    raise ValueError("OpenAI client not initialized")
                
                stream = await client.chat.completions.create(**completion_function_params)

                async for chunk in stream:
                    if len(chunk.choices) == 0:
                        continue
                    
                    is_finished = chunk.choices[0].finish_reason is not None
                    content = chunk.choices[0].delta.content or ""
                    accumulated_response += content
                    
                    reply_fn(CompletionStreamChunk(
                        parent_id=message_id,
                        chunk=CompletionItem(
                            content=content,
                            isIncomplete=True,
                            token=message_id,
                        ),
                        done=is_finished,
                    ))
            else:
                # Stream from Mito server
                last_message_content = str(messages[-1].get("content", "")) if messages else ""
                async for chunk_from_mito_server in stream_ai_completion_from_mito_server(
                    last_message_content,
                    completion_function_params,
                    self.timeout,
                    self.max_retries,
                    message_type,
                    reply_fn=reply_fn,
                    message_id=message_id,
                ):
                    accumulated_response += str(chunk_from_mito_server)
                
                # Update quota after streaming is complete
                update_mito_server_quota(message_type)

            return accumulated_response

        except BaseException as e:
            self.last_error = CompletionError.from_exception(e)
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