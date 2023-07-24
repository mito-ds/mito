
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

new_dfs, code = mito_component(
    df_names=['df1000'],
    key="mito_component"
)
st.code("\n".join(code))