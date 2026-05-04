# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import base64
from typing import Any, Dict, List, Optional, Union, cast

from mito_ai_core.agent import AgentContext, ToolResult
from mito_ai_core.completions.prompt_builders.agent_tool_result_prompt import create_agent_tool_result_prompt
from openai.types.chat import ChatCompletionMessageParam


def extract_and_encode_images_from_additional_context(
    additional_context: Optional[List[Dict[str, str]]],
) -> List[str]:
    encoded_images = []

    for context in additional_context or []:
        if context["type"].startswith("image/"):
            try:
                with open(context["value"], "rb") as image_file:
                    image_data = image_file.read()
                    base64_encoded = base64.b64encode(image_data).decode("utf-8")
                    encoded_images.append(f"data:{context['type']};base64,{base64_encoded}")
            except (FileNotFoundError, IOError) as e:
                print(f"Error reading image file {context['value']}: {e}")
                continue

    return encoded_images


def create_ai_optimized_tool_result_message(ctx: AgentContext, tool_result: ToolResult) -> ChatCompletionMessageParam:
    tool_prompt = create_agent_tool_result_prompt(ctx, tool_result)
    if tool_result.tool_name == "get_cell_output" and tool_result.success and tool_result.output:
        return create_ai_optimized_message(tool_prompt, tool_result.output, ctx.additional_context)
    else:
        return {"role": "user", "content": tool_prompt}

def create_ai_optimized_message(
    text: str,
    base64EncodedActiveCellOutput: Optional[str] = None,
    additional_context: Optional[List[Dict[str, str]]] = None,
) -> ChatCompletionMessageParam:

    message_content: Union[str, List[Dict[str, Any]]]
    encoded_images = extract_and_encode_images_from_additional_context(
        additional_context
    )

    has_uploaded_image = len(encoded_images) > 0
    has_active_cell_output = (
        base64EncodedActiveCellOutput is not None
        and base64EncodedActiveCellOutput != ""
    )

    if has_uploaded_image or has_active_cell_output:
        message_content = [
            {
                "type": "text",
                "text": text,
            }
        ]

        for img in encoded_images:
            message_content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": img
                    },
                }
            )

        if has_active_cell_output:
            message_content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64EncodedActiveCellOutput}"
                    },
                }
            )
    else:
        message_content = text

    return cast(
        ChatCompletionMessageParam, {"role": "user", "content": message_content}
    )
