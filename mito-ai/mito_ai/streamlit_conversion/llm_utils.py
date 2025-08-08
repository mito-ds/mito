from anthropic.types import MessageParam
from typing import List

from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.prompts.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"


async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192
    temperature = 0.2

    print("Getting response from agent...")
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