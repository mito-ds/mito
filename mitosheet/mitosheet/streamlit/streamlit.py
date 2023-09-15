
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet


st.set_page_config(layout="wide")


df = pd.DataFrame({'A': [1, 2, 3]})
df.to_csv('file.csv')
func = spreadsheet('file.csv', return_type='function', code_options={'as_function': True, 'call_function': False, 'function_name': 'test', 'function_params': {}, 'import_custom_python_code': True})

st.write(func('file.csv'))