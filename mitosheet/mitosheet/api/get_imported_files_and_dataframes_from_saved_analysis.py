#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.api.get_imported_files_and_dataframes_from_analysis_name import get_step_import_data_from_saved_analysis
from mitosheet.saved_analyses.upgrade import upgrade_saved_analysis_to_current_version
from mitosheet.types import StepsManagerType


def get_imported_files_and_dataframes_from_saved_analysis(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    analysis = upgrade_saved_analysis_to_current_version(params['analysis'])
    return json.dumps(get_step_import_data_from_saved_analysis(analysis))

