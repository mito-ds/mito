# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
import re
from anthropic.types import MessageParam
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from unidiff import PatchSet
from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER
from mito_ai.completions.models import MessageType

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

def extract_todo_placeholders(agent_response: str) -> List[str]:
    """Extract TODO placeholders from the agent's response"""
    return [line.strip() for line in agent_response.split('\n') if MITO_TODO_PLACEHOLDER in line]


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
        NOTE: This assumes a custom format where BOTH -X,Y and +X,Y
        reference the original file line numbers.

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
    if len(patch) == 0:
        raise ValueError("No patches found in diff")
    
    # Check that all patches are for the same file
    file_names = set(p.source_file for p in patch)
    if len(file_names) > 1:
        raise ValueError(
            f"Expected patches for exactly one file, got files: {file_names}"
        )

    # Apply all hunks from all patches (they should all be for the same file)
    original_lines = text.splitlines(keepends=True)
    result_lines: List[str] = []
    cursor = 0  # index in original_lines (0-based)

    # Process all hunks from all patches
    # We only expect one patch file, but it always returns as a list 
    # so we just iterate over it
    for file_patch in patch:
        for hunk in file_patch:
            # Since hunks reference the original file, just convert to 0-based
            hunk_start = hunk.source_start - 1
            
            # Copy unchanged lines before this hunk
            while cursor < hunk_start:
                if cursor < len(original_lines):
                    result_lines.append(original_lines[cursor])
                cursor += 1

            # Apply hunk line-by-line
            for line in hunk:
                if line.is_context:
                    # Use the line from the diff to preserve exact formatting
                    result_lines.append(line.value)
                    cursor += 1
                elif line.is_removed:
                    cursor += 1  # Skip this line from the original
                elif line.is_added:
                    # Use the line from the diff to preserve exact formatting
                    result_lines.append(line.value)

    # Copy any remaining lines after the last hunk
    result_lines.extend(original_lines[cursor:])

    return "".join(result_lines)


def fix_context_lines(diff: str) -> str:
    """
    Fix context lines in unified diff to ensure they all start with a space character.
    
    In unified diffs, context lines (unchanged lines) must start with a single space ' ',
    even if the line itself is empty. The AI sometimes generates diffs where empty
    context lines are just blank lines without the leading space, which causes the
    unidiff parser to fail.
    
    Args:
        diff (str): The unified diff string
        
    Returns:
        str: The corrected diff with proper context line formatting
    """
    lines = diff.split('\n')
    corrected_lines = []
    in_hunk = False
    
    for i, line in enumerate(lines):
        # Check if we're entering a hunk
        if line.startswith('@@'):
            in_hunk = True
            corrected_lines.append(line)
            continue
            
        # Check if we're leaving a hunk (new file header)
        if line.startswith('---') or line.startswith('+++'):
            in_hunk = False
            corrected_lines.append(line)
            continue
            
        if in_hunk:
            # We're inside a hunk
            if line.startswith(' ') or line.startswith('-') or line.startswith('+'):
                # Already has proper diff marker
                corrected_lines.append(line)
            elif line.strip() == '':
                # Empty line should be a context line with leading space
                corrected_lines.append(' ')
            else:
                # Line without diff marker - treat as context line
                corrected_lines.append(' ' + line)
        else:
            # Outside hunk - keep as is
            corrected_lines.append(line)
    
    return '\n'.join(corrected_lines)
    

def fix_diff_headers(diff: str) -> str:
    """
    The AI is generally not very good at counting the number of lines in the diff. If the hunk header has
    an incorrect count, then the patch will fail. So instead we just calculate the counts ourselves, its deterministic.
    
    If no header is provided at all, then there is nothing to fix.
    """
    # First fix context lines to ensure they have proper leading spaces
    diff = fix_context_lines(diff)
    
    lines = diff.split('\n')
    
    for i, line in enumerate(lines):
        if line.startswith('@@'):
            # Extract the starting line numbers
            match = re.match(r'@@ -(\d+),\d+ \+(\d+),\d+ @@', line)
            if match:
                old_start = match.group(1)
                new_start = match.group(2)
                
                # Count lines in this hunk
                old_count = 0
                new_count = 0
                
                # Find the end of this hunk (next @@ line or end of file)
                hunk_end = len(lines)
                for j in range(i + 1, len(lines)):
                    if lines[j].startswith('@@'):
                        hunk_end = j
                        break
                
                # Count lines in this hunk
                for j in range(i + 1, hunk_end):
                    hunk_line = lines[j]
                    # Empty lines are treated as context lines
                    if hunk_line == '' or hunk_line.startswith(' ') or hunk_line.startswith('-'):
                        old_count += 1
                    if hunk_line == '' or hunk_line.startswith(' ') or hunk_line.startswith('+'):
                        new_count += 1
                
                # Replace the header with correct counts
                lines[i] = f"@@ -{old_start},{old_count} +{new_start},{new_count} @@"
    
    corrected_diff = '\n'.join(lines)
    corrected_diff = corrected_diff.lstrip()
    
    # If there is no diff, just return it without fixing file headers
    if len(corrected_diff) == 0:
        return corrected_diff
    
    # Remove known problametic file component headers that the AI sometimes returns
    problamatic_file_header_components = ['--- a/app.py +++ b/app.py']
    for problamatic_file_header_component in problamatic_file_header_components:
        corrected_diff = corrected_diff.removeprefix(problamatic_file_header_component).lstrip()
        
    
    # If the diff is missing the file component of the header, add it
    valid_header_component = """--- a/app.py
+++ b/app.py"""
    if not corrected_diff.startswith(valid_header_component):
        corrected_diff = valid_header_component + '\n' + corrected_diff
    
    return corrected_diff


async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192 # 64_000
    temperature = 0.2

    accumulated_response = ""
    async for stream_chunk in stream_anthropic_completion_from_mito_server(
        model = model,
        max_tokens = max_tokens,
        temperature = temperature,
        system = streamlit_system_prompt,
        messages = message_to_agent,
        stream=True,
        message_type=MessageType.STREAMLIT_CONVERSION,
        reply_fn=None,
        message_id=""
    ):
        accumulated_response += stream_chunk
    return accumulated_response