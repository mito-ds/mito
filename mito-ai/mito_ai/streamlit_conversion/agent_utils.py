import difflib
from typing import List
from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.prompts.streamlit_system_prompt import (
    streamlit_system_prompt,
)
from mito_ai.streamlit_conversion.streamlit_agent_handler import STREAMLIT_AI_MODEL
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from anthropic.types import MessageParam
from unidiff import PatchSet



async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192  # 64_000
    temperature = 0

    print(f"Getting response from agent...: {message_to_agent}")
    accumulated_response = ""
    async for stream_chunk in stream_anthropic_completion_from_mito_server(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=streamlit_system_prompt,
        messages=message_to_agent,
        stream=True,
        message_type=MessageType.STREAMLIT_CONVERSION,
        reply_fn=None,
        message_id="",
    ):
        accumulated_response += stream_chunk
    return accumulated_response


def apply_patch_to_text(text: str, diff: str) -> str:
    """
    Apply a patch to a text string.
    """
    
    patched_lines = list(difflib.restore(diff, which="+"))
    patched_text  = "".join(patched_lines)
    return patched_text
