# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, Optional

import pandas as pd


def _is_describe_output(df: pd.DataFrame) -> bool:
    """
    Detect if DataFrame is the result of a describe() call.

    describe() DataFrames have specific characteristics:
    - Index contains statistical measures (count, mean, std, min, max)
    """
    if df.empty or len(df.index) < 5:
        return False

    # Check if index contains typical describe() statistical measures
    expected_stats = {"count", "mean", "std", "min", "max"}
    index_values = set(str(idx).strip() for idx in df.index)

    # If the expected stats are in the index, likely describe() output
    matches = expected_stats.intersection(index_values)
    return len(matches) == 5


def register_ipython_formatter() -> None:
    """
    Register custom formatter with IPython display system.
    """
    try:
        from IPython.core.getipython import get_ipython

        ip = get_ipython() # type: ignore
        if ip is None:
            return

        # Register formatter for pandas DataFrames with application/x.mito+json mimetype
        if getattr(ip, "display_formatter", None) is not None:
            formatter = getattr(ip.display_formatter, "formatters", None)
            if formatter is not None:
                # Try to register with existing mimetype formatter
                if "application/x.mito+json" not in formatter:
                    # Create a new formatter for the custom mimetype
                    from IPython.core.formatters import BaseFormatter

                    class MitoJSONFormatter(BaseFormatter):
                        def __call__(self, obj):
                            if isinstance(obj, pd.DataFrame):
                                # Skip custom formatter for describe() output
                                if _is_describe_output(obj):
                                    return None
                                return format_dataframe_mimetype(obj)
                            else:
                                return None

                    formatter["application/x.mito+json"] = MitoJSONFormatter()

    except ImportError:
        # IPython not available
        pass
    except Exception as e:
        # Log error but don't fail
        print(f"Warning: Could not register mito viewer formatter: {e}")


def format_dataframe_mimetype(obj: pd.DataFrame) -> Optional[Dict]:
    """
    Format a pandas DataFrame as a mimetype object for JupyterLab rendering.

    Args:
        obj: pandas DataFrame to display

    Returns:
        Dictionary with mimetype and data for JupyterLab renderer, or None if should skip formatting
    """
    # Skip custom formatter for describe() output
    if _is_describe_output(obj):
        return None

    # Get pandas display options
    max_rows = pd.get_option("display.max_rows")

    # Prepare data
    total_rows = len(obj)
    has_multi_columns = isinstance(obj.columns, pd.MultiIndex)
    column_levels = obj.columns.nlevels if has_multi_columns else 1
    columns = list(obj.columns)

    # Get index information - handle MultiIndex
    index_name = obj.index.name if obj.index.name is not None else "index"
    index_dtype = str(obj.index.dtype)

    # Check if we have a MultiIndex
    has_multi_index = isinstance(obj.index, pd.MultiIndex)
    if has_multi_index:
        index_levels = obj.index.nlevels
        index_names = [
            name if name is not None else f"level_{i}"
            for i, name in enumerate(obj.index.names)
        ]
    else:
        index_levels = 1
        index_names = [index_name]

    # Limit rows if necessary
    if max_rows is not None and total_rows > max_rows:
        display_df = obj.head(max_rows)
    else:
        display_df = obj

    # Convert DataFrame to JSON-serializable format using pandas.to_json
    try:
        json_data = display_df.reset_index().to_json(orient="values", date_format="iso")
    except Exception:
        return None

    # Prepare column metadata - include index as first column(s)
    column_metadata = []

    # Add index column(s) first
    for i, name in enumerate(index_names):
        column_metadata.append(
            {
                "name": [str(name)],
                "dtype": f"level_{i + 1}" if has_multi_index else index_dtype,
            }
        )

    # Add regular columns
    for col in columns:
        dtype = str(obj[col].dtype)
        column_metadata.append(
            {"name": list(col) if has_multi_columns else [str(col)], "dtype": dtype}
        )

    # Prepare the data payload
    payload = {
        "columns": column_metadata,
        "data": json_data,
        "totalRows": total_rows,
        "indexLevels": index_levels if has_multi_index else 1,
        "columnLevels": column_levels,
    }

    # Return mimetype data for JupyterLab
    return payload
