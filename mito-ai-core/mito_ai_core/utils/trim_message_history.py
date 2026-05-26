# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Trim AI chat message lists to reduce token usage.

Kept separate from :mod:`mito_ai_core.utils.message_history_utils` so
:class:`~mito_ai_core.completions.message_history.GlobalMessageHistory` can
import these helpers without a circular import (the utils module imports
``GlobalMessageHistory`` for ``append_agent_system_message``).
"""

import json
import re
from typing import Any, Dict, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.completions.prompt_builders.prompt_section_registry import (
    get_all_section_classes,
)

VARIABLES_SUMMARY_AFTER_MESSAGES = 3
VARIABLES_SHORT_STRING_LIMIT = 80
NOTEBOOK_SUMMARY_AFTER_MESSAGES = 3
NOTEBOOK_CONTENT_PREVIEW_LIMIT = 120
NOTEBOOK_PREFIX_SEPARATOR = "\n\n"


def build_section_to_trim_message_index_mapping() -> Dict[str, Optional[int]]:
    """Build mapping from section names to trim_after_messages thresholds."""
    mapping = {}
    for section_class in get_all_section_classes():
        for section_name in section_class.get_trim_tag_names():
            mapping[section_name] = section_class.trim_after_messages
    return mapping


def _should_keep_variable_value(value: Any) -> bool:
    """Keep only cheap, high-signal variable values in summarized history."""
    if value is None:
        return True

    if isinstance(value, (bool, int, float)):
        return True

    if isinstance(value, str):
        stripped_value = value.strip()
        return (
            len(stripped_value) <= VARIABLES_SHORT_STRING_LIMIT
            and not stripped_value.startswith("<module ")
        )

    return False


def _summarize_variables_payload(variables_payload: str) -> Optional[str]:
    """Summarize a serialized Variables payload while preserving useful scalars."""
    try:
        parsed_payload = json.loads(variables_payload)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed_payload, list):
        return None

    summarized_variables = []
    for variable in parsed_payload:
        if not isinstance(variable, dict):
            return None

        summarized_variable = {
            "name": variable.get("name"),
            "type": variable.get("type"),
        }

        value = variable.get("value")
        if _should_keep_variable_value(value):
            summarized_variable["value"] = value

        summarized_variables.append(summarized_variable)

    return json.dumps(summarized_variables, indent=2)


def _summarize_variables_sections(
    content: str,
    message_age: int,
    variables_threshold: Optional[int],
) -> str:
    """Rewrite older Variables sections into a lightweight summary."""
    if variables_threshold is None:
        return content

    if (
        message_age < VARIABLES_SUMMARY_AFTER_MESSAGES
        or message_age >= variables_threshold
    ):
        return content

    pattern = r"<Variables>(.*?)</Variables>"
    matches = list(re.finditer(pattern, content, flags=re.DOTALL))

    for match in reversed(matches):
        summarized_payload = _summarize_variables_payload(match.group(1).strip())
        if summarized_payload is None:
            continue

        replacement = f"<Variables>\n{summarized_payload}\n</Variables>"
        content = content[:match.start()] + replacement + content[match.end():]

    return content


def _summarize_notebook_cell_content(cell_content: Any) -> Any:
    """Return a compact preview of cell content for older notebook snapshots."""
    if not isinstance(cell_content, str):
        return cell_content

    stripped_content = cell_content.strip()
    if stripped_content == "":
        return stripped_content

    if len(stripped_content) <= NOTEBOOK_CONTENT_PREVIEW_LIMIT:
        return stripped_content

    return stripped_content[:NOTEBOOK_CONTENT_PREVIEW_LIMIT] + "..."


def _summarize_notebook_payload(notebook_payload: str) -> Optional[str]:
    """Summarize a serialized Notebook payload while preserving structure."""
    notebook_prefix = ""
    notebook_json_payload = notebook_payload.strip()

    if NOTEBOOK_PREFIX_SEPARATOR in notebook_payload:
        notebook_prefix, notebook_json_payload = notebook_payload.split(
            NOTEBOOK_PREFIX_SEPARATOR,
            1,
        )
        notebook_prefix = notebook_prefix.strip()
        notebook_json_payload = notebook_json_payload.strip()

    try:
        parsed_payload = json.loads(notebook_json_payload)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed_payload, list):
        return None

    summarized_cells = []
    for cell in parsed_payload:
        if not isinstance(cell, dict):
            return None

        summarized_cells.append(
            {
                "index": cell.get("index"),
                "id": cell.get("id"),
                "cell_type": cell.get("cell_type"),
                "content": _summarize_notebook_cell_content(cell.get("content", "")),
            }
        )

    summarized_json = json.dumps(summarized_cells, indent=2)
    if notebook_prefix == "":
        return summarized_json

    return f"{notebook_prefix}{NOTEBOOK_PREFIX_SEPARATOR}{summarized_json}"


def _summarize_notebook_sections(
    content: str,
    message_age: int,
    notebook_threshold: Optional[int],
) -> str:
    """Rewrite older Notebook sections into a lightweight summary."""
    if notebook_threshold is None:
        return content

    if (
        message_age < NOTEBOOK_SUMMARY_AFTER_MESSAGES
        or message_age >= notebook_threshold
    ):
        return content

    pattern = r"<Notebook>(.*?)</Notebook>"
    matches = list(re.finditer(pattern, content, flags=re.DOTALL))

    for match in reversed(matches):
        summarized_payload = _summarize_notebook_payload(match.group(1).strip())
        if summarized_payload is None:
            continue

        replacement = f"<Notebook>\n{summarized_payload}\n</Notebook>"
        content = content[:match.start()] + replacement + content[match.end():]

    return content


def trim_message_content(content: str, message_age: int) -> str:
    """
    Trims sections from XML string based on age and thresholds.

    Args:
        content: The message content as a string (may contain XML tags)
        message_age: The age of the message (0 = most recent, higher = older)

    Returns:
        The content with trimmed sections removed
    """
    section_mapping = build_section_to_trim_message_index_mapping()

    # Special handling for Example sections - remove entirely if they should be trimmed
    # Match: <Example name="...">...</Example> or <Example>...</Example>
    example_pattern = r'<Example(?:\s+name="[^"]*")?>.*?</Example>'
    example_matches = list(re.finditer(example_pattern, content, flags=re.DOTALL))

    for match in reversed(example_matches):  # Process from end to start to preserve indices
        example_threshold = section_mapping.get("Example")
        if example_threshold is not None and message_age >= example_threshold:
            # Remove the entire Example block
            content = content[:match.start()] + content[match.end():]

    content = _summarize_variables_sections(
        content,
        message_age,
        section_mapping.get("Variables"),
    )
    content = _summarize_notebook_sections(
        content,
        message_age,
        section_mapping.get("Notebook"),
    )

    # For other sections, parse and trim based on section_mapping
    # Match XML tags like <SectionName>...</SectionName>
    # Skip Example sections as they're handled separately above
    for section_name, threshold in section_mapping.items():
        if threshold is None:
            # Never trim sections with None threshold
            continue

        if section_name == "Example":
            # Example sections are handled separately above
            continue

        if message_age >= threshold:
            # Pattern to match the section tag and its content
            # Handles both self-closing and content tags
            pattern = rf'<{re.escape(section_name)}>.*?</{re.escape(section_name)}>'
            matches = list(re.finditer(pattern, content, flags=re.DOTALL))

            for match in reversed(matches):  # Process from end to start
                content = content[:match.start()] + content[match.end():]

    return content


def trim_old_messages(
    messages: List[ChatCompletionMessageParam],
) -> List[ChatCompletionMessageParam]:
    """
    Trims metadata sections from messages that are older than the specified number of recent messages.
    We do this in order to reduce the token count of the messages, which helps us stay under the token limit for the LLM.

    Only trims user messages for now, but the design allows for easy extension to system/assistant messages.
    """

    # Process all messages except the keep_recent most recent ones.
    # Only trim user messages, which is where this metadata lives.
    # We want to not edit the system messages, as they contain important information / examples.
    total_messages = len(messages)
    for i in range(total_messages):

        # Only trim user messages
        is_user_message = messages[i].get("role") == "user"
        if not is_user_message:
            continue

        content = messages[i].get("content")
        if content is None:
            continue

        message_age = total_messages - i - 1

        if isinstance(content, str):
            # If content is just a string, then we just trim the metadata sections
            messages[i]["content"] = trim_message_content(content, message_age)
        else:
            # Otherwise, we get rid of the image_url section and just keep the trimmed text
            # We assume that there is only one text section in the content
            text_content = ""
            for section in content:
                if section.get("type") == "text" and "text" in section:
                    text_content = section["text"]  # type: ignore
                    break

            trimmed_text = trim_message_content(text_content, message_age)
            # Update the text section with trimmed content
            for section in content:
                if section.get("type") == "text" and "text" in section:
                    section["text"] = trimmed_text  # type: ignore
                    break

    return messages
