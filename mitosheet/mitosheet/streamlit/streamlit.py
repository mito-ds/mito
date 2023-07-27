
import streamlit as st
from mitosheet.streamlit.mito_component import mito_component

st.set_page_config(layout="wide")

st.subheader("Dataframe Created from File Upload")

def importer():
    import pandas as pd
    return pd.DataFrame({'A': [1]})

# open in Mito
new_dfs, code = mito_component(
    r'/Users/aarondiamond-reivich/Mito/monorepo/mitosheet/forestfires_export.csv', 
    importers=[importer], 
    df_names=['df1000'],
    key="mito_component"
)
st.code("\n".join(code))