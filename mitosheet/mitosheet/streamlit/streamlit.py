
import streamlit as st
from mitosheet.streamlit.v1.spreadsheet import spreadsheet

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

new_dfs, code = spreadsheet(
    df_names=['df1000'],
    key="mito_component"
)
st.code("\n".join(code))