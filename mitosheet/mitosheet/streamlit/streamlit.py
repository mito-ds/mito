
import streamlit as st




st.set_page_config(layout="wide")

from mitosheet.streamlit.v1 import spreadsheet
import pandas as pd 
df = pd.read_csv("https://raw.githubusercontent.com/dataprofessor/data/master/nba-player-stats-2019.csv")
selection = spreadsheet(df)
st.write(selection)