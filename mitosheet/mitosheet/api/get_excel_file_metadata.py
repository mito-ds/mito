#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict

import pandas as pd
from mitosheet.types import StepsManagerType


def get_excel_file_metadata(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Given a 'file_name' that should be an XLSX file, 
    will get the metadata for that XLSX file. 

    For now, this is just the sheets this file contains, 
    but in the future we may be able to request more about 
    the workbook
    """
    file_path = params['file_path']

    file = pd.ExcelFile(file_path, engine='openpyxl')
    sheet_names = file.sheet_names

    return json.dumps({
        'sheet_names': sheet_names,
        'size': os.path.getsize(file_path)
    })


