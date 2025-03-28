# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")
st.title('Tesla Stock Volume Analysis')

CSV_URL = 'https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv'
new_dfs, code = spreadsheet(CSV_URL)

st.write(new_dfs)
st.code(code)