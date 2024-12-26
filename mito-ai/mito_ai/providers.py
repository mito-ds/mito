import os
from typing import AsyncGenerator, List, Optional, Union

from jinja2 import DictLoader, Environment
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionChunk
from openai._streaming import AsyncStream
from traitlets import Unicode, default
from traitlets.config import LoggingConfigurable

from .models import (
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionReply,
    InlineCompletionRequest,
    InlineCompletionStreamChunk,
)

__all__ = ["OpenAIProvider"]


COMPLETION_SYSTEM_PROMPT = """
You are an application built to provide helpful code completion suggestions.
You should only produce code. Keep comments to minimum, use the
programming language comment syntax. Produce clean executable code.
The code is written for a data analysis and code development
environment which can execute code to produce graphics, tables and
interactive outputs.
"""


COMPLETION_DEFAULT_TEMPLATE = """
The document is called `{{filename}}` and written in {{language}}.
"""


class OpenAIProvider(LoggingConfigurable):
    """Provide AI feature through OpenAI services."""
    # Internally it uses jinja2 template to render prompt messages.

    api_key = Unicode(
        config=True,
        help="OpenAI API key. Default value is read from the OPENAI_API_KEY environment variable.",
    )

    # FIXME add validate function to check if the model is valid
    model = Unicode(
        "gpt-4o-mini", config=True, help="OpenAI model to use for completions"
    )

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._client: Optional[AsyncOpenAI] = None
        # Load jinja2 templates
        self._templates = Environment(
            loader=DictLoader(
                {
                    "completion-system": COMPLETION_SYSTEM_PROMPT,
                    "completion-human": COMPLETION_DEFAULT_TEMPLATE,
                }
            )
        )

    @default("api_key")
    def _api_key_default(self):
        return os.environ.get("OPENAI_API_KEY", "")

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

    def _get_messages(
        self, request: InlineCompletionRequest
    ) -> List[ChatCompletionMessageParam]:
        messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": COMPLETION_SYSTEM_PROMPT},
            {"role": "user", "content": request.prompt},
        ]
        return messages

    def get_token(self, request: InlineCompletionRequest) -> str:
        return f"t{request.message_id}s0"

    async def request_completions(
        self, request: InlineCompletionRequest
    ) -> InlineCompletionReply:
        # FIXME non-stream completion
        raise NotImplementedError()

    async def stream_completions(
        self, request: InlineCompletionRequest
    ) -> AsyncGenerator[
        Union[InlineCompletionReply, InlineCompletionStreamChunk], None
    ]:
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

        # Use by the frontend to reconciliate the completion with the request.
        token = self.get_token(request)

        # Acknowledge the request
        yield InlineCompletionReply(
            list=InlineCompletionList(
                items=[
                    InlineCompletionItem(insertText="", isIncomplete=True, token=token)
                ]
            ),
            parent_id=request.message_id,
        )

        # Send the completion request to the OpenAI API and returns a stream of completion chunks
        stream: AsyncStream[
            ChatCompletionChunk
        ] = await self.client.chat.completions.create(
            model=self.model,
            stream=True,
            max_tokens=100,
            messages=self._get_messages(request),
        )
        async for chunk in stream:
            is_finished = chunk.choices[0].finish_reason is not None
            yield InlineCompletionStreamChunk(
                parent_id=request.message_id,
                response=InlineCompletionItem(
                    insertText=chunk.choices[0].delta.content or "",
                    isIncomplete=True,
                    token=token,
                ),
                done=is_finished,
            )
