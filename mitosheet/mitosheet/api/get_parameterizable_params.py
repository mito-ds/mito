#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Tuple
from mitosheet.code_chunks.code_chunk_utils import get_code_chunks
from mitosheet.types import StepsManagerType
from mitosheet.updates.args_update import is_string_arg_to_mitosheet_call


def get_parameterizable_params(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:


        all_parameterizable_params: List[Tuple[str, str]] = []

        # First, get the original arguments to the mitosheet - we only let you parameterize df names for now
        for arg in steps_manager.original_args_raw_strings:
                if not is_string_arg_to_mitosheet_call(arg):
                        all_parameterizable_params.append((arg, 'df_name'))
    
        # Get optimized code chunk, and get their parameterizable params
        code_chunks = get_code_chunks(steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1], optimize=True)

        for code_chunk in code_chunks:
                parameterizable_params = code_chunk.get_parameterizable_params()
                all_parameterizable_params.extend(parameterizable_params)

        return json.dumps(all_parameterizable_params)
