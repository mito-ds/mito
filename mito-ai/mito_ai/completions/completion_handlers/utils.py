# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import base64
import json
from typing import Optional, Union, List, Dict, Any, cast
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import AGENT_RESPONSE_TYPE_WEB_SEARCH, ThreadID
from mito_ai.provider_manager import ProviderManager
from mito_ai.utils.provider_utils import get_model_provider
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.chat_system_message import (
    create_chat_system_message_prompt,
)
from mito_ai.completions.prompt_builders.agent_system_message import (
    create_agent_system_message_prompt,
)


async def append_chat_system_message(
    message_history: GlobalMessageHistory,
    provider: ProviderManager,
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
        llm_provider=provider,
        thread_id=thread_id,
    )


async def append_agent_system_message(
    message_history: GlobalMessageHistory,
    provider: ProviderManager,
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


def normalize_agent_response_completion(completion: str) -> str:
    """
    Return only the first complete JSON object from the completion string.
    If the API returns duplicate or trailing JSON (e.g. two AgentResponse objects
    concatenated), we keep only the first so that message_history and the frontend
    receive a single valid JSON string.
    """
    if not completion or not completion.strip():
        return completion
    
    # Try parsing entire string first
    try:
        json.loads(completion)
        return completion.strip()
    except json.JSONDecodeError:
        pass
    
    # Find first '{' and try to decode from there
    start = completion.find("{")
    if start < 0:
        return completion
    
    decoder = json.JSONDecoder()
    try:
        _, end = decoder.raw_decode(completion, start)
        return completion[start:end].strip()
    except json.JSONDecodeError:
        return completion


# Concise-instruction suffix for web search so results are clean for the agent to use in the notebook.
WEB_SEARCH_CONCISE_SUFFIX = (
    " Return only a concise list of items (e.g. headline, date, source). "
    "No code, no usage instructions, no 'how to' or 'how to use' sections."
)


async def perform_agent_web_search_if_requested(
    completion: str,
    provider: ProviderManager,
    message_history: GlobalMessageHistory,
    thread_id: ThreadID,
) -> Optional[str]:
    """
    If the agent response in completion is a web_search request, run the search,
    append the results to message_history, and return the raw search result string.
    Otherwise return None.
    """
    try:
        parsed = json.loads(completion)
        if parsed.get("type") != AGENT_RESPONSE_TYPE_WEB_SEARCH:
            return None
        web_search_query = parsed.get("web_search_query")
        if not web_search_query:
            return None
    except (json.JSONDecodeError, KeyError):
        return None

    try:
        selected_model = provider.get_selected_model()
        model_provider = get_model_provider(selected_model)
        if model_provider != "openai":
            return None
        if not getattr(provider, "_openai_client", None):
            return None
        openai_client = provider._openai_client
    except Exception:
        return None

    search_input = web_search_query + WEB_SEARCH_CONCISE_SUFFIX

    try:
        search_result = await openai_client.web_search(search_input, selected_model)
    except Exception:
        import traceback
        traceback.print_exc()
        return None

    search_results_message: ChatCompletionMessageParam = {
        "role": "assistant",
        "content": f"Web search results for '{web_search_query}':\n\n{search_result}",
    }
    await message_history.append_message(
        search_results_message,
        search_results_message,
        provider,
        thread_id,
    )

    return search_result


def inject_web_search_results_into_completion(
    completion: str,
    web_search_results: str,
) -> str:
    """Add web_search_results to the completion JSON so the frontend can display them."""
    try:
        parsed = json.loads(completion)
        parsed["web_search_results"] = web_search_results
        return json.dumps(parsed)
    except (json.JSONDecodeError, KeyError):
        return completion
