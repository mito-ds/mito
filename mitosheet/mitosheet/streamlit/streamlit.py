
import streamlit as st




st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd 
df = pd.DataFrame({'A': [1, 2, 3]})
new_dfs, code = spreadsheet(df, df_names=['df1'], import_folder='.', code_options={'as_function': True, 'call_function': True, 'function_name': 'test', 'function_params': 'import_dataframe'})
st.code(code)