import os
import traceback
from typing import AsyncGenerator, Optional, Union

from openai import AsyncOpenAI
from openai._streaming import AsyncStream
from openai.types.chat import ChatCompletionChunk
from traitlets import CFloat, CInt, Unicode, default
from traitlets.config import LoggingConfigurable

from .logger import get_logger
from .models import (
    CompletionError,
    CompletionItem,
    CompletionItemError,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
)
from .utils.db import get_user_field, set_user_field
from .utils.open_ai_utils import get_ai_completion_from_mito_server
from .utils.schema import UJ_AI_MITO_API_NUM_USAGES
from .utils.telemetry_utils import (
    KEY_TYPE_PARAM,
    MITO_AI_COMPLETION_ERROR,
    MITO_AI_COMPLETION_SUCCESS,
    MITO_SERVER_KEY,
    MITO_SERVER_NUM_USAGES,
    USER_KEY,
    log,
)

__all__ = ["OpenAIProvider"]
_num_usages = None


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

    # FIXME add validate function to check if the model is valid
    model = Unicode(
        "gpt-4o-mini", config=True, help="OpenAI model to use for completions"
    )

    temperature = CFloat(
        0,
        config=True,
        help="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.",
    )

    def __init__(self, **kwargs) -> None:
        super().__init__(log=get_logger(), **kwargs)
        self._client: Optional[AsyncOpenAI] = None

    @default("api_key")
    def _api_key_default(self):
        return os.environ.get("OPENAI_API_KEY", "")

    @property
    def can_stream(self) -> bool:
        """Whether the provider supports streaming completions.

        Streaming is only supported if an OpenAI API key is provided.
        """
        return bool(self.api_key)

    @property
    def client(self) -> AsyncOpenAI:
        """Get the asynchronous OpenAI client."""
        if not self._client or self._client.is_closed():
            self._client = AsyncOpenAI(api_key=self.api_key)

        return self._client

    async def _check_authentication(self) -> None:
        # # TODO implement this
        # async for _ in client.models.list():
        #     logging.getLogger("ServerApp").info("%s", _)
        #     break
        ...

    async def request_completions(self, request: CompletionRequest) -> CompletionReply:
        """Get a completion from the OpenAI API.

        Args:
            request: The completion request description.
        Returns:
            The completion
        """
        try:
            if self.api_key:
                self.log.debug("Requesting completion from OpenAI API with personal key.")
                completion = await self.client.chat.completions.create(
                    model=self.model,
                    max_completion_tokens=self.max_completion_tokens,
                    messages=request.messages,
                    temperature=self.temperature,
                )
                # Log the successful completion
                log(MITO_AI_COMPLETION_SUCCESS, params={KEY_TYPE_PARAM: USER_KEY})

                if len(completion.choices) == 0:
                    return CompletionReply(
                        items=[],
                        parent_id=request.message_id,
                        error=CompletionError(
                            type="NoCompletion",
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
                                    insertText=completion.choices[0].message.content
                                    or "",
                                    isIncomplete=False,
                                )
                            ],
                        )
                    except BaseException as e:
                        return CompletionReply(
                            items=[],
                            parent_id=request.message_id,
                            error=CompletionError(
                                type=e.__class__.__name__,
                                title=e.args[0] if e.args else "Exception",
                                traceback=traceback.format_exc(),
                            ),
                        )

            else:
                self.log.debug("Requesting completion from Mito server.")
                global _num_usages
                if _num_usages is None:
                    _num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
                # If they don't have an Open AI key, use the mito server to get a completion
                ai_response = await get_ai_completion_from_mito_server(
                    request.messages[-1].get("content", ""),
                    {
                        "model": self.model,
                        "messages": request.messages,
                        "temperature": self.temperature,
                    },
                    _num_usages or 0,
                )

                # Increment the number of usages
                _num_usages = (_num_usages or 0) + 1
                set_user_field(UJ_AI_MITO_API_NUM_USAGES, _num_usages)

                # Log the successful completion
                log(
                    MITO_AI_COMPLETION_SUCCESS,
                    params={
                        KEY_TYPE_PARAM: MITO_SERVER_KEY,
                        MITO_SERVER_NUM_USAGES: _num_usages,
                    },
                )

                return CompletionReply(
                    parent_id=request.message_id,
                    items=[
                        CompletionItem(
                            insertText=ai_response,
                            isIncomplete=False,
                        )
                    ],
                )
        except BaseException as e:
            key_type = MITO_SERVER_KEY if self.api_key is None else USER_KEY
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: key_type}, error=e)
            raise

    async def stream_completions(
        self, request: CompletionRequest
    ) -> AsyncGenerator[Union[CompletionReply, CompletionStreamChunk], None]:
        """Stream completions from the OpenAI API.

        Args:
            request: The completion request description.
        Returns:
            An async generator yielding first an acknowledge completion reply without
            completion and then completion chunks from the third-party provider.
        """
        # The streaming completion has two steps:
        # Step 1: Acknowledge the request
        # Step 2: Stream the completion chunks coming from the OpenAI API

        # Acknowledge the request
        yield CompletionReply(
            items=[
                CompletionItem(
                    insertText="", isIncomplete=True, token=request.message_id
                )
            ],
            parent_id=request.message_id,
        )

        # Send the completion request to the OpenAI API and returns a stream of completion chunks
        try:
            stream: AsyncStream[
                ChatCompletionChunk
            ] = await self.client.chat.completions.create(
                model=self.model,
                stream=True,
                max_completion_tokens=self.max_completion_tokens,
                messages=request.messages,
                temperature=self.temperature,
            )
            # Log the successful completion
            log(MITO_AI_COMPLETION_SUCCESS, params={KEY_TYPE_PARAM: USER_KEY})
        except BaseException as e:
            log(MITO_AI_COMPLETION_ERROR, params={KEY_TYPE_PARAM: USER_KEY}, error=e)
            raise

        async for chunk in stream:
            try:
                is_finished = chunk.choices[0].finish_reason is not None
                yield CompletionStreamChunk(
                    parent_id=request.message_id,
                    chunk=CompletionItem(
                        insertText=chunk.choices[0].delta.content or "",
                        isIncomplete=True,
                        token=request.message_id,
                    ),
                    done=is_finished,
                )
            except BaseException as e:
                yield CompletionStreamChunk(
                    parent_id=request.message_id,
                    chunk=CompletionItem(
                        insertText="",
                        isIncomplete=True,
                        error=CompletionItemError(
                            message=f"Failed to parse chunk completion: {e!r}"
                        ),
                        token=request.message_id,
                    ),
                    done=True,
                    error=CompletionError(
                        type=e.__class__.__name__,
                        title=e.args[0] if e.args else "Exception",
                        traceback=traceback.format_exc(),
                    ),
                )
                break
