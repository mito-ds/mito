
import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

new_dfs, code = spreadsheet(import_folder='./datasets')
st.code(code)