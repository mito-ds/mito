from __future__ import annotations

import os
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

import openai
from openai._streaming import AsyncStream
from openai.types.chat import ChatCompletionChunk
from traitlets import CFloat, CInt, Instance, TraitError, Unicode, default, validate, List
from traitlets.config import LoggingConfigurable

from .logger import get_logger
from .models import (
    AICapabilities,
    CompletionError,
    CompletionItem,
    CompletionItemError,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
)
from .utils.db import get_user_field, set_user_field
from .utils.open_ai_utils import (
    check_mito_server_quota,
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
)
from .utils.schema import UJ_AI_MITO_API_NUM_USAGES, UJ_MITO_AI_FIRST_USAGE_DATE
from .utils.telemetry_utils import (
    KEY_TYPE_PARAM,
    MITO_AI_COMPLETION_ERROR,
    MITO_SERVER_KEY,
    USER_KEY,
    log,
    log_ai_completion_success,
)

__all__ = ["OpenAIProvider"]
_num_usages = None
_first_usage_date = None

class OpenAIProvider(LoggingConfigurable):
    """Provide AI feature through OpenAI services."""

    api_key = Unicode(
        config=True,
        help="OpenAI API key. Default value is read from the OPENAI_API_KEY environment variable.",
    )
    
    max_completion_tokens = CInt(
        None,
        allow_none=True,
        config=True,
        help="An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens.",
    )
    
    models = List(['gpt-4o-mini', 'o3-mini'])
    
    last_error = Instance(
        CompletionError,
        allow_none=True,
        help="""Last error encountered when using the OpenAI provider.

This attribute is observed by the websocket provider to push the error to the client.""",
    )
    
    def __init__(self, **kwargs) -> None:
        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._client: Optional[openai.AsyncOpenAI] = None
        self._models: Optional[List[str]] = None

    @default("api_key")
    def _api_key_default(self):
        default_key = os.environ.get("OPENAI_API_KEY", "")
        return self._validate_api_key({"value": default_key})

    @validate("api_key")
    def _validate_api_key(self, changes: Dict[str, Any]) -> str:
        """"""
        api_key = changes["value"]
        if not api_key:
            self.log.debug(
                "No OpenAI API key provided; following back to Mito server API."
            )
            return ""

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
            return ""
        except openai.PermissionDeniedError as e:
            self.log.warning(
                "Invalid OpenAI API key provided.",
                exc_info=e,
            )
            self.last_error = CompletionError.from_exception(e)
            return ""
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
            return ""
        else:
            self.log.debug("User OpenAI API key validated.")
            return api_key

    @validate("max_completion_tokens")
    def _validate_max_completion_tokens(
        self, proposal: Dict[str, Any]
    ) -> Optional[int]:
        max_completion_tokens = proposal["value"]
        if max_completion_tokens is not None and max_completion_tokens < 1:
            raise TraitError(
                f"Invalid max_completion_tokens {max_completion_tokens}; must be greater than 0."
            )
        return max_completion_tokens

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
            self._validate_api_key({"value": self.api_key})

        # If the user has an OpenAI API key, then we don't need to check the Mito server quota.
        if self.api_key:
            return AICapabilities(
                configuration={
                    "model": self.models,
                },
                provider="OpenAI (user key)",
            )

        # Get the number of usages
        global _num_usages
        if _num_usages is None:
            _num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)

        # Get the first usage date
        global _first_usage_date
        _first_usage_date = get_user_field(UJ_MITO_AI_FIRST_USAGE_DATE)
        if _first_usage_date is None:
            from datetime import datetime
            today = datetime.today().strftime('%Y-%m-%d')
            try:
                set_user_field(UJ_MITO_AI_FIRST_USAGE_DATE, today)
            except Exception as e:
                self.log.warning("Failed to set first usage date in user.json", exc_info=e)

        try:
            check_mito_server_quota(_num_usages or 0, _first_usage_date or "")
        except Exception as e:
            self.last_error = CompletionError.from_exception(e)

        return AICapabilities(
            configuration={
                "max_completion_tokens": self.max_completion_tokens,
                "model": self.models,
            },
            provider="Mito server",
        )

    @property
    def _openAI_client(self) -> Optional[openai.AsyncOpenAI]:
        """Get the asynchronous OpenAI client."""
        if not self.api_key:
            return None

        if not self._client or self._client.is_closed():
            self._client = openai.AsyncOpenAI(api_key=self.api_key)

        return self._client

    async def request_completions(self, request: CompletionRequest, prompt_type: str, model: str) -> CompletionReply:
        """Get a completion from the OpenAI API.

        Args:
            request: The completion request description.
            prompt_type: The type of prompt that was sent to the AI (e.g. "chat", "smart_debug", "explain")
        Returns:
            The completion
        """
        self.last_error = None
        try:
            if self._openAI_client:
                self.log.debug(
                    "Requesting completion from OpenAI API with personal key."
                )
                
                # Validate that the model is supported. If not fall back to gpt-4o-mini
                if model not in self.models:
                    model = "gpt-4o-mini"

                self.log.debug(f"Requesting completion from OpenAI API with model: {model}")
                completion_function_params = get_open_ai_completion_function_params(model, self.max_completion_tokens, request.messages)
                completion = await self._openAI_client.chat.completions.create(**completion_function_params)
                # Log the successful completion
                log_ai_completion_success(
                    key_type=USER_KEY,
                    prompt_type=prompt_type,
                    last_message_content=str(request.messages[-1].get('content', '')),
                    response={"completion": completion.choices[0].message.content},
                )

                if len(completion.choices) == 0:
                    return CompletionReply(
                        items=[],
                        parent_id=request.message_id,
                        error=CompletionError(
                            error_type="NoCompletion",
                            title="No completion returned from the OpenAI API.",
                            traceback="",
                        ),
                    )
                else:
                    try:
                        return CompletionReply(
                            parent_id=request.message_id,
                            items=[
                                CompletionItem(
                                    content=completion.choices[0].message.content or "",
                                    isIncomplete=False,
                                )
                            ],
                        )
                    except BaseException as e:
                        return CompletionReply(
                            items=[],
                            parent_id=request.message_id,
                            error=CompletionError.from_exception(e),
                        )

            else:
                # If they don't have an Open AI key, use the mito server to get a completion
                self.log.debug("Requesting completion from Mito server.")
                global _num_usages
                if _num_usages is None:
                    _num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
                
                completion_function_params = get_open_ai_completion_function_params(model, self.max_completion_tokens, request.messages)
                ai_response = await get_ai_completion_from_mito_server(
                    request.messages[-1].get("content", ""),
                    completion_function_params,
                    _num_usages or 0,
                    _first_usage_date or "",
                )

                # Increment the number of usages for everything EXCEPT inline completions.
                # Inline completions are limited to 30 days, not number of usages.
                if prompt_type != "inline_completion":
                    _num_usages = (_num_usages or 0) + 1
                    set_user_field(UJ_AI_MITO_API_NUM_USAGES, _num_usages)

                # Log the successful completion
                log_ai_completion_success(
                    key_type=MITO_SERVER_KEY,
                    prompt_type=prompt_type,
                    last_message_content=str(request.messages[-1].get('content', '')),
                    response={"completion": ai_response},
                    num_usages=_num_usages,
                )

                return CompletionReply(
                    parent_id=request.message_id,
                    items=[
                        CompletionItem(
                            content=ai_response,
                            isIncomplete=False,
                        )
                    ],
                )
        except BaseException as e:
            self.last_error = CompletionError.from_exception(e)
            key_type = MITO_SERVER_KEY if self.api_key is None else USER_KEY
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: key_type}, error=e)
            raise

    async def stream_completions(
        self, request: CompletionRequest, prompt_type: str, model: str
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
            completion_function_params = get_open_ai_completion_function_params(model, self.max_completion_tokens, request.messages)
            stream: AsyncStream[
                ChatCompletionChunk
            ] = await self._openAI_client.chat.completions.create(**completion_function_params)
            # Log the successful completion
            log_ai_completion_success(
                key_type=USER_KEY,
                prompt_type=prompt_type,
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
