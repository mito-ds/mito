import json
import os
import pandas as pd


def get_excel_file_metadata(event, steps_manager):
    """
    Given a 'file_name' that should be an XLSX file, 
    will get the metadata for that XLSX file. 

    For now, this is just the sheets this file contains, 
    but in the future we may be able to request more about 
    the workbook
    """
    file_name = event['file_name']

    file = pd.ExcelFile(file_name)
    sheet_names = file.sheet_names
    return json.dumps({
        'sheet_names': sheet_names,
        'size': os.path.getsize(file_name)
    })


