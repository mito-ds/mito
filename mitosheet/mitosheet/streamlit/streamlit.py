
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.subheader("Mito Component Test Page")

name_input = st.text_input("Enter a name", value="Streamlit")
import pandas as pd
df = pd.DataFrame({'A': [name_input]})
num_clicks = mito_component(df, key="foo")