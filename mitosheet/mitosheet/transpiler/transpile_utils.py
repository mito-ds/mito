from copy import deepcopy
from typing import TYPE_CHECKING, Any, Dict, List, Set, Union

if TYPE_CHECKING:
    from mitosheet.steps_manager import StepsManager
else:
    StepsManager = Any

from mitosheet.types import ColumnHeader


def column_header_list_to_transpiled_code(column_headers: Union[List[Any], Set[Any]]) -> str:
    """
    A helper function for turning a list of column headers into a 
    valid list of Python code.
    """
    transpiled_column_headers = [
        column_header_to_transpiled_code(column_header)
        for column_header in column_headers
    ]
    joined_transpiled_column_headers = ', '.join(transpiled_column_headers)
    return f'[{joined_transpiled_column_headers}]'


def column_header_to_transpiled_code(column_header: ColumnHeader) -> str:
    """
    Makes sure the column header is correctly transpiled to 
    code in a way that makes sure it's referenced properly.

    Handles multi-index, boolean, string, and number columns 
    correctly.
    """
    # If this is a multi-index header, then we turn each of the pieces of the column
    # header into valid transpiled code, and then we combine them into a tuple
    if isinstance(column_header, tuple):
        column_header_parts = [column_header_to_transpiled_code(column_header_part) for column_header_part in column_header]
        column_header_parts_joined = ', '.join(column_header_parts)
        return f'({column_header_parts_joined})'

    if isinstance(column_header, int) or isinstance(column_header, float) or isinstance(column_header, bool):
        return str(column_header)
    return repr(column_header)

def list_to_string_without_internal_quotes(list: List[Any]) -> str:
    """
    Helper function for formatting a list as a string without 
    leading and trailing '
    """
    string = (', ').join(list)
    return "[" + string +  "]"


def get_steps_to_transpile(steps_manager: StepsManager):
    """
    0:
        Input: 0
        Output: 1
    1:
        Input: 1
        Output: Delete 1
    0:
        Input: 0
        Output: 1

    # Step 1: Move from sheet index -> sheet id

    First, we move from using sheet indexes for keeping track of dataframes to 
    sheet ids. This makes this entire algorithm much easier. We first construct 
    a mapping from step index -> sheet index -> sheet id. 
    
    To assign an ID to a dataframe, we simply ID it with the string 
    `{sheet_index}_{num_deletes}` before the dataframe was imported, making
    sure to keep track of things properly in the case of a delete.

    # Step 2: Figure out what additional steps we can skip

    Loop over the unskipped steps from start to finish. For each step:
        - If a dataframe is created:
            Update creation_step_index from sheet id -> step index
        - If a dataframe is deleted:
            Loop from the creation_step_index of that sheet to the current
            index, looking for steps that take this dataframe as input, and
            output a different dataframe. 

            If there is a step that takes this dataframe as input and outputs
            a different dataframe as output, then continue. Otherwise, mark
            all the steps that take this dataframe as input as skippable as 
            well, in the transpilation step. 
    """
    from mitosheet.step_performers.dataframe_steps.dataframe_delete import \
        DataframeDeleteStepPerformer

    # Step 1: create IDs

    sheet_id_map: Dict[int, Dict[int, str]] = {}
    num_deletes = 0
    for step_index, step in enumerate(steps_manager.curr_unskipped_steps):
        if step_index == 0:
            # TODO: handle dataframes that are passed to mitosheet?
            sheet_id_map[step_index] = dict()
        else:
            sheet_id_map[step_index] = deepcopy(sheet_id_map[step_index - 1])
        
        new_sheet_indexes_this_step = step.new_sheet_indexes_this_step

        for sheet_index in new_sheet_indexes_this_step:
            sheet_id_map[step_index][sheet_index] = f'{sheet_index}_{num_deletes}'
        
        if step.step_type == DataframeDeleteStepPerformer.step_type():
            deleted_sheet_index = step.params['sheet_index']
            for sheet_index in range(deleted_sheet_index, len(step.dfs)):
                sheet_id_map[step_index][sheet_index] = sheet_id_map[step_index][sheet_index + 1]
            del sheet_id_map[step_index][len(step.dfs)] # TODO: might be an off by one

            num_deletes += 1

    # Step 2: Figure out which additional steps to skip
    additional_step_indexes_to_skip_in_transpiling = set()
    creation_step_index: Dict[str, int] = {} 

    curr_unskipped_steps = steps_manager.curr_unskipped_steps

    for step_index, step in enumerate(curr_unskipped_steps):
        new_sheet_indexes_this_step = step.new_sheet_indexes_this_step
        if len(new_sheet_indexes_this_step) != 0:
            for sheet_index in new_sheet_indexes_this_step:
                sheet_id = sheet_id_map[step_index][sheet_index]
                creation_step_index[sheet_id] = step_index
        if step.step_type == DataframeDeleteStepPerformer.step_type():
            print(f'Step {step_index} is a delete. Trying to see if we can optimize')
            # First, find the sheet id deleted
            deleted_sheet_index = step.params['sheet_index']
            sheet_id = sheet_id_map[step_index - 1][deleted_sheet_index]

            optimizable = True
            steps_to_remove = set()
            for partial_past_step_index, past_step in enumerate(curr_unskipped_steps[creation_step_index[sheet_id]:step_index]):
                past_step_index = partial_past_step_index + creation_step_index[sheet_id]

                if past_step_index == 0:
                    continue

                newly_created_ids = set(sheet_id_map[past_step_index][index] for index in past_step.new_sheet_indexes_this_step)
                # First, we check if this dataframe was newly created here
                if newly_created_ids == {sheet_id}:
                    steps_to_remove.add(past_step_index)
                    continue

                input_sheet_indexes = past_step.input_sheet_indexes
                if input_sheet_indexes == {-1}:
                    input_sheet_ids = newly_created_ids
                else:
                    input_sheet_ids = set(sheet_id_map[past_step_index - 1][index] for index in input_sheet_indexes)
                output_sheet_indexes = past_step.output_sheet_indexes
                if output_sheet_indexes == {-1}:
                    output_sheet_ids = newly_created_ids
                else:
                    output_sheet_ids = set(sheet_id_map[past_step_index - 1][index] for index in output_sheet_indexes)
                
                if {sheet_id} == input_sheet_ids and input_sheet_ids != output_sheet_ids:
                    optimizable = False

                if {sheet_id} == input_sheet_ids and {sheet_id} == output_sheet_ids:
                    steps_to_remove.add(past_step_index)

            if optimizable:
                additional_step_indexes_to_skip_in_transpiling.update(steps_to_remove)
                additional_step_indexes_to_skip_in_transpiling.add(step_index)
        
    return [step for step_index, step in enumerate(steps_manager.curr_unskipped_steps) if step_index not in additional_step_indexes_to_skip_in_transpiling]




        

