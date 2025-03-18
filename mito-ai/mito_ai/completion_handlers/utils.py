from typing import Optional
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.providers import OpenAIProvider
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.prompt_builders.chat_system_message import create_chat_system_message_prompt
from mito_ai.prompt_builders.agent_system_message import create_agent_system_message_prompt


async def append_chat_system_message(
        message_history: GlobalMessageHistory,
        provider: OpenAIProvider,
        thread_id: Optional[str] = None
) -> None:
    
    # If the system message already exists, do nothing
    if any(msg["role"] == "system" for msg in message_history.ai_optimized_history):
        return
    
    system_message_prompt = create_chat_system_message_prompt()
    
    system_message: ChatCompletionMessageParam = {
        "role": "system",
        "content": system_message_prompt
    }

    await message_history.append_message(
        ai_optimized_message=system_message,
        display_message=system_message,
        llm_provider=provider,
        thread_id=thread_id
    )
    
    
async def append_agent_system_message(
        message_history: GlobalMessageHistory,
        provider: OpenAIProvider,
        thread_id: Optional[str] = None
) -> None:
    
    # If the system message already exists, do nothing
    if any(msg["role"] == "system" for msg in message_history.ai_optimized_history):
        return
    
    system_message_prompt = create_agent_system_message_prompt()
    
    system_message: ChatCompletionMessageParam = {
        "role": "system",
        "content": system_message_prompt
    }
    
    await message_history.append_message(
        ai_optimized_message=system_message,
        display_message=system_message,
        llm_provider=provider,
        thread_id=thread_id
    )