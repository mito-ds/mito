# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Adapts :class:`~mito_ai_core.provider_manager.ProviderManager` to the agent ``CompletionProvider`` protocol."""

from __future__ import annotations

from typing import Any, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.provider_manager import ProviderManager

__all__ = ["ProviderAdapter"]


class ProviderAdapter:
    """Adapts :class:`ProviderManager` to :class:`CompletionProvider` (keyword-only API)."""

    def __init__(self, llm: ProviderManager) -> None:
        self._llm = llm

    async def request_completions(
        self,
        *,
        message_type: Any,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        return await self._llm.request_completions(
            message_type=message_type,
            messages=messages,
            response_format_info=response_format_info,
        )
