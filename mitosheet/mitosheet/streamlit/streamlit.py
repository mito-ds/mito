
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet


st.set_page_config(layout="wide")

def ADD_ONE():
    return 1


analysis = spreadsheet(
    import_folder='/Users/marthacryan/gitrepos/mito/mitosheet/datasets',
    return_type='analysis',
    code_options={
        'as_function': False,
        'function_name': 'analysis',
        'function_params': {},
        'import_custom_python_code': False,
        'call_function': False
    }
)
st.write(analysis)

run = st.button('Run')
if run:
    st.write(analysis.run())