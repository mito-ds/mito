
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet

df = pd.DataFrame({'A': [1, 2, 3]})

def do_import(x: int, y: float) -> pd.DataFrame:
    return df + x + y
def do_import_with_a_really_long_name(x: int, y: float) -> pd.DataFrame:
    return df + x + y

def add_number_to_df(df: pd.DataFrame, number_to_add: int) -> pd.DataFrame:
    return df + number_to_add
def add_diff_number_to_df_and_this_is_a_long_name(df: pd.DataFrame, number_to_add_and_long_param_name: int, boolean_with_long_name: bool, string_with_long_name: str) -> pd.DataFrame:
    return df + number_to_add_and_long_param_name

spreadsheet(df, editors=[add_number_to_df, add_diff_number_to_df_and_this_is_a_long_name], importers=[do_import, do_import_with_a_really_long_name])