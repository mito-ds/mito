#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from collections import deque
from copy import copy
from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.step import Step


def get_code_chunks(all_steps: List[Step], optimize: bool=True) -> List[CodeChunk]:
    from mitosheet.steps_manager import get_step_indexes_to_skip
    step_indexes_to_skip = get_step_indexes_to_skip(all_steps)

    all_code_chunks: List[CodeChunk] = []
    for step_index, step in enumerate(all_steps):
        # Skip the initalize step, or any step we should skip
        if step.step_type == 'initialize' or step_index in step_indexes_to_skip:
            continue

        all_code_chunks.extend(step.step_performer.transpile(
            step.prev_state,
            step.post_state,
            step.params,
            step.execution_data,
        ))

    # Make it into a stack
    all_code_chunks_reversed = copy(all_code_chunks)
    all_code_chunks_reversed.reverse()

    if optimize:
        code_chunks_list: List[CodeChunk] = []

        # TODO: we could do this in a continual loop - as it actually 
        # is not something that will necessarily be finished after one
        # pass. NOTE: see the test in test_add_column.py
        while len(all_code_chunks_reversed) >= 2:
            first_code_chunk = all_code_chunks_reversed.pop()
            second_code_chunk = all_code_chunks_reversed.pop()

            combined_chunk = first_code_chunk.combine_right(second_code_chunk)

            if combined_chunk is not None:
                all_code_chunks_reversed.append(combined_chunk)
            else:
                code_chunks_list.append(first_code_chunk)
                all_code_chunks_reversed.append(second_code_chunk)            
        
        if len(all_code_chunks_reversed) == 1:
            code_chunks_list.append(all_code_chunks_reversed[-1])
    else:
        code_chunks_list = all_code_chunks

    return code_chunks_list
