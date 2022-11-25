#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict

import pandas as pd
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL, DEFAULT_DELIMETER, DEFAULT_ENCODING, DEFAULT_SKIPROWS
from mitosheet.step_performers.import_steps.simple_import import read_csv_get_delimiter_and_encoding
from mitosheet.types import StepsManagerType


def get_csv_files_metadata(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Given a list of 'file_names' that should be CSV files,
    this returns our guesses for delimeters and encodings
    for these files, as well as other default parameters that we 
    don't try to guess
    """
    file_names = params['file_names']

    delimeters = []
    encodings = []
    decimals = []
    skiprows = []
    for file_name in file_names:
        try:
            _, delimiter, encoding = read_csv_get_delimiter_and_encoding(file_name)
            delimeters.append(delimiter)
            encodings.append(encoding)
        except:
            # The default values displayed in the UI
            delimeters.append(DEFAULT_DELIMETER)
            encodings.append(DEFAULT_ENCODING)

        # We don't have a good way to guess these params, so we always use the defaults
        decimals.append(DEFAULT_DECIMAL)
        skiprows.append(DEFAULT_SKIPROWS)

    return json.dumps({
        'delimeters': delimeters,
        'encodings': encodings,
        'decimals': decimals,
        'skiprows': skiprows 
    })


