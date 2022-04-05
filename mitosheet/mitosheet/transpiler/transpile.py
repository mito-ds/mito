#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Exports the transpile function, which takes the backend widget
container and generates transpiled Python code.
"""

from typing import List

from mitosheet.preprocessing import PREPROCESS_STEP_PERFORMERS
from mitosheet.types import StepsManagerType


IN_PREVIOUS_STEP_COMMENT = '# You\'re viewing a previous step. Click fast forward in the Mitosheet above to see the full analysis.'

def transpile(steps_manager: StepsManagerType, add_comments: bool=True) -> List[str]:
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

    from mitosheet.steps_manager import get_step_indexes_to_skip
    step_indexes_to_skip = get_step_indexes_to_skip(steps_manager.steps)

    # We only transpile up to the currently checked out step
    for step_index, step in enumerate(steps_manager.steps[:steps_manager.curr_step_idx + 1]):
        # Skip the initalize step, or any step we should skip
        if step.step_type == 'initialize' or step_index in step_indexes_to_skip:
            continue

        # The total code for this step
        step_code = []

        # NOTE: we add a comment if add_comment is True
        if add_comments:
            step_code.append(
                '# ' + step.step_performer.describe(
                    **step.params,
                    df_names=step.df_names
                )
            )
        
        transpiled_code = step.step_performer.transpile( # type: ignore
            step.prev_state, # type: ignore
            step.post_state, # type: ignore
            step.execution_data,
            **step.params
        )
        
        # Make sure to not generate comments or code for steps with no code 
        if len(transpiled_code) > 0:

            step_code.extend(
                transpiled_code
            )
            
            code.extend(step_code)

    # If we have a historical step checked out, then we add a comment letting
    # the user know this is the case
    if steps_manager.curr_step_idx != len(steps_manager.steps) - 1:
        code.append(IN_PREVIOUS_STEP_COMMENT)

    return code
