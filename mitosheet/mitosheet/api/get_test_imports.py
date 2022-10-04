#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List
from mitosheet.step import Step
from mitosheet.types import StepsManagerType
from mitosheet.errors import MitoError

GENERIC_DATA_ERROR = 'There was an error importing this data. Please select a different file or dataframe and try again.'


def get_test_imports(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    updated_step_import_data: Any = params['updated_step_import_data']

    invalid_import_indexes: Dict[int, str] = dict()
    index = 0
    for step_import_data in updated_step_import_data:
        imports = step_import_data['imports']

        for _import in imports:
            try:
                step = Step(_import['step_type'], 'fake_id', _import["params"])
                executed = step.set_prev_state_and_execute(steps_manager.steps_including_skipped[0].final_defined_state)
                if not executed:
                    invalid_import_indexes[index] = GENERIC_DATA_ERROR
            except MitoError as e:
                from mitosheet.errors import get_recent_traceback
                print(get_recent_traceback())
                invalid_import_indexes[index] = e.to_fix
            except:
                invalid_import_indexes[index] = GENERIC_DATA_ERROR

            index += 1

    return json.dumps(invalid_import_indexes)
