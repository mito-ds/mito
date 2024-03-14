import pandas as pd
import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")
st.title('Tesla Stock Volume Analysis')

df = pd.DataFrame({
    'a': [1, 2, 3],
    'b': [4, 5, 6]
})
new_dfs, code = spreadsheet(df)

st.write(new_dfs)
st.code(code)