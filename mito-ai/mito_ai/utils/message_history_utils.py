# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.prompt_constants import (
    ACTIVE_CELL_ID_SECTION_HEADING,
    ACTIVE_CELL_OUTPUT_SECTION_HEADING,
    GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING,
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    CONTENT_REMOVED_PLACEHOLDER
)


def trim_sections_from_message_content(content: str) -> str:
    """
    Removes specific metadata sections from message content to reduce token count so
    that users don't exceed the token limit for the LLM.

    These sections are replaced with a placeholder text.
    """

    # Replace metadata sections with placeholders
    section_headings = [
        FILES_SECTION_HEADING,
        VARIABLES_SECTION_HEADING,
        JUPYTER_NOTEBOOK_SECTION_HEADING,
        GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING,
        ACTIVE_CELL_OUTPUT_SECTION_HEADING,
        ACTIVE_CELL_ID_SECTION_HEADING
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
        if not is_user_message: 
            continue
        
        content = messages[i].get("content")
        
        if content is None:
            continue
        
        if isinstance(content, str):
            # If content is just a string, then we just trim the metadata sections
            messages[i]["content"] = trim_sections_from_message_content(content)
        else: 
            # Otherwise, we get rid of the image_url section and just keep the trimmed text
            # We assume that there is only one text section in the content
            text_content = ""
            for section in content:
                if section.get("type") == "text" and "text" in section:
                    text_content = section["text"] #type: ignore
                    break
                
            messages[i]["content"] = trim_sections_from_message_content(text_content)        


    return messages