# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import base64
from typing import Optional, Union, List, Dict, Any, cast
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import ThreadID
from mito_ai.completions.providers import OpenAIProvider
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.chat_system_message import (
    create_chat_system_message_prompt,
)
from mito_ai.completions.prompt_builders.agent_system_message import (
    create_agent_system_message_prompt,
)


async def append_chat_system_message(
    message_history: GlobalMessageHistory,
    model: str,
    provider: OpenAIProvider,
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
        model=model,
        llm_provider=provider,
        thread_id=thread_id,
    )


async def append_agent_system_message(
    message_history: GlobalMessageHistory,
    model: str,
    provider: OpenAIProvider,
    thread_id: ThreadID,
    isChromeBrowser: bool,
) -> None:

    # If the system message already exists, do nothing
    if any(
        msg["role"] == "system"
        for msg in message_history.get_ai_optimized_history(thread_id)
    ):
        return

    system_message_prompt = create_agent_system_message_prompt(isChromeBrowser)

    system_message: ChatCompletionMessageParam = {
        "role": "system",
        "content": system_message_prompt,
    }

    await message_history.append_message(
        ai_optimized_message=system_message,
        display_message=system_message,
        model=model,
        llm_provider=provider,
        thread_id=thread_id,
    )


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
