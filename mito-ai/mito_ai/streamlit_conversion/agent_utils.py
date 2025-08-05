# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
import re
from unidiff import PatchSet
from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER

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


def fix_diff_headers(diff: str) -> str:
    """
    The AI is generally not very good at counting the number of lines in the diff. If the hunk header has
    an incorrect count, then the patch will fail. So instead we just calculate the counts ourselves, its deterministic.
    """
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
                
                for j in range(i + 1, len(lines)):
                    next_line = lines[j]
                    if next_line.startswith('@@') or next_line.startswith('---'):
                        break
                    if next_line.startswith(' ') or next_line.startswith('-'):
                        old_count += 1
                    if next_line.startswith(' ') or next_line.startswith('+'):
                        new_count += 1
                
                # Replace the header with correct counts
                lines[i] = f"@@ -{old_start},{old_count} +{new_start},{new_count} @@"
    
    return '\n'.join(lines)


