# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mitosheet.streamlit.v1 import spreadsheet
import streamlit as st

st.set_page_config(layout="wide")


dfs, code = spreadsheet(import_folder='data')
st.code(code)