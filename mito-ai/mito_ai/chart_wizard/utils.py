# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import cast
from anthropic.types import MessageParam
from mito_ai.chart_wizard.prompts import get_chart_wizard_prompt
from mito_ai.utils.anthropic_utils import get_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType

CHART_WIZARD_AI_MODEL = "claude-sonnet-4-5-20250929"


async def process_chart_code(source_code: str) -> str:
    """
    Process chart code and get a summary from the LLM.
    
    Args:
        source_code: The Python code from the cell that creates the chart
        
    Returns:
        A summary of the code from the LLM
    """
    prompt_text = get_chart_wizard_prompt(source_code)
    
    messages: list[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt_text
            }]
        })
    ]
    
    model = CHART_WIZARD_AI_MODEL
    max_tokens = 64000
    temperature = 0.2

    response = await get_anthropic_completion_from_mito_server(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system="",
        messages=messages,
        tools=None,
        tool_choice=None,
        message_type=MessageType.CHART_WIZARD,
    )
    return response
