import pandas as pd
import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")
st.title('Tesla Stock Volume Analysis')

df = pd.DataFrame({
    'A': [1, 2, 3, 4, 5, 6, 7, 8, 9],
    'B': [1, 2, 3, 4, 5, 6, 7, 8, 9]
})
new_dfs, code = spreadsheet(
    df, 
    height='700px',
    column_definitions=[
        [
            {
                'columns': ['A', 'B'],
                'conditional_formats': [{
                    'filters': [{'condition': 'abc', 'value': 5}], 
                    'font_color': '#c30010', 
                    'background_color': '#ffcbd1' 
                }] 
            },
            {
                'columns': ['A'],
                'conditional_formats': [{
                    'filters': [{'condition': 'less', 'value': 2}], 
                    'font_color': '#f30010', 
                    'background_color': '#ddcbd1' 
                }] 
            }
        ]
    ]

)

st.write(new_dfs)
st.code(code)