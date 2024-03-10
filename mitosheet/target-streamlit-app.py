import streamlit as st
from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")

st.title('Tesla Stock Volume Analysis')

CSV_URL = 'https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv'
new_dfs, code = spreadsheet(CSV_URL, conditional_formats={
    'columnHeaders': ['open'],
    'filters': {
	    'condition': 'greater_than_or_equal',
		'value': 5
	},
    'backgroundColor': '#000000',
    'color': '#FFFFFF'
})

st.write(new_dfs)
st.code(code)