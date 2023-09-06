
import streamlit as st

st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd 
df = pd.read_csv('../../datasets/small-datasets/loans.csv')
selection = spreadsheet(df, import_folder='../../datasets/')
selection = spreadsheet(import_folder='../../datasets/', analysis_name='id-budxwjegsq', key='ABC')