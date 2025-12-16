# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
from typing import List
from mito_ai.constants import MESSAGE_HISTORY_TRIM_THRESHOLD, NOTEBOOK_PRESERVATION_THRESHOLD
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.prompt_constants import (
    CONTENT_REMOVED_PLACEHOLDER,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    iter_prompt_section_headings,
    get_prompt_section_boundary_headings,
)


def trim_sections_from_message_content(content: str, preserve_notebook: bool = False) -> str:
    """
    Removes specific metadata sections from message content to reduce token count so
    that users don't exceed the token limit for the LLM.

    These sections are replaced with a placeholder text.
    
    Args:
        content: The message content to trim
        preserve_notebook: If True, preserves the JUPYTER_NOTEBOOK_SECTION_HEADING section
    """

    # Replace metadata sections with placeholders.
    #
    # The prompt builder layer defines a single registry of all section headings
    # (both "trimmed" metadata and "non-trimmed" content), which we use here for:
    # - boundary detection, and
    # - deciding which sections should be trimmed.
    boundary_alternation = "|".join(re.escape(h) for h in get_prompt_section_boundary_headings())

    def _trim_fenced_block_section(text: str, heading: str) -> str:
        """
        Trims sections that commonly contain fenced blocks (```...```), which may include
        blank lines. This avoids patterns that stop at the first empty line.
        """
        # Preferred: heading followed by a fenced block.
        text = re.sub(
            rf"^[ \t]*{re.escape(heading)}(?:\n|$)[ \t]*```.*?\n[ \t]*```[ \t]*(?:\n|$)",
            f"{heading} {CONTENT_REMOVED_PLACEHOLDER}\n",
            text,
            flags=re.MULTILINE | re.DOTALL,
        )

        # Fallback: heading followed by arbitrary content until the next boundary heading,
        # a paragraph break, or end of string.
        return re.sub(
            rf"^[ \t]*{re.escape(heading)}(?:\n|$).*?(?=^[ \t]*(?:{boundary_alternation})\n|\n{{2,}}|\Z)",
            f"{heading} {CONTENT_REMOVED_PLACEHOLDER}\n",
            text,
            flags=re.MULTILINE | re.DOTALL,
        )

    for section in iter_prompt_section_headings():
        if not section.trim:
            continue
        if preserve_notebook and section.heading == JUPYTER_NOTEBOOK_SECTION_HEADING:
            continue

        if section.is_fenced:
            content = _trim_fenced_block_section(content, section.heading)
            continue

        # Default: trim until the next boundary heading, paragraph break, or end of string.
        content = re.sub(
            rf"^[ \t]*{re.escape(section.heading)}(?:\n|$).*?(?=^[ \t]*(?:{boundary_alternation})\n|\n{{2,}}|\Z)",
            f"{section.heading} {CONTENT_REMOVED_PLACEHOLDER}\n",
            content,
            flags=re.MULTILINE | re.DOTALL,
        )

    return content


def trim_old_messages(messages: List[ChatCompletionMessageParam]) -> List[ChatCompletionMessageParam]:
    """
    Trims metadata sections from messages that are older than the specified number of recent messages.
    We do this in order to reduce the token count of the messages, which helps us stay under the token limit for the LLM.
    """
    if len(messages) <= MESSAGE_HISTORY_TRIM_THRESHOLD:
        return messages
        
    # Process all messages except the keep_recent most recent ones. 
    # Only trim user messages, which is where this metadata lives. 
    # We want to not edit the system messages, as they contain important information / examples.
    for i in range(len(messages) - MESSAGE_HISTORY_TRIM_THRESHOLD):
        is_user_message = messages[i].get("role") == "user"
        if not is_user_message: 
            continue
        
        content = messages[i].get("content")
        
        if content is None:
            continue
        
        # Calculate how many messages from the end this message is
        # (e.g., if there are 10 messages total and i=0, this message is 10 messages from the end)
        message_age = len(messages) - i
        
        # We preserve the notebook for messages that are still within NOTEBOOK_PRESERVATION_THRESHOLD
        # messages from the end. This means:
        # - Messages within 3 messages from end: not processed (nothing trimmed)
        # - Messages 4-6 from end: variables trimmed, notebook preserved
        # - Messages 7+ from end: everything trimmed including notebook
        preserve_notebook = message_age <= NOTEBOOK_PRESERVATION_THRESHOLD
        
        if isinstance(content, str):
            # If content is just a string, then we just trim the metadata sections
            messages[i]["content"] = trim_sections_from_message_content(content, preserve_notebook=preserve_notebook)
        else: 
            # Otherwise, we get rid of the image_url section and just keep the trimmed text
            # We assume that there is only one text section in the content
            text_content = ""
            for section in content:
                if section.get("type") == "text" and "text" in section:
                    text_content = section["text"] #type: ignore
                    break
                
            messages[i]["content"] = trim_sections_from_message_content(text_content, preserve_notebook=preserve_notebook)        


    return messages