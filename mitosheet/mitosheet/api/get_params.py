

import json
from typing import Any, Dict

from mitosheet.steps_manager import StepsManager


def get_params(event: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Loops back over the steps, looking for a matching step. Specifically, it tries
    to find the most recent step with the given params passed.
    """
    step_type = event['step_type']
    step_id_to_match = event['step_id_to_match']
    execution_data_to_match = event['execution_data_to_match']

    # Loop over the steps backwards, so that we get the most recent one
    params = None
    for step in steps_manager.steps[:steps_manager.curr_step_idx + 1][::-1]:
        if step.step_type != step_type:
            continue

        if step.step_id == step_id_to_match:
            params = step.params
        
        if step.execution_data is not None and len(execution_data_to_match) > 0:
            for key, value in execution_data_to_match.items():
                all_matched = True
                if step.execution_data[key] != value:
                    all_matched = False
                
                if all_matched:
                    params = step.params


        if params is not None:
            return json.dumps(params)
    
    # Return nothing, if there is no pivot that meets this criteria
    return ''