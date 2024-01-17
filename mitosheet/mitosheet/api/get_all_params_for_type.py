from typing import Any, Dict, List
from mitosheet.types import StepsManagerType


def get_all_params_for_type(params: Dict[str, Any], steps_manager: StepsManagerType) -> List[Any]:
    """
    Loops back over the steps, looking for a matching step. Specifically, it tries
    to find the most recent step with the given params passed.

    If execution_data_to_match is passed, then these keys are propagated into the
    params as well (e.g. for use in Pivot). This is a bit of a hack, but ok for now.
    """
    step_type = params['step_type']

    # Loop over the steps backwards, so that we get the most recent one
    found_params: List[Any] = []
    for step in steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1][::-1]:
        if step.step_type == step_type:
            found_params.append(step.params)

    # Return nothing, if there is no step that meets this criteria
    return found_params