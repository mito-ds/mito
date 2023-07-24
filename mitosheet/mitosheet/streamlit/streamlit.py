
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

def get_loan_data(date: str, include_duplicates: bool):
    pass


new_dfs, code = mito_component(
    importers=[get_loan_data],
    df_names=['df1000'],
    key="mito_component"
)
st.code("\n".join(code))