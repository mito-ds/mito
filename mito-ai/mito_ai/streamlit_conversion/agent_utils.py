import difflib
from typing import List
from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.prompts.streamlit_system_prompt import (
    streamlit_system_prompt,
)
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from anthropic.types import MessageParam
from unidiff import PatchSet

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192  # 64_000
    temperature = 0

    print(f"Getting response from agent...: ")
    accumulated_response = ""
    async for stream_chunk in stream_anthropic_completion_from_mito_server(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=streamlit_system_prompt,
        messages=message_to_agent,
        stream=True,
        message_type=MessageType.STREAMLIT_CONVERSION,
        reply_fn=None,
        message_id="",
    ):
        accumulated_response += stream_chunk
    return accumulated_response


def apply_patch_to_text(text: str, diff: str) -> str:
    """
    Apply a *unified-diff* (git-style) patch to the given text and return
    the updated contents.

    Parameters
    ----------
    text : str
        The original file contents.
    diff : str
        A unified diff that transforms *text* into the desired output.
        The diff must reference exactly one file (the Streamlit app).

    Returns
    -------
    str
        The patched contents.

    Raises
    ------
    ValueError
        If the patch cannot be applied or references more than one file.
    """
    # Nothing to do
    if not diff.strip():
        return text

    # Parse the patch
    patch = PatchSet(diff.splitlines(keepends=True))

    # We expect a single-file patch (what the prompt asks the model to emit)
    if len(patch) != 1:
        raise ValueError(
            f"Expected a patch for exactly one file, got {len(patch)} files."
        )

    file_patch = patch[0]

    original_lines = text.splitlines(keepends=True)
    result_lines: List[str] = []

    cursor = 0  # index in original_lines (0-based)

    for hunk in file_patch:
        # Copy unchanged lines before this hunk
        while cursor < hunk.source_start - 1:
            result_lines.append(original_lines[cursor])
            cursor += 1

        # Apply hunk line-by-line
        for line in hunk:
            if line.is_context:
                result_lines.append(original_lines[cursor])
                cursor += 1
            elif line.is_removed:
                cursor += 1  # Skip this line from the original
            elif line.is_added:
                # Ensure added line ends with newline for consistency
                val = line.value
                if not val.endswith("\n"):
                    val += "\n"
                result_lines.append(val)

    # Copy any remaining lines after the last hunk
    result_lines.extend(original_lines[cursor:])

    return "".join(result_lines)
