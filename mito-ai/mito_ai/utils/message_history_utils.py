import re
from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    CONTENT_REMOVED_PLACEHOLDER
)

def trim_sections_from_message_content(content) -> str:
    """
    Removes specific metadata sections from message content to reduce token count so
    that users don't exceed the token limit for the LLM.

    These sections are replaced with a placeholder text.
    """
    if not isinstance(content, str):
        return content

    # Replace metadata sections with placeholders
    section_headings = [
        FILES_SECTION_HEADING,
        VARIABLES_SECTION_HEADING,
        JUPYTER_NOTEBOOK_SECTION_HEADING
    ]
    
    for heading in section_headings:
        content = re.sub(
            f"{re.escape(heading)}\n(?:.+\n)+",
            f"{heading} {CONTENT_REMOVED_PLACEHOLDER}\n",
            content,
        )

    return content


def trim_old_messages(messages: List[ChatCompletionMessageParam], keep_recent: int = 3) -> List[ChatCompletionMessageParam]:
    """
    Trims metadata sections from messages that are older than the specified number of recent messages.
    We do this in order to reduce the token count of the messages, which helps us stay under the token limit for the LLM.
    """
    if len(messages) <= keep_recent:
        return messages
        
    # Process all messages except the keep_recent most recent ones. 
    # Only trim user messages, which is where this metadata lives. 
    # We want to not edit the system messages, as they contain important information / examples.
    for i in range(len(messages) - keep_recent):
        content = messages[i].get("content")
        is_user_message = messages[i].get("role") == "user"
        if is_user_message and content is not None:
            messages[i]["content"] = trim_sections_from_message_content(content)

    return messages