from mitosheet.streamlit.v1 import spreadsheet
import streamlit as st
import pandas as pd

st.set_page_config(layout="wide")

file = st.file_uploader("Upload a file", type=["csv", "xlsx"])
if file is not None:
    df = pd.read_csv(file)

    dfs, code = spreadsheet(df, import_folder='data')
    st.code(code)