
import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

new_dfs, code = spreadsheet(r'test_1.csv')
st.code(code)

_, code1 = spreadsheet(*new_dfs.values(), key="spreadsheet_2")
st.code(code1)

print("\n\n")