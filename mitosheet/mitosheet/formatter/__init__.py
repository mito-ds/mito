import pandas
import uuid
from .viewer import format_dataframe_viewer, register_ipython_formatter


def format_dataframe(obj: pandas.DataFrame) -> str:
    """
    Legacy formatter using gridjs. Use format_dataframe_viewer for the new React-based viewer.
    """
    uid = uuid.uuid4().hex

    # Dirty demo implementation using gridjs
    # !! CSS and JS are loaded in each view...
    # Load from CDN for simplicity but should be bundled properly in production
    # For large dataframes, this could be optimized by only sending a subset of the data
    # Does not handle dates properly
    # Does not handle theme
    return f"""<link
    href="https://unpkg.com/gridjs/dist/theme/mermaid.min.css"
    rel="stylesheet"
/>
<script src="https://unpkg.com/gridjs/dist/gridjs.umd.js"></script>
<div id="gridjs-mitosheet-{uid}"></div>
<script>
    new gridjs.Grid({{
        columns: {list(obj.columns)!s},
        data: {obj.to_json(orient="values")},
        pagination: {{
            enabled: true,
            limit: 10,
        }},
        search: true,
        sort: true,
    }}).render(document.getElementById("gridjs-mitosheet-{uid}"));
</script>"""


# Register the new viewer formatter by default
register_ipython_formatter()

#
# Alternative implementation using iframe and srcdoc
#
#     srcdoc = f"""<html>
# <head>
#     <link
#         href="https://unpkg.com/gridjs/dist/theme/mermaid.min.css"
#         rel="stylesheet"
#     />
#     <script src="https://unpkg.com/gridjs/dist/gridjs.umd.js"></script>
# </head>
# <body>
#     <div id="gridjs-mitosheet-{uid}"></div>
#     <script>
#         new gridjs.Grid({{
#             columns: {list(obj.columns)!s},
#             data: {obj.to_json(orient="values")},
#             pagination: {{
#                 enabled: true,
#                 limit: 10,
#             }},
#             search: true,
#             sort: true,
#         }}).render(document.getElementById("gridjs-mitosheet-{uid}"));
#     </script>
# </body>
# </html>"""

#     return f'<iframe srcdoc="{srcdoc.replace(chr(34), "&quot;")}" style="width: 100%; height: 400px; border: none;"></iframe>'
