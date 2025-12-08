import json
import pandas as pd
import uuid
from typing import Any, Dict, List


def format_dataframe_viewer(obj: pd.DataFrame) -> str:
    """
    Format a pandas DataFrame as an interactive HTML table using React components.

    Args:
        obj: pandas DataFrame to display

    Returns:
        HTML string with embedded React table component
    """
    uid = uuid.uuid4().hex

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

    # Generate HTML with embedded React component
    html = f"""
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/mitosheet@latest/mitosheet/mito_viewer.js"></script>
<div id="mito-viewer-{uid}" class="mito-viewer-container"></div>
<script type="text/javascript">
(function() {{
    const payload = {json.dumps(payload)};
    const containerId = 'mito-viewer-{uid}';
    
    // Create and mount the React component
    function initMitoViewer() {{
        if (typeof window.mitoViewer !== 'undefined') {{
            window.mitoViewer.render(containerId, payload);
        }} else {{
            // Fallback: create a simple table if React component is not available
            createFallbackTable(containerId, payload);
        }}
    }}
    
    function createFallbackTable(containerId, payload) {{
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '<div class="mito-viewer-fallback">';
        
        if (payload.isTruncated && payload.truncationMessage) {{
            html += '<div class="mito-viewer-warning" style="background-color: var(--jp-warn-color0, #fff3cd); color: var(--jp-warn-color1, #856404); padding: 8px; border-radius: 4px; margin-bottom: 10px;">' + payload.truncationMessage + '</div>';
        }}
        
        html += '<table style="width: 100%; border-collapse: collapse; font-family: var(--jp-ui-font-family, system-ui, -apple-system, sans-serif);">';
        
        // Header
        html += '<thead><tr>';
        payload.columns.forEach(col => {{
            html += '<th style="background-color: var(--jp-layout-color2, #f5f5f5); padding: 8px; text-align: left; border: 1px solid var(--jp-border-color2, #e0e0e0);">' + col.name + '</th>';
        }});
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        payload.data.forEach(row => {{
            html += '<tr>';
            row.forEach(cell => {{
                html += '<td style="padding: 8px; border: 1px solid var(--jp-border-color2, #e0e0e0);">' + cell + '</td>';
            }});
            html += '</tr>';
        }});
        html += '</tbody></table>';
        
        html += '</div>';
        container.innerHTML = html;
    }}
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', initMitoViewer);
    }} else {{
        initMitoViewer();
    }}
}})();
</script>
"""

    return html


def register_ipython_formatter():
    """
    Register the custom formatter with IPython display system.
    """
    try:
        from IPython.display import display_html
        from IPython.core.getipython import get_ipython

        ip = get_ipython()
        if ip is None:
            return

        # Register the formatter for pandas DataFrames
        if hasattr(ip, "display_formatter") and ip.display_formatter is not None:
            formatter = getattr(ip.display_formatter, "formatters", None)
            if formatter is not None and "text/html" in formatter:
                formatter["text/html"].for_type(pd.DataFrame, format_dataframe_viewer)

    except ImportError:
        # IPython not available
        pass
    except Exception as e:
        # Log error but don't fail
        print(f"Warning: Could not register mito viewer formatter: {e}")
