
import streamlit as st




st.set_page_config(layout="wide")

# Delete ./mito/user.json
button = st.button("Delete user.json")
if button:
    import os
    os.remove('~/.mito/user.json')

st.subheader("Dataframe Created from File Upload")

from mitosheet.streamlit.v1 import spreadsheet
new_dfs, code = spreadsheet(import_folder='~/monorepo/mitosheet/datasets')
st.code(code)