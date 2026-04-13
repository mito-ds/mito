# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Local Streamlit demo for Mito (e.g. `streamlit run mitosheet/streamlit/v1/apps/mito_streamlit_demo.py`
from the mitosheet package root, or adjust the path for your install).
"""

import pandas as pd
import streamlit as st

from mitosheet.streamlit.v1 import spreadsheet
from mitosheet.streamlit.v1.demo_large_dataframe import build_demo_dataframe

st.set_page_config(layout="wide")
st.title("Mito Streamlit demo")

# Larger sheet (~400 rows + 2 duplicate rows) with missing values, outliers, inconsistent labels
df = build_demo_dataframe(num_rows=400)

st.caption(
    "Sample data has **~400 rows** (plus duplicate tail), with **missing** values, **outliers** in `units`, "
    "mixed **status** labels, and sparse **region** / **category**. "
    "On the **Home** toolbar use **Suggested formulas** to load ghost columns (e.g. unit_price + shipping_fee). "
    "For **AI notes**, open that taskpane, **Refresh notes**, and use the yellow triangles on headers or cells."
)
new_dfs, code = spreadsheet(df)

st.subheader("Result dataframes")
st.write(new_dfs)
st.subheader("Generated code")
st.code(code)
