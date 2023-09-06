
import streamlit as st

st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd 
selection = spreadsheet(return_type='selection', analysis_name='id-budxwjegsq')
st.write(selection)