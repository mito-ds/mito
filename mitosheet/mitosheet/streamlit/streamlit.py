
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet


st.set_page_config(layout="wide")

def ADD_ONE():
    return 1

df = pd.DataFrame({ 'A': [1, 2, 3], 'B': [4, 5, 6] })
analysis = spreadsheet(
    import_folder='/Users/marthacryan/gitrepos/mito/mitosheet/datasets',
    return_type='analysis'
)
st.write(analysis.param_metadata)
updated_metadata = {}
for param in analysis.param_metadata:
    if param['subtype'] in ['file_name_export_excel', 'file_name_export_csv']:
        new_param = st.text_input(param['name'], value=param['initial_value'])
    elif param['subtype'] in ['file_name_import_excel', 'file_name_import_csv']:
        new_param = st.file_uploader(param['name'])
    else:
        continue
    if new_param:
        updated_metadata[param['name']] = new_param


run = st.button('Run')
if run:
    st.write(analysis.run(**updated_metadata))