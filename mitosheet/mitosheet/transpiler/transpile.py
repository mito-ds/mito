#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Exports the transpile function, which takes the backend widget
container and generates transpiled Python code.
"""

from typing import Any, Dict, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import get_code_chunks

from mitosheet.preprocessing import PREPROCESS_STEP_PERFORMERS
from mitosheet.types import StepsManagerType


IN_PREVIOUS_STEP_COMMENT = '# You\'re viewing a previous step. Click fast forward in the Mitosheet above to see the full analysis.'

def transpile(
        steps_manager: StepsManagerType, 
        add_comments: bool=True,
        optimize: bool=True
    ) -> List[str]:
    """
    Transpiles the code from the current steps in the steps_manager, 
    displaying up to the checked out step.

    If add_comments, then adds descriptive comments using the step 
    describe functions. 
    """

    code = []

    # First, we transpile all the preprocessing steps
    for preprocess_step_performer in PREPROCESS_STEP_PERFORMERS:
        preprocess_code = preprocess_step_performer.transpile(
            steps_manager,
            steps_manager.preprocess_execution_data[preprocess_step_performer.preprocess_step_type()]
        )
        if len(preprocess_code) > 0:
            code.extend(preprocess_code)

    # We only transpile up to the currently checked out step
    all_code_chunks: List[CodeChunk] = get_code_chunks(steps_manager.steps[:steps_manager.curr_step_idx + 1], optimize=optimize)
    
    for code_chunk in all_code_chunks:
        comment = '# ' + code_chunk.get_description_comment()
        gotten_code = code_chunk.get_code()

        # Make sure to not generate comments or code for steps with no code 
        if len(gotten_code) > 0:
            if add_comments:
                gotten_code.insert(0, comment)
            code.extend(gotten_code)

    # If we have a historical step checked out, then we add a comment letting
    # the user know this is the case
    if steps_manager.curr_step_idx != len(steps_manager.steps) - 1:
        code.append(IN_PREVIOUS_STEP_COMMENT)

    return code
