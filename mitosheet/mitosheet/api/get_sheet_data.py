import json
from mitosheet.utils import df_to_json_dumpsable

def get_sheet_data(event, steps_manager):
    """
    Returns the sheet data for 1k cells starting at starting_row_index. This
    is the function that allows us to lazy-load data into the sheet

    Params:
    -   sheet_index: number - the sheet to load
    -   starting_row_index: number - where to actually start the loading from
    """
    sheet_index = event['sheet_index']
    starting_row_index = event['starting_row_index']

    if sheet_index >= len(steps_manager.curr_step.dfs):
        return ''

    df = steps_manager.curr_step.dfs[sheet_index]
    df_name = steps_manager.curr_step.df_names[sheet_index]
    df_source = steps_manager.curr_step.df_sources[sheet_index]

    return json.dumps(df_to_json_dumpsable(
        df, 
        df_name,
        df_source,
        steps_manager.curr_step.column_spreadsheet_code[sheet_index],
        steps_manager.curr_step.column_filters[sheet_index],
        steps_manager.curr_step.column_type[sheet_index],
        steps_manager.curr_step.column_ids.column_header_to_column_id[sheet_index],
        steps_manager.curr_step.column_format_types[sheet_index],
        max_length=1000,
        starting_index=starting_row_index
    ))