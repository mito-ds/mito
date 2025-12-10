import pandas as pd


def _is_describe_output(df: pd.DataFrame) -> bool:
    """
    Detect if DataFrame is the result of a describe() call.

    describe() DataFrames have specific characteristics:
    - Index contains statistical measures (count, mean, std, min, 25%, 50%, 75%, max)
    - Mixed data types (numeric columns become float64)
    - Specific index structure
    """
    if df.empty or len(df.index) < 2:
        return False

    # Check if index contains typical describe() statistical measures
    expected_stats = {"count", "mean", "std", "min", "25%", "50%", "75%", "max"}
    index_values = set(str(idx).strip() for idx in df.index)

    # If most of the expected stats are in the index, likely describe() output
    matches = len(index_values & expected_stats)
    return matches >= 5  # At least 5 matches indicate describe() output


def register_ipython_formatter():
    """
    Register custom formatter with IPython display system.
    """
    try:
        from IPython.core.getipython import get_ipython

        ip = get_ipython()
        if ip is None:
            return

        # Register formatter for pandas DataFrames with application/x.mito+json (new)
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


def format_dataframe_mimetype(obj: pd.DataFrame) -> dict | None:
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
    columns = list(obj.columns)

    # Get index information - handle MultiIndex
    index_name = obj.index.name if obj.index.name is not None else "index"
    index_dtype = str(obj.index.dtype)

    # Check if we have a MultiIndex
    is_multi_index = isinstance(obj.index, pd.MultiIndex)
    if is_multi_index:
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
        is_truncated = True
        truncation_message = f"Table truncated to {max_rows} rows by pandas display.max_rows setting. Total rows: {total_rows}"
    else:
        display_df = obj
        is_truncated = False
        truncation_message = None

    # Convert DataFrame to JSON-serializable format using pandas.to_json
    try:
        # Reset index to include it in the JSON data
        display_df_reset = display_df.reset_index()

        # Convert to JSON with orient='records' to get list of dicts
        json_data = display_df_reset.to_json(orient="records", date_format="iso")
        import json

        if json_data is None:
            raise ValueError("to_json returned None")
        records = json.loads(json_data)

        # Convert to expected 2D array format
        data = []
        for record in records:
            row = []

            # Handle index (could be multiple columns for MultiIndex)
            if is_multi_index:
                for i in range(index_levels):
                    index_value = record.get(f"level_{i}", "")
                    if pd.isna(index_value):
                        row.append("")
                    elif (
                        isinstance(index_value, str) and "T" in index_value
                    ):  # ISO datetime string
                        # Parse and format datetime
                        try:
                            from datetime import datetime

                            dt = datetime.fromisoformat(
                                index_value.replace("Z", "+00:00")
                            )
                            row.append(dt.strftime("%Y-%m-%d %H:%M:%S"))
                        except:
                            row.append(str(index_value))
                    else:
                        row.append(str(index_value))
            else:
                # Single index
                index_value = record.get("index", "")
                if pd.isna(index_value):
                    row.append("")
                elif (
                    isinstance(index_value, str) and "T" in index_value
                ):  # ISO datetime string
                    # Parse and format datetime
                    try:
                        from datetime import datetime

                        dt = datetime.fromisoformat(index_value.replace("Z", "+00:00"))
                        row.append(dt.strftime("%Y-%m-%d %H:%M:%S"))
                    except:
                        row.append(str(index_value))
                else:
                    row.append(str(index_value))

            # Handle regular columns
            for col in columns:
                value = record.get(col, "")
                if pd.isna(value):
                    row.append("")
                else:
                    row.append(str(value))
            data.append(row)

    except Exception as e:
        # Fallback to simple string conversion
        if is_multi_index:
            # For MultiIndex, convert each level to string
            index_data = []
            for i in range(index_levels):
                level_data = obj.index.get_level_values(i).astype(str).values.tolist()
                index_data.append(level_data)

            # Zip index levels together
            index_rows = list(zip(*index_data))
            column_data = display_df.astype(str).values.tolist()
            data = [
                list(idx_row) + col_row
                for idx_row, col_row in zip(index_rows, column_data)
            ]
        else:
            # Single index fallback
            index_data = display_df.index.astype(str).values.tolist()
            column_data = display_df.astype(str).values.tolist()
            data = [
                list(idx_row) + col_row
                for idx_row, col_row in zip(index_data, column_data)
            ]

    # Prepare column metadata - include index as first column(s)
    column_metadata = []

    # Add index column(s) first
    if is_multi_index:
        for i, name in enumerate(index_names):
            column_metadata.append({"name": str(name), "dtype": f"level_{i}"})
    else:
        column_metadata.append({"name": str(index_name), "dtype": index_dtype})

    # Add regular columns
    for col in columns:
        dtype = str(obj[col].dtype)
        column_metadata.append({"name": str(col), "dtype": dtype})

    # Prepare the data payload
    payload = {
        "columns": column_metadata,
        "data": data,
        "isTruncated": is_truncated,
        "totalRows": total_rows,
        "displayRows": len(display_df),
        "isMultiIndex": is_multi_index,
        "indexLevels": index_levels if is_multi_index else None,
    }

    # Return mimetype data for JupyterLab
    return payload
