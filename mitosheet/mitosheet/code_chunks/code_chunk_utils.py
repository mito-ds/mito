#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from copy import copy
from typing import TYPE_CHECKING, List, Optional, Any, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.code_chunks.step_performers.filter_code_chunk import FilterCodeChunk
from mitosheet.code_chunks.step_performers.sort_code_chunk import SortCodeChunk

if TYPE_CHECKING:
    from mitosheet.step import Step
else:
    Step = Any

def optimize_code_chunks_combine_right(code_chunks_to_optimize: List[CodeChunk]) -> Tuple[bool, List[CodeChunk]]:
    """
    Given a list of code chunks, will attempt to optimize them right
    with a single pass.
    """

    code_chunks_to_optimize = copy(code_chunks_to_optimize)
    code_chunks_to_optimize.reverse() # Reverse the list so we can pop from the old front quickly

    code_chunks_list: List[CodeChunk] = []

    optimized = False
    while len(code_chunks_to_optimize) >= 2:
        later_code_chunk = code_chunks_to_optimize.pop()
        earlier_code_chunk = code_chunks_to_optimize.pop()

        combined_chunk = later_code_chunk.combine_right(earlier_code_chunk)

        if combined_chunk is not None:
            # If we can combine the two chunks into one, take that
            optimized = True
            code_chunks_to_optimize.append(combined_chunk)
        else:
            # If we cannot combine the two chunks, take the first chunk, 
            # and reset the second one to the new first chunk for the next loop
            code_chunks_list.append(later_code_chunk)
            code_chunks_to_optimize.append(earlier_code_chunk)            
    
    # Make sure we take the final item in the code chunks list, 
    # as it has nothing to combine_right with
    if len(code_chunks_to_optimize) == 1:
        code_chunks_list.append(code_chunks_to_optimize[0])

    return optimized, code_chunks_list

def optimize_code_chunks_combine_left(code_chunks_to_optimize: List[CodeChunk]) -> Tuple[bool, List[CodeChunk]]:
    """
    Given a list of code chunks, will attempt to optimize them left
    with a single pass.
    """

    code_chunks_to_optimize = copy(code_chunks_to_optimize)
    code_chunks_list: List[CodeChunk] = []

    optimized = False
    while len(code_chunks_to_optimize) >= 2:
        later_code_chunk = code_chunks_to_optimize.pop()
        earlier_code_chunk = code_chunks_to_optimize.pop()

        combined_chunk = later_code_chunk.combine_left(earlier_code_chunk)

        if combined_chunk is not None:
            # If we can combine the two chunks into one, take that
            optimized = True
            code_chunks_to_optimize.append(combined_chunk)
        else:
            # If we cannot combine the two chunks, take the first chunk, 
            # and reset the second one to the new first chunk for the next loop
            code_chunks_list.append(later_code_chunk)
            code_chunks_to_optimize.append(earlier_code_chunk)            
    
    # Make sure we take the final item in the code chunks list, 
    # as it has nothing to combine_left with
    if len(code_chunks_to_optimize) == 1:
        code_chunks_list.append(code_chunks_to_optimize[0])

    # Since we build the result backwards, we have to reverse it at the end
    code_chunks_list.reverse()

    return optimized, code_chunks_list



def optimize_code_chunks(all_code_chunks: List[CodeChunk]) -> List[CodeChunk]:
    """
    Given a list of code chunks, will recursively attempt to optimize them 
    down to the smallest list of code chunks that have the same effects
    as the original list. 

    This is necessarily recursive, because of a situation like [A, A, B, B], 
    where A and B can be combined to a No-op. Thus, after one call, we end with 
    [A, B], and we need to recurse to finish the optimization.
    """

    optimized_right, code_chunks_list = optimize_code_chunks_combine_right(all_code_chunks)
    optimized_left, code_chunks_list = optimize_code_chunks_combine_left(code_chunks_list)

    # As long as we optimized in this iteration, recurse as we might
    # need to optimize again
    if optimized_right or optimized_left:
        return optimize_code_chunks(code_chunks_list)

    return code_chunks_list
    

def get_code_chunks(all_steps: List[Step], optimize: bool=True) -> List[CodeChunk]:
    """
    A utility for taking all the steps in the steps manager, and returning a list
    of CodeChunks that correspond to these steps. 

    optimize is by default True, which results in these CodeChunks being optimized
    down to the smallest possible list of CodeChunks that implements the same ops.
    """
    from mitosheet.steps_manager import get_step_indexes_to_skip
    step_indexes_to_skip = get_step_indexes_to_skip(all_steps)

    all_code_chunks: List[CodeChunk] = []
    for step_index, step in enumerate(all_steps):
        # Skip the initalize step, or any step we should skip
        if step.step_type == 'initialize' or step_index in step_indexes_to_skip:
            continue

        all_code_chunks.extend(step.step_performer.transpile(
            step.prev_state, # type: ignore
            step.post_state, # type: ignore
            step.params,
            step.execution_data,
        ))

    if optimize:
        code_chunks_list = optimize_code_chunks(all_code_chunks)
    else:
        code_chunks_list = all_code_chunks

    return code_chunks_list


# NOTE: we cannot use get_right_combine_with_column_delete_code_chunk on sort/filter, 
# as sort potentially changes the indexes of the dataframe, which is a lasting change
# that occurs even after this column is deleted. Hence, we throw errors in this util 
# so that remember to not do that
CANNOT_RIGHT_COMBINE_WITH_DELETE_COLUMNS: List[CodeChunk] = [
    FilterCodeChunk,
    SortCodeChunk
]

def get_right_combine_with_column_delete_code_chunk(
        code_chunk: CodeChunk,
        delete_columns_code_chunk: DeleteColumnsCodeChunk,
        sheet_index_key: str, 
        column_id_key: str, 
    ) -> Optional[CodeChunk]:
    """
    A lot of the operations that work on single columns, when right combined with
    a delete column chunk, can be optimized out. 

    As such, we have a general utility we can apply to apply this optimization
    to a variety of steps, including: setting cell values, setting column formulas.

    NOTE: If you set a cell value, and there are formulas dependent on this column,
    then these formulas refresh. Thus, it might seem like optimizing out the setting
    cell values might lead to invalid code - but notably, you cannot delete columns
    that have columns that are dependant on them - so this is not a problem!
    """
    for invalid_code_chunk_type in CANNOT_RIGHT_COMBINE_WITH_DELETE_COLUMNS:
        if isinstance(code_chunk, invalid_code_chunk_type):
            raise Exception("Code chunk of this type is not valid for right combine with delete", CANNOT_RIGHT_COMBINE_WITH_DELETE_COLUMNS)


    # If the sheet indexes don't match, bail
    if code_chunk.get_param(sheet_index_key) != delete_columns_code_chunk.get_param('sheet_index'):
        return None

    column_id = code_chunk.get_param(column_id_key)
    deleted_column_ids = delete_columns_code_chunk.get_param('column_ids')

    if column_id in deleted_column_ids:
        new_deleted_column_ids = copy(deleted_column_ids)
        new_deleted_column_ids.remove(column_id)

        return DeleteColumnsCodeChunk(
            code_chunk.prev_state,
            delete_columns_code_chunk.post_state,
            delete_columns_code_chunk.params,
            delete_columns_code_chunk.execution_data
        )
    
    return None