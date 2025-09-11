# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union

import openai
from openai.types.chat import ChatCompletionMessageParam
from traitlets import Instance, Unicode, default, validate
from traitlets.config import LoggingConfigurable

from mito_ai import constants
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
from mito_ai.utils.mito_server_utils import ProviderCompletionException
from mito_ai.utils.telemetry_utils import (
    MITO_SERVER_KEY,
    USER_KEY,
)

CEREBRAS_MODEL_FALLBACK = "qwen-3-32b"


class CerebrasClient(LoggingConfigurable):
    """Provide AI feature through Cerebras services."""

    api_key = Unicode(
        config=True,
        allow_none=True,
        help="Cerebras API key. Default value is read from the CEREBRAS_API_KEY environment variable.",
    )

    last_error = Instance(
        CompletionError,
        allow_none=True,
        help="""Last error encountered when using the Cerebras provider.

This attribute is observed by the websocket provider to push the error to the client.""",
    )

    def __init__(self, **kwargs: Dict[str, Any]) -> None:
        super().__init__(log=get_logger(), **kwargs)
        self.last_error = None
        self._client: Optional[openai.OpenAI] = None

    @property
    def capabilities(self) -> AICapabilities:
        """
        Returns the capabilities of the AI provider.
        """
        return AICapabilities(
            configuration={"model": "qwen-3-coder-480b"},
            provider="Cerebras",
        )

    @property
    def key_type(self) -> str:
        return "cerebras"

    def _get_client(self) -> openai.OpenAI:
        """Get or create the OpenAI client configured for Cerebras."""
        if self._client is None:
            api_key = self.api_key or constants.CEREBRAS_API_KEY
            if not api_key:
                raise ProviderCompletionException(
                    "Cerebras API key is required",
                    "Missing API Key",
                    "Please set the CEREBRAS_API_KEY environment variable or configure the API key in settings."
                )
            
            self._client = openai.OpenAI(
                api_key=api_key,
                base_url="https://api.cerebras.ai/v1"
            )
        return self._client

    def _preprocess_messages(self, messages: List[ChatCompletionMessageParam]) -> List[ChatCompletionMessageParam]:
        """
        Preprocess messages to ensure Cerebras API compatibility.
        Cerebras requires simple string content, not complex content objects.
        """
        processed_messages = []
        for message in messages:
            processed_message = dict(message)
            content = message.get('content')
            
            if isinstance(content, list):
                # Convert list content to string
                text_parts = []
                for item in content:
                    if isinstance(item, dict):
                        if item.get('type') == 'text' and 'text' in item:
                            text_parts.append(item['text'])
                        elif 'text' in item:
                            text_parts.append(item['text'])
                processed_message['content'] = '\n'.join(text_parts)
            elif isinstance(content, dict):
                # Convert dict content to string
                if content.get('type') == 'text' and 'text' in content:
                    processed_message['content'] = content['text']
                elif 'text' in content:
                    processed_message['content'] = content['text']
                else:
                    processed_message['content'] = str(content)
            # If content is already a string, keep it as is
            
            processed_messages.append(processed_message)
        return processed_messages

    async def request_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        response_format_info: Optional[ResponseFormatInfo] = None,
        message_type: MessageType = MessageType.CHAT,
    ) -> str:
        """
        Request completions from the Cerebras API.
        """
        try:
            client = self._get_client()
            
            # Preprocess messages for Cerebras compatibility
            processed_messages = self._preprocess_messages(messages)
            
            # Cerebras API uses OpenAI-compatible interface
            import time

            start_time = time.time()
            response = client.chat.completions.create(
                model=model,
                messages=processed_messages,
                temperature=0.7,
                max_tokens=4000,
            )
            end_time = time.time()
            print(f"Cerebras Time taken: {end_time - start_time} seconds")

            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                return content or ""
            else:
                raise ProviderCompletionException(
                    "No completion choices returned from Cerebras API",
                    "Empty Response",
                    "The Cerebras API returned an empty response. Please try again."
                )
                
        except Exception as e:
            self.log.exception(f"Error during Cerebras request_completions: {e}")
            if isinstance(e, ProviderCompletionException):
                raise
            raise ProviderCompletionException(
                str(e),
                "Cerebras API Error",
                "There was an error communicating with the Cerebras API. Please check your API key and try again."
            )

    async def stream_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
        message_type: MessageType = MessageType.CHAT,
    ) -> str:
        """
        Stream completions from the Cerebras API and return the accumulated response.
        Returns: The accumulated response string.
        """
        try:
            client = self._get_client()
            accumulated_response = ""
            
            # Preprocess messages for Cerebras compatibility
            processed_messages = self._preprocess_messages(messages)
            
            # Cerebras API uses OpenAI-compatible streaming interface
            stream = client.chat.completions.create(
                model=model,
                messages=processed_messages,
                temperature=0.7,
                max_tokens=4000,
                stream=True,
            )
            
            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        accumulated_response += delta.content
                        
                        # Send the chunk to the reply function
                        reply_fn(CompletionStreamChunk(
                            parent_id=message_id,
                            chunk=CompletionItem(
                                content=accumulated_response,
                                isIncomplete=True,
                                token=message_id,
                            ),
                            done=False,
                        ))
            
            # Send final completion
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content=accumulated_response,
                    isIncomplete=False,
                    token=message_id,
                ),
                done=True,
            ))
            
            return accumulated_response
            
        except Exception as e:
            self.log.exception(f"Error during Cerebras stream_completions: {e}")
            error = CompletionError.from_exception(e)
            
            # Send error to client
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
                error=error,
            ))
            
            if isinstance(e, ProviderCompletionException):
                raise
            raise ProviderCompletionException(
                str(e),
                "Cerebras API Error",
                "There was an error communicating with the Cerebras API. Please check your API key and try again."
            )