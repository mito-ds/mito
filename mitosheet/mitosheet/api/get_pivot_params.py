import json
from mitosheet.step_performers.pivot import PivotStepPerformer


def get_pivot_params(event, steps_manager):
    """
    Returns the 'params' object for a pivot step that pivoted
    into this sheet at sheet_index. Notably, returns the _last_
    params that were for this pivot.
    """
    destination_sheet_index = event['destination_sheet_index']

    # Loop over the steps backwards, so that we get the most recent one
    for step in steps_manager.steps[:steps_manager.curr_step_idx + 1][::-1]:
        if step.step_type == PivotStepPerformer.step_type() \
            and step.execution_data['destination_sheet_index'] == destination_sheet_index:
            params = step.params
            return json.dumps({
                'sheet_index': params['sheet_index'],
                'pivot_rows_column_ids': params['pivot_rows_column_ids'],
                'pivot_columns_column_ids': params['pivot_columns_column_ids'],
                'values_column_ids_map': params['values_column_ids_map'],
                'flatten_column_headers': params['flatten_column_headers'],
            })
    
    # Return nothing, if there is no pivot that meets this criteria
    return ''