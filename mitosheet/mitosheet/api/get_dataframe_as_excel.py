import io
import base64
import pandas as pd
from mitosheet.sheet_functions.types.utils import NUMBER_SERIES, is_int_dtype
from mitosheet.state import FORMAT_ACCOUNTING, FORMAT_CURRENCY, FORMAT_DEFAULT, FORMAT_K_M_B, FORMAT_PERCENTAGE, FORMAT_PLAIN_TEXT, FORMAT_ROUND_DECIMALS, FORMAT_SCIENTIFIC_NOTATION

from mitosheet.steps_manager import StepsManager

def get_excel_range_from_column_index(col_index: int) -> str:
    """
    Number to Excel-style column name, e.g., 1 = A:A, 26 = Z:Z, 27 = AA:AA, 703 = AAA:AAA.
    """
    # Add 1 because Mito 0 indexes columns
    col_index = col_index + 1
    name = ''
    while col_index > 0:
        col_index, r = divmod (col_index - 1, 26)
        name = chr(r + ord('A')) + name
    return name + ':' + name


def get_dataframe_as_excel(event, steps_manager: StepsManager):
    """
    Sends a dataframe as a excel string.
    """
    sheet_indexes = event['sheet_indexes']

    # We write to a buffer so that we don't have to save the file
    # to the file system for no reason
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer) as writer:
        workbook  = writer.book
        for sheet_index in sheet_indexes:
            df: pd.DataFrame = steps_manager.dfs[sheet_index]
            sheet_name = steps_manager.curr_step.df_names[sheet_index]
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            worksheet = writer.sheets[sheet_name]

            format_data_map = steps_manager.curr_step.column_format_types

            ## This formatting code is wrapped in a if False until we deploy our first pro features
            if False:
                for column_index, column_header in enumerate(df.keys()):
                    column_id = steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
                    column_mito_type = steps_manager.curr_step.column_type[sheet_index][column_id]
                    format_data = format_data_map[sheet_index][column_id]
                    excel_column = get_excel_range_from_column_index(column_index)

                    if (column_mito_type == NUMBER_SERIES):
                        if format_data['type'] == FORMAT_DEFAULT:
                            if is_int_dtype(str(steps_manager.dfs[sheet_index][column_header].dtype)):
                                format = workbook.add_format({'num_format': '#,##0'})
                            else:
                                format = workbook.add_format({'num_format': '#,##0.0'})
                        elif format_data['type'] == FORMAT_PLAIN_TEXT:
                            format = workbook.add_format({'num_format': 'General'})
                        elif format_data['type'] == FORMAT_PERCENTAGE:
                            format = workbook.add_format({'num_format': '0.00%'})
                        elif format_data['type'] == FORMAT_ACCOUNTING:
                            format = workbook.add_format({'num_format': '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)'})
                        elif format_data['type'] == FORMAT_ROUND_DECIMALS:
                            if format_data['numDecimals'] == 0:
                                format = workbook.add_format({'num_format': '#,##0'})
                            else:
                                format = workbook.add_format({'num_format': '#,##0.' + ('0' * format_data['numDecimals'])})
                        elif format_data['type'] == FORMAT_K_M_B:
                            format = workbook.add_format({'num_format': '[<999950]0.0,"K";[<999950000]0.0,,"M";0.0,,,"B"'})
                        elif format_data['type'] == FORMAT_SCIENTIFIC_NOTATION:
                            format = workbook.add_format({'num_format': '0.00E+00'})
                        else:
                            # Default format
                            format = workbook.add_format({'num_format': 'General'})
                    
                        worksheet.set_column(excel_column, None, format)
    
    # Go back to the start of the buffer
    buffer.seek(0)
    
    # First, we take the buffer, and base64 encode it in bytes,
    # and then we covert this to ASCII. On the front-end, we 
    # turn it back into base64, then back to bytes, before 
    # creating a Blob out of it
    return base64.b64encode(buffer.read()).decode('ascii')
