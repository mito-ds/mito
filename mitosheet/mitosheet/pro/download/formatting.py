import pandas as pd
from mitosheet.is_type_utils import is_int_dtype, is_number_dtype
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
    sheet_name = steps_manager.curr_step.df_names[sheet_index]
    formats = steps_manager.curr_step.df_formats
    format = formats[sheet_index]

    workbook = writer.book
    worksheet = writer.sheets[sheet_name]

    # Create the formatting object for styling headers
    headerFormat = workbook.add_format({ "border": 1, "bold": True })
    if format.get('headers').get('color') is not None:
        headerFormat.set_font_color(format.get('headers').get('color'))
    if format.get('headers').get('backgroundColor') is not None:
        headerFormat.set_bg_color(format.get('headers').get('backgroundColor'))
    
    # Apply formatting to the headers
    worksheet.set_row(0, None, headerFormat)

            
