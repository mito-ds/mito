# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from mito_ai.chart_wizard.prompts import get_chart_wizard_prompt
from mito_ai.utils.gemini_utils import get_gemini_completion_from_mito_server
from mito_ai.completions.models import MessageType

CHART_WIZARD_AI_MODEL = "gemini-2.5-flash"


class ChartParameter(BaseModel):
    name: str = Field(description="The name of the parameter")
    value: str = Field(description="The literal value as it appears in code, or 'computed' if derived")
    parameter_type: str = Field(description="The type of parameter, e.g., 'color', 'title', 'figure_size', etc.")
    description: Optional[str] = Field(default=None, description="Optional description of the parameter")


class ChartWizardResponse(BaseModel):
    parameters: List[ChartParameter] = Field(description="List of extracted chart parameters")


async def process_chart_code(source_code: str) -> ChartWizardResponse:
    """
    Process chart code and get a structured response from the LLM.
    
    Args:
        source_code: The Python code from the cell that creates the chart
        
    Returns:
        A structured ChartWizardResponse with extracted parameters and summary
    """
    prompt_text = get_chart_wizard_prompt(source_code)
    
    # Convert to OpenAI message format (backend will convert to Gemini format)
    contents: List[Dict[str, Any]] = [
        {
            "role": "user",
            "content": prompt_text
        }
    ]
    
    # Create config for structured JSON output
    config: Dict[str, Any] = {
        "response_mime_type": "application/json",
        "response_schema": ChartWizardResponse.model_json_schema()
    }
    
    model = CHART_WIZARD_AI_MODEL

    response_str = await get_gemini_completion_from_mito_server(
        model=model,
        contents=contents,
        message_type=MessageType.CHART_WIZARD,
        config=config,
        response_format_info=None
    )
    
    # Parse the JSON response and create ChartWizardResponse
    response_data = json.loads(response_str)
    print(response_data)
    return ChartWizardResponse(**response_data)
