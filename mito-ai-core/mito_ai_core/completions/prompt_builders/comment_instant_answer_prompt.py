# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional

from mito_ai_core.completions.models import AIOptimizedCell, KernelVariable
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_comment_instant_answer_prompt(
    comment_type: str,
    comment_value: str,
    variables: List[KernelVariable],
    files: List[str],
    ai_optimized_cells: Optional[List[AIOptimizedCell]] = None,
    has_cell_output: bool = False,
) -> str:
    """Build a one-off prompt that answers a document-mode review comment.

    The comment is rendered through the same SelectedContext formatting used
    for chat comments, so code comments include the selected code and output
    comments reference the cell output.
    """
    instructions = (
        "The user is reviewing their notebook as a document and left a review comment with a question. "
        "Answer their question directly and concisely, like a colleague replying to a comment thread in Google Docs. "
        "Explain why the code or output is the way it is — for example design decisions, how a number was calculated, "
        "or what a piece of code does. Do not propose code changes or rewrite their code unless they explicitly ask. "
        "Keep your answer short: a few sentences or a short list."
    )

    sections: List[PromptSection] = [
        SG.Generic("Instructions", instructions),
        SG.Files(files),
        SG.Variables(variables),
        SG.Notebook(ai_optimized_cells or []),
        SG.SelectedContext([{"type": comment_type, "value": comment_value}]),
    ]

    if has_cell_output:
        sections.append(
            SG.Generic("Cell Output", "An image of the commented cell's output is attached to this message.")
        )

    sections.append(SG.Task("Answer the user's review comment above."))

    prompt = Prompt(sections)
    return str(prompt)
