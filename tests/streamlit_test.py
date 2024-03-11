from mitosheet.streamlit.v1 import spreadsheet
import streamlit as st

st.set_page_config(layout="wide")


dfs, code = spreadsheet(import_folder='data', height='520px')
st.code(code)