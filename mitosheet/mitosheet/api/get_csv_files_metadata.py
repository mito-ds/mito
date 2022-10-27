#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict

import pandas as pd
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL, DEFAULT_DELIMETER, DEFAULT_ENCODING
from mitosheet.step_performers.import_steps.simple_import import read_csv_get_delimiter_and_encoding_and_decimal
from mitosheet.types import StepsManagerType


def get_csv_files_metadata(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Given a list of 'file_names' that should be CSV files,
    this returns our guesses for delimeters and encodings
    for these files.
    """
    file_names = params['file_names']

    delimeters = []
    encodings = []
    decimals = []
    for file_name in file_names:
        try:
            _, delimiter, encoding, decimal = read_csv_get_delimiter_and_encoding_and_decimal(file_name)
            delimeters.append(delimiter)
            encodings.append(encoding)
            decimals.append(decimal)
        except:
            # The default values displayed in the UI
            delimeters.append(DEFAULT_DELIMETER)
            encodings.append('utf-8')
            decimals.append(DEFAULT_DECIMAL)

    return json.dumps({
        'delimeters': delimeters,
        'encodings': encodings,
        'decimals': decimals
    })


