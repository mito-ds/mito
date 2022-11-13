import json
from typing import Any, Dict, List, Optional
import pandas as pd
from mitosheet.types import ConditionalFormattingCellResults, ConditionalFormattingInvalidResults, ConditionalFormattingResult, StateType
from mitosheet.utils import MAX_ROWS, NpEncoder


def get_conditonal_formatting_result(
        state: StateType,
        sheet_index: int,
        df: pd.DataFrame,
        conditional_formatting_rules: List[Dict[str, Any]],
        max_rows: Optional[int]=MAX_ROWS,
    ) -> ConditionalFormattingResult: 
    from mitosheet.step_performers.filter import check_filters_contain_condition_that_needs_full_df

    invalid_conditional_formats: ConditionalFormattingInvalidResults = dict()
    formatted_result: ConditionalFormattingCellResults = dict()

    for conditional_format in conditional_formatting_rules:
        try:

            format_uuid = conditional_format["format_uuid"]
            column_ids = conditional_format["columnIDs"]

            for column_id in column_ids:
                if column_id not in formatted_result:
                    formatted_result[column_id] = dict()

                filters  = conditional_format["filters"]
                backgroundColor = conditional_format.get("backgroundColor", None)
                color = conditional_format.get("color", None)
                
                # Certain filter conditions require the entire dataframe to be present, as they calculate based
                # on the full dataframe. In other cases, we only operate on the first 1500 rows, for speed
                _df = df
                if not check_filters_contain_condition_that_needs_full_df(filters):
                    df = df.head(max_rows)

                column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)

                # Use the get_applied_filter function from our filtering infrastructure
                from mitosheet.step_performers.filter import \
                    get_full_applied_filter
                full_applied_filter, _ = get_full_applied_filter(_df, column_header, 'And', filters)

                # We can only take the first max_rows here, as this is all we need
                applied_indexes = _df[full_applied_filter].head(max_rows).index.tolist()

                for index in applied_indexes:
                    # We need to make this index valid json, and do so in a way that is consistent with how indexes
                    # are sent to the frontend
                    json_index = json.dumps(index, cls=NpEncoder)
                    formatted_result[column_id][json_index] = {'backgroundColor': backgroundColor, 'color': color}
        except Exception as e:
            if format_uuid not in invalid_conditional_formats:
                invalid_conditional_formats[format_uuid] = []
            invalid_conditional_formats[format_uuid].append(column_id)

    return {
        'invalid_conditional_formats': invalid_conditional_formats,
        'results': formatted_result
    }