

import json
from typing import Any, Dict, Optional

from mitosheet.types import StepsManagerType


def get_params(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Loops back over the steps, looking for a matching step. Specifically, it tries
    to find the most recent step with the given params passed.

    If execution_data_to_match is passed, then these keys are propagated into the
    params as well (e.g. for use in Pivot). This is a bit of a hack, but ok for now.
    """
    step_type = params['step_type']
    step_id_to_match = params['step_id_to_match']
    execution_data_to_match = params['execution_data_to_match']

    # Loop over the steps backwards, so that we get the most recent one
    found_params: Optional[Dict[str, Any]] = None
    for step in steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1][::-1]:
        if step.step_type != step_type:
            continue

        if step.step_id == step_id_to_match:
            found_params = step.params
        
        if step.execution_data is not None and len(execution_data_to_match) > 0:
            all_matched = True
            for key, value in execution_data_to_match.items():
                if step.execution_data[key] != value:
                    all_matched = False
                
            if all_matched:
                found_params = dict(**step.params)
                for key, value in execution_data_to_match.items():
                    found_params[key] = value


        if found_params is not None:
            return json.dumps(found_params)
    
    # Return nothing, if there is no pivot that meets this criteria
    return ''