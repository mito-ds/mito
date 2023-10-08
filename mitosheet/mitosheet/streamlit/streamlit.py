
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet


st.set_page_config(layout="wide")

def ADD_ONE():
    return 1


df = pd.DataFrame({'A': [1, 2, 3]})
selection = spreadsheet(df, return_type='selection')
st.write(selection)