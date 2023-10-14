
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet



df = pd.DataFrame({'A': [1, 2, 3]})

def do_import(x: int, y: float) -> pd.DataFrame:
    return df + x + y

def do_edit(df: pd.DataFrame, param_one: int) -> pd.DataFrame:
    return df + param_one

spreadsheet(df, editors=[do_edit], importers=[do_import])