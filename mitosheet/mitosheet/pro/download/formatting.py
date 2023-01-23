import pandas as pd
from mitosheet.sheet_functions.types.utils import is_int_dtype, is_number_dtype
from mitosheet.state import (NUMBER_FORMAT_ACCOUNTING,
                             NUMBER_FORMAT_PERCENTAGE, NUMBER_FORMAT_PLAIN_TEXT, NUMBER_FORMAT_SCIENTIFIC_NOTATION)
from mitosheet.types import StepsManagerType

from mitosheet.excel_utils import get_excel_range_from_column_index


def add_formatting_to_excel_sheet(
        writer: pd.ExcelWriter, 
        steps_manager: StepsManagerType, 
        sheet_index: int,
    ) -> None:
    """
    Adds formatting to the sheet_name, based on the formatting the user
    currently has applied in the frontend. 

    NOTE: this is a Mito Pro feature.
    """
    df = steps_manager.dfs[sheet_index]
    sheet_name = steps_manager.curr_step.df_names[sheet_index]

    # TODO: fix up below
    return

    format_data_map = steps_manager.curr_step.column_format_types[sheet_index]

    workbook  = writer.book
    worksheet = writer.sheets[sheet_name]

    ## This formatting code is wrapped in a if False until we deploy our first pro features
    for column_index, column_header in enumerate(df.keys()):
        column_id = steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
        column_dtype = str(df[column_header].dtype)
        format_data = format_data_map[column_id]
        excel_column = get_excel_range_from_column_index(column_index)

        if (is_number_dtype(column_dtype)):
            format = workbook.add_format({'num_format': 'General'})
            worksheet.set_column(excel_column, None, format)