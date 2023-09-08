
import streamlit as st




st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd 
df = pd.DataFrame({'A': [1, 2, 3]})
selection = spreadsheet(df, return_type='selection')
st.write(selection)