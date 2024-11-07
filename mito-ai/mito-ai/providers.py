import os
import traceback
from typing import AsyncGenerator, List, Optional, Union

from jinja2 import Environment, DictLoader
from jupyter_core.utils import run_sync
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from traitlets import Unicode, default
from traitlets.config import LoggingConfigurable

from .models import (
    CompletionError,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionRequest,
    InlineCompletionReply,
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
{% if suffix %}
The code after the completion request is:

```
{{suffix}}
```
{% endif %}

Complete the following code:

```
{{prefix}}
```"""


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

    def __del__(self):
        if self._client:
            run_sync(self._client.close)

    @default("api_key")
    def _api_key_default(self):
        return os.environ.get("OPENAI_API_KEY", "")

    @property
    def client(self) -> AsyncOpenAI:
        if not self._client or self._client.is_closed():
            self._client = run_sync(self._check_authentication)
        return self._client

    async def _check_authentication(self) -> AsyncOpenAI:
        client = AsyncOpenAI(api_key=self.api_key)
        # TODO we could actually make use of that list
        async for _ in client.models.list():
            break
        return client

    def _get_messages(
        self, request: InlineCompletionRequest
    ) -> List[ChatCompletionMessageParam]:
        return [
            {
                "role": "system",
                "content": self._templates.get_template("completion-system").render(),
            },
            {
                "role": "user",
                "content": self._templates.get_template("completion-human").render(
                    request.to_template_inputs()
                ),
            },
        ]

    async def request_completions(self, request: InlineCompletionRequest) -> InlineCompletionReply:
        # FIXME non-stream completion
        ...

    async def stream_completions(
        self, request: InlineCompletionRequest
    ) -> AsyncGenerator[Union[InlineCompletionReply, InlineCompletionStreamChunk]]:
        # FIXME analyze usefulness
        token = f"t{request.number}s0"
        # FIXME why not streaming only the delta?
        suggestion = processed_suggestion = ""

        yield InlineCompletionReply(
            list=InlineCompletionList(
                items=[
                    InlineCompletionItem(insertText="", isIncomplete=True, token=token)
                ]
            ),
            reply_to=request.number,
        )

        stream = await self.client.chat.completions.create(
            model=self.model,
            stream=True,
            messages=self._get_messages(request),
        )
        async for chunk in stream:
            is_finished = chunk.choices[0].finish_reason is not None
            yield InlineCompletionStreamChunk(
                reply_to=request.number,
                response=InlineCompletionItem(
                    insertText=chunk.choices[0].delta.content or "",
                    isIncomplete=not is_finished,
                    token=token,
                ),
                done=is_finished,
            )
