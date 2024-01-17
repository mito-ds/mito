from typing import Any, Dict, List
from mitosheet.types import StepsManagerType


def get_all_params_for_step_type(params: Dict[str, Any], steps_manager: StepsManagerType) -> List[Any]:
    """
    Gets all the params for a given step type, in reverse order they were performed
    """
    step_type = params['step_type']

    # Loop over the steps backwards, so that we get the most recent ones first
    found_params: List[Any] = []
    for step in steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1][::-1]:
        if step.step_type == step_type:
            exists_already = False
            if step_type == 'graph':
                # Check if there are any steps that were already added that match this param
                for found_param in found_params:
                    if step.params['graph_id'] == found_param['graph_id']:
                        exists_already = True
            
            if not exists_already:
                found_params.append(step.params)

    # Return empty list if no params were found
    return found_params