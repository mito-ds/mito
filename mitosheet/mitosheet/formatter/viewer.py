import pandas as pd


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


def format_dataframe_mimetype(obj: pd.DataFrame) -> dict:
    """
    Format a pandas DataFrame as a mimetype object for JupyterLab rendering.

    Args:
        obj: pandas DataFrame to display

    Returns:
        Dictionary with mimetype and data for JupyterLab renderer
    """
    # Get pandas display options
    max_rows = pd.get_option("display.max_rows")

    # Prepare data
    total_rows = len(obj)
    columns = list(obj.columns)

    # Limit rows if necessary
    if max_rows is not None and total_rows > max_rows:
        display_df = obj.head(max_rows)
        is_truncated = True
        truncation_message = f"Table truncated to {max_rows} rows by pandas display.max_rows setting. Total rows: {total_rows}"
    else:
        display_df = obj
        is_truncated = False
        truncation_message = None

    # Convert DataFrame to JSON-serializable format
    try:
        # Handle different data types and convert to string for display
        data = []
        for index in display_df.index:
            row = display_df.loc[index]
            data_row = []
            for col in columns:
                value = row[col]
                # Handle NaN values
                if pd.isna(value):
                    data_row.append("")
                # Handle datetime objects
                elif hasattr(value, "strftime") and callable(value.strftime):
                    data_row.append(value.strftime("%Y-%m-%d %H:%M:%S"))
                # Handle other objects
                else:
                    data_row.append(str(value))
            data.append(data_row)
    except Exception as e:
        # Fallback to simple string conversion
        data = display_df.astype(str).values.tolist()

    # Prepare column metadata
    column_metadata = []
    for col in columns:
        dtype = str(obj[col].dtype)
        column_metadata.append({"name": str(col), "dtype": dtype})

    # Prepare the data payload
    payload = {
        "columns": column_metadata,
        "data": data,
        "isTruncated": is_truncated,
        "truncationMessage": truncation_message,
        "totalRows": total_rows,
        "displayRows": len(display_df),
    }

    # Return mimetype data for JupyterLab
    return payload
