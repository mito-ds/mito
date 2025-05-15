# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Optional, Union, List, Dict, Any, cast
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import ThreadID
from mito_ai.completions.providers import OpenAIProvider
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.chat_system_message import create_chat_system_message_prompt
from mito_ai.completions.prompt_builders.agent_system_message import create_agent_system_message_prompt

async def append_chat_system_message(
        message_history: GlobalMessageHistory,
        provider: OpenAIProvider,
        thread_id: ThreadID
) -> None:
    
    # If the system message already exists, do nothing
    if any(msg["role"] == "system" for msg in message_history.get_ai_optimized_history(thread_id)):
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
        thread_id: ThreadID,
        isChromeBrowser: bool
) -> None:
    
    # If the system message already exists, do nothing
    if any(msg["role"] == "system" for msg in message_history.get_ai_optimized_history(thread_id)):
        return
    
    system_message_prompt = create_agent_system_message_prompt(isChromeBrowser)
    
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
    
def create_ai_optimized_message(text: str, base64EncodedActiveCellOutput: Optional[str] = None) -> ChatCompletionMessageParam:

    message_content: Union[str, List[Dict[str, Any]]]
    if base64EncodedActiveCellOutput is not None and base64EncodedActiveCellOutput != '':
       message_content = [
            {
                "type": "text",
                "text": text,
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{base64EncodedActiveCellOutput}"},
            }
       ]
    else:
        message_content = text
        
    return cast(ChatCompletionMessageParam, {
        "role": "user",
        "content": message_content
    })