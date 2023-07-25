from typing import Optional
from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet

from openpyxl.styles import Font, PatternFill
from openpyxl.styles import NamedStyle
from pandas import ExcelWriter

def add_formatting_to_excel_sheet(
        writer: ExcelWriter,
        sheet_name: str,
        header_background_color: Optional[str]=None,
        header_color: Optional[str]=None
    ) -> None:
        """
        Adds formatting to the sheet_name, based on the formatting the user
        currently has applied in the frontend. 

        NOTE: this is a Mito Pro feature.
        """
        workbook = writer.book
        sheet = workbook.get_sheet_by_name(sheet_name)
        
        # Add formatting to the header row    
        header_name = f"{sheet_name}_Header"
        header_format = NamedStyle(name=header_name)
        if header_color:
            # Remove the # from the color
            header_format.font = Font(color=header_color[1:])
        if header_background_color:
            # Remove the # from the color
            header_format.fill = PatternFill(start_color=header_background_color[1:], end_color=header_background_color[1:], fill_type="solid")
        
        # Only add format if there is a header color or background color
        if header_background_color or header_color:
            # Add named styles for the header rows to improve performance
            workbook.add_named_style(header_format)

            # Write the formatting to the sheet
            for col in range(1, sheet.max_column + 1):
                sheet.cell(row=1, column=col).style = header_name