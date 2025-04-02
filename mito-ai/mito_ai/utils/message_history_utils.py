import re
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

    # Replace "Files in the current directory:" section
    content = re.sub(
        f"{re.escape(FILES_SECTION_HEADING)}\n(?:.+\n)+",
        f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}\n",
        content,
    )

    # Replace "Defined Variables:" section
    content = re.sub(
        f"{re.escape(VARIABLES_SECTION_HEADING)}\n(?:.+\n)+",
        f"{VARIABLES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}\n",
        content,
    )

    # Replace "{JUPYTER_NOTEBOOK_SECTION_HEADING}" section
    content = re.sub(
        f"{re.escape(JUPYTER_NOTEBOOK_SECTION_HEADING)}\n(?:.+\n)+",
        f"{JUPYTER_NOTEBOOK_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}\n",
        content,
    )

    return content
