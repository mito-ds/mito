from mitosheet.streamlit.v1 import spreadsheet
import streamlit as st

st.set_page_config(layout="wide")


spreadsheet(import_folder='data')