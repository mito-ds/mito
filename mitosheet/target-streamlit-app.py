import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd

st.set_page_config(layout="wide")

st.title('SKU analysis app')

df = pd.read_csv('./SKU.csv')
new_dfs, code = spreadsheet(
    df, 
    conditional_formats={
        'columnHeaders': ['quantity'],
        'filters': {
            'condition': 'greater_than_or_equal',
            'value': 5
        },
        'backgroundColor': '#ffc9bb',
        'color': '#c61a09'
    },
    height='900px'
)