#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from enum import Enum
from typing import List
import pandas as pd

"""
    The DataTypeInMito enum is used to signify the type of data in Mito.
    It can be one of four types:

    1. NONE = no data is in Mito
    2. PROVIDED = any data that we provided through our docs, except the tutorial data which has a special designation
    3. TUTORIAL = the tutorial data provided through the docs
    4. PERSONAL = any data not provided by Mito

    NOTE: this should be the same as the enum in Mito.tsx with the same name
"""
class DataTypeInMito(Enum):
    NONE = 'none'
    PROVIDED = 'provided'
    TUTORIAL = 'tutorial'
    PERSONAL = 'personal'


# We keep track of the tutorial and provided data
TUTORIAL_FILE_NAMES = ['Airport-Pets.csv', 'Zipcode-Data.csv']
TUTORIAL_AIRPORT_PETS_COLUMNS = ['Zip', 'City', 'State', 'Division', 'Parking', 'Pets', 'Food', 'Lounge']
TUTORIAL_ZIPCODE_COLUMNS = ['Zip', 'Median_Income', 'Mean_Income', 'Pop']

PROVIDED_TICKET_OFFICE_COLUMNS = ['Zip', 'City', 'State', 'Ticket_Office']
PROVIDED_TICKET_ZIPCODE_COLUMNS = ['Zip', 'Median_Income', 'Median_Income', 'Mean_Income', 'Pop']


def get_data_type_in_mito(dfs: List[pd.DataFrame]) -> DataTypeInMito:
    """
    Returns the DataTypeInMito based on the dataframes passed
    to the function.
    """
    if len(dfs) == 0:
        return DataTypeInMito.NONE

    for df in dfs:
        
        # If the user passed a dataframe with headers the same as the tutorial data
        if (
            df.columns.tolist() == TUTORIAL_AIRPORT_PETS_COLUMNS or 
            df.columns.tolist() == TUTORIAL_ZIPCODE_COLUMNS 
        ): 
            return DataTypeInMito.TUTORIAL

        # If the user passed a dataframe with headers the same as the provided data
        if (
            df.columns.tolist() == PROVIDED_TICKET_OFFICE_COLUMNS or 
            df.columns.tolist() == PROVIDED_TICKET_ZIPCODE_COLUMNS
        ):
            return DataTypeInMito.PROVIDED

    # Otherwise, we have personal data in the tool
    return DataTypeInMito.PERSONAL
