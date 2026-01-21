# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple
import re
from anthropic.types import MessageParam
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER
from mito_ai.completions.models import MessageType
from mito_ai.provider_manager import ProviderManager

def extract_todo_placeholders(agent_response: str) -> List[str]:
    """Extract TODO placeholders from the agent's response"""
    return [line.strip() for line in agent_response.split('\n') if MITO_TODO_PLACEHOLDER in line]

async def get_response_from_agent(
    message_to_agent: List[MessageParam],
    provider: ProviderManager
) -> str:
    """Gets the response from the agent using ProviderManager with fast model"""
    # Convert MessageParam to ChatCompletionMessageParam format
    messages: List[ChatCompletionMessageParam] = []
    for msg in message_to_agent:
        if isinstance(msg, dict):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            # Handle content that might be a list of text blocks
            if isinstance(content, list):
                # Extract text from text blocks
                text_content = ""
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text_content += block.get("text", "")
                content = text_content
            messages.append({"role": role, "content": content})
    
    # Use ProviderManager with use_fast_model=True
    response = await provider.request_completions(
        messages=messages,
        message_type=MessageType.STREAMLIT_CONVERSION,
        use_fast_model=True,
        thread_id=None
    )
    return response