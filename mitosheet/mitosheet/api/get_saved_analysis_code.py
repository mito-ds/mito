from typing import Any, Dict, List, Union
from mitosheet.saved_analyses.save_utils import read_analysis
from mitosheet.types import StepsManagerType

def get_saved_analysis_code(params: Dict[str, Any], steps_manager: StepsManagerType) -> Union[List[str], str, None]:
    if steps_manager.analysis_to_replay is not None:
        analysis = read_analysis(steps_manager.analysis_to_replay)
        return analysis.get("code") if analysis is not None else None
    return None