
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.subheader("Dataframe Created from Streamlit Inputs")

name_input = st.text_input("Enter a name", value="Streamlit")
import pandas as pd
df = pd.DataFrame({'A': [name_input]})
new_dfs = mito_component(df, key="foo")
st.write(new_dfs)

st.subheader("Dataframe Created from File Upload")

file = st.file_uploader("Upload a file")
# Write file to a path
if file is not None:
    with open(file.name, "wb") as f:
        f.write(file.getbuffer())

    # open in Mito
    new_dfs = mito_component(file.name, key="bar")

    st.write(new_dfs)