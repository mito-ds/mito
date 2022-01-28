from typing import Any, Dict
from mitosheet.steps_manager import StepsManager


def get_column_dtype(event: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Sends back the dtype of the column
    """
    sheet_index = event['sheet_index']
    column_id = event['column_id']
    column_header = steps_manager.curr_step.get_column_header_by_id(sheet_index, column_id)

    series = steps_manager.dfs[sheet_index][column_header]

    return str(series.dtype)