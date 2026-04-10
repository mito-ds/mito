# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import ThreadID
from mito_ai_core.provider_manager import ProviderManager
from openai.types.chat import ChatCompletionMessageParam
from mito_ai_core.completions.prompt_builders.chat_system_message import (
    create_chat_system_message_prompt,
)


async def append_chat_system_message(
    message_history: GlobalMessageHistory,
    provider: ProviderManager,
    thread_id: ThreadID,
) -> None:

    # If the system message already exists, do nothing
    if any(
        msg["role"] == "system"
        for msg in message_history.get_ai_optimized_history(thread_id)
    ):
        return

    system_message_prompt = create_chat_system_message_prompt()

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


def normalize_agent_response_completion(completion: str) -> str:
    """
    Return only the first complete JSON object from the completion string.
    If the API returns duplicate or trailing JSON (e.g. two AgentResponse objects
    concatenated), we keep only the first so that message_history and the frontend
    receive a single valid JSON string.
    """
    if not completion or not completion.strip():
        return completion
    
    # Try parsing entire string first
    try:
        json.loads(completion)
        return completion.strip()
    except json.JSONDecodeError:
        pass
    
    # Find first '{' and try to decode from there
    start = completion.find("{")
    if start < 0:
        return completion
    
    decoder = json.JSONDecoder()
    try:
        obj, end = decoder.raw_decode(completion, start)
        return completion[start:end].strip()
    except json.JSONDecodeError:
        return completion
