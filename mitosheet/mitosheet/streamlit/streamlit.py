
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

file = st.file_uploader("Upload a file")
# Write file to a path
if file is not None:
    with open(file.name, "wb") as f:
        f.write(file.getbuffer())

    # open in Mito
    new_dfs, code = mito_component(file.name, key="bar")

    st.write(new_dfs)
    st.write(code)