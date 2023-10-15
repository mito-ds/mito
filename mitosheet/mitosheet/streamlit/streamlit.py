
import streamlit as st
import pandas as pd 
from mitosheet.streamlit.v1 import spreadsheet
from mitosheet.extensions.v1 import ColumnHeader

st.set_page_config(layout="wide")

df = pd.DataFrame({'A': [1, 2, 3]})

def get_data_from_database(first_param: int, second_param: float) -> pd.DataFrame:
    return df

def do_import_with_a_really_long_name(x: int, y: float) -> pd.DataFrame:
    return df + x + y

def add_number_to_df(df: pd.DataFrame, column_header: ColumnHeader, addition: int) -> pd.DataFrame:
    df[column_header] = df[column_header] + addition
    return df

def add_diff_number_to_df_and_this_is_a_long_name(df: pd.DataFrame, number_to_add_and_long_param_name: int, boolean_with_long_name: bool, string_with_long_name: str) -> pd.DataFrame:
    return df + number_to_add_and_long_param_name

spreadsheet(df, editors=[add_number_to_df], importers=[get_data_from_database, do_import_with_a_really_long_name])
