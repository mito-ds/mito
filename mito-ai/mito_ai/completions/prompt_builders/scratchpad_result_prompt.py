# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.models import ScratchpadResultMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_scratchpad_result_prompt(md: ScratchpadResultMetadata) -> str:
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Continue working on your current task using the scratchpad results below."),
        SG.Generic("Scratchpad Result", f"The result of your scratchpad is: {md.scratchpadResult}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)
