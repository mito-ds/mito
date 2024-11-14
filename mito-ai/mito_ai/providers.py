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
        inputs = request.to_template_inputs()
        messages = [
            {
                "role": "system",
                "content": self._templates.get_template("completion-system").render(),
            },
            {
                "role": "user",
                "content": self._templates.get_template("completion-human").render(
                    inputs
                ),
            },
            {
                "role": "user",
                "content": """Complete the following code responding only with additional code, 
code comments or docstrings, and with no markdown formatting.""",
            },
            {"role": "user", "content": inputs["prefix"]},
        ]

        if inputs.get("suffix"):
            messages.extend(
                [
                    {
                        "role": "user",
                        "content": "The new code appears before the following snippet.",
                    },
                    {"role": "user", "content": inputs["suffix"]},
                ]
            )

        return messages

    def get_token(self, request: InlineCompletionRequest) -> str:
        return f"t{request.number}s0"

    async def request_completions(
        self, request: InlineCompletionRequest
    ) -> InlineCompletionReply:
        # FIXME non-stream completion
        ...

    async def stream_completions(
        self, request: InlineCompletionRequest
    ) -> AsyncGenerator[
        Union[InlineCompletionReply, InlineCompletionStreamChunk], None
    ]:
        # Use by the frontend to reconciliate the completion with the request.
        token = self.get_token(request)

        yield InlineCompletionReply(
            list=InlineCompletionList(
                items=[
                    InlineCompletionItem(insertText="", isIncomplete=True, token=token)
                ]
            ),
            reply_to=request.number,
        )

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
                reply_to=request.number,
                response=InlineCompletionItem(
                    insertText=chunk.choices[0].delta.content or "",
                    isIncomplete=True,
                    token=token,
                ),
                done=is_finished,
            )
