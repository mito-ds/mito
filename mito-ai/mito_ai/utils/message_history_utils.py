# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
from typing import List, Dict, Optional
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.prompt_builders.prompt_section_registry import get_all_section_classes


def build_section_to_trim_message_index_mapping() -> Dict[str, Optional[int]]:
    """Build mapping from section names to trim_after_messages thresholds."""
    mapping = {}
    for section_class in get_all_section_classes():
        section_name = section_class.__name__.replace("Section", "")
        mapping[section_name] = section_class.trim_after_messages
    return mapping


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


def trim_old_messages(messages: List[ChatCompletionMessageParam]) -> List[ChatCompletionMessageParam]:
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
                    text_content = section["text"] #type: ignore
                    break
            
            trimmed_text = trim_message_content(text_content, message_age)
            # Update the text section with trimmed content
            for section in content:
                if section.get("type") == "text" and "text" in section:
                    section["text"] = trimmed_text  #type: ignore
                    break

    return messages