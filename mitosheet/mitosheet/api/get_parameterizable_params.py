#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.code_chunks.code_chunk_utils import get_code_chunks
from mitosheet.types import StepsManagerType


def get_parameterizable_params(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    
        # Get optimized code chunk
        code_chunks = get_code_chunks(steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1], optimize=True)

        all_parameterizable_params = []
        for code_chunk in code_chunks:
                parameterizable_params = code_chunk.get_parameterizable_params()
                all_parameterizable_params.extend(parameterizable_params)

        return json.dumps(all_parameterizable_params)
