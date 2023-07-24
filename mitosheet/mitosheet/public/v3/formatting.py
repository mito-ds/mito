from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet

from openpyxl.styles import Font, PatternFill
from openpyxl.styles import NamedStyle

def add_formatting_to_excel_sheet( params: dict[Workbook, str, dict]) -> None:
    """
    Adds formatting to the sheet_name, based on the formatting the user
    currently has applied in the frontend. 

    NOTE: this is a Mito Pro feature.
    """
    workbook = params['workbook']
    sheet_name = params['sheet_name']
    format = params['format']
    sheet = workbook.get_sheet_by_name(sheet_name)
    
    # Add formatting to the header row    
    header_name = f"{sheet_name}_Header"
    if format.get('headers'):
        header_format = NamedStyle(name=header_name)
        # Add font and background colors to the header format
        if format['headers']['color']:
            font_color = format['headers']['color'][1:]
            header_format.font = Font(color=font_color)
        if format['headers']['backgroundColor']:
            background_color = format['headers']['backgroundColor'][1:]
            header_format.fill = PatternFill(start_color=background_color, end_color=background_color, fill_type="solid")
        
        # Add named styles for the header rows to improve performance
        workbook.add_named_style(header_format)

        # Write the formatting to the sheet
        for col in range(1, sheet.max_column + 1):
            sheet.cell(row=1, column=col).style = header_name
