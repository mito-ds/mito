# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple
import re
from anthropic.types import MessageParam
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER
from mito_ai.completions.models import MessageType

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

def extract_todo_placeholders(agent_response: str) -> List[str]:
    """Extract TODO placeholders from the agent's response"""
    return [line.strip() for line in agent_response.split('\n') if MITO_TODO_PLACEHOLDER in line]


def apply_search_replace(text: str, search_replace_pairs: List[Tuple[str, str]]) -> str:
    """
    Apply search/replace operations to the given text.
    
    Parameters
    ----------
    text : str
        The original file contents.
    search_replace_pairs : List[Tuple[str, str]]
        List of (search_text, replace_text) tuples to apply.
        
    Returns
    -------
    str
        The updated contents after applying all search/replace operations.
        
    Raises
    ------
    ValueError
        If a search text is not found or found multiple times.
    """
    if not search_replace_pairs:
        return text
    
    result = text
    
    for search_text, replace_text in search_replace_pairs:
        # Count occurrences of search text
        count = result.count(search_text)
        
        if count == 0:
            print("Search Text Not Found: ", repr(search_text))
            raise ValueError(f"Search text not found: {repr(search_text)}")
        elif count > 1:
            print("Search Text Found Multiple Times: ", repr(search_text))
            raise ValueError(f"Search text found {count} times (must be unique): {repr(search_text)}")
        
        # Perform the replacement
        result = result.replace(search_text, replace_text)
    
    return result


async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192 # 64_000
    temperature = 0.2

    accumulated_response = ""
    async for stream_chunk in stream_anthropic_completion_from_mito_server(
        model = model,
        max_tokens = max_tokens,
        temperature = temperature,
        system = streamlit_system_prompt,
        messages = message_to_agent,
        stream=True,
        message_type=MessageType.STREAMLIT_CONVERSION,
        reply_fn=None,
        message_id=""
    ):
        accumulated_response += stream_chunk
    return accumulated_response