
import streamlit as st
import pandas as pd



st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
df = pd.DataFrame({'A': [-2, -1.5, 0, 1, 1.5], 'B': [1,2,3,-4,-5]})
new_dfs, code = spreadsheet(df)
st.code(code)