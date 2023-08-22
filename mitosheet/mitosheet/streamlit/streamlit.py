
import streamlit as st




st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
new_dfs, code = spreadsheet('https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv', import_folder='.')
st.code(code)