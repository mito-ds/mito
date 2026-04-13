# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import ThreadID
from mito_ai_core.completions.prompt_builders.agent_system_message import (
    create_agent_system_message_prompt,
)
from mito_ai_core.provider_manager import ProviderManager


async def append_agent_system_message(
    message_history: GlobalMessageHistory,
    provider: ProviderManager,
    thread_id: ThreadID,
    enable_get_cell_output: bool,
) -> None:

    # If the system message already exists, do nothing
    if any(
        msg["role"] == "system"
        for msg in message_history.get_ai_optimized_history(thread_id)
    ):
        return

    system_message_prompt = create_agent_system_message_prompt(enable_get_cell_output)

    system_message: ChatCompletionMessageParam = {
        "role": "system",
        "content": system_message_prompt,
    }

    await message_history.append_message(
        ai_optimized_message=system_message,
        display_message=system_message,
        llm_provider=provider,
        thread_id=thread_id,
    )
