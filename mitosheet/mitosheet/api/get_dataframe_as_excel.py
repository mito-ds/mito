#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import base64
import io
from typing import Any, Dict

from mitosheet.types import StepsManagerType
from mitosheet.user import is_pro
from mitosheet.user.utils import is_running_test
from mitosheet.utils import write_to_excel


def get_dataframe_as_excel(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Sends a dataframe as a excel string.
    """
    sheet_indexes = params['sheet_indexes']

    # Formatting is a Mito pro feature, but we also allow it for testing
    export_formatting = params.get('export_formatting', False)
    allow_formatting = (is_pro() or is_running_test()) and export_formatting

    # We write to a buffer so that we don't have to save the file
    # to the file system for no reason
    buffer = io.BytesIO()
    write_to_excel(buffer, sheet_indexes, steps_manager.curr_step.post_state, allow_formatting=allow_formatting)    
    # Go back to the start of the buffer
    buffer.seek(0)
    
    # First, we take the buffer, and base64 encode it in bytes,
    # and then we covert this to ASCII. On the front-end, we 
    # turn it back into base64, then back to bytes, before 
    # creating a Blob out of it
    return base64.b64encode(buffer.read()).decode('ascii')
