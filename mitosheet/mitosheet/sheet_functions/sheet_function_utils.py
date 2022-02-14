#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains utilities used in multiple sheet functions.
"""
from typing import List, Tuple, Union
import pandas as pd
import numpy as np

def try_extend_series_to_index(series: pd.Series, index_to_fill: Union[pd.Index, pd.MultiIndex]) -> pd.Series:
    """
    Extends a given series to contain the entire index, filling the series
    with the first defined value.

    If the series has > 1 item in it, we assume it is already extended,
    and do not modify it.
    """
    if series.size > 1:
        return series
    return pd.Series([series.iloc[0]] * len(index_to_fill), index=index_to_fill)


def fill_series_with_one_index(series_list: Tuple[pd.Series, ...]) -> Tuple[pd.Series, ...]:
    """
    Extends all series in the series_list so that the indexes
    of every series is defined in each others. Uses the last
    defined index of the series to do so. Avoids the issue:

    pd.Series(data=[1]) + pd.Series(data=[1, 2]) = pd.Series(data=[1, Nan])

    """
    # Get all the one_index_series, so we can fill them
    one_index_series_list = [series for series in series_list if is_series_of_constant(series)]
    # Find a series to fill from (if we cannot, then we can just return)
    non_one_index_series_list = [series for series in series_list if not is_series_of_constant(series)]
    non_one_index_series = non_one_index_series_list[0] if len(non_one_index_series_list) > 0 else one_index_series_list[0]
    
    indexes_to_fill = non_one_index_series.index

    final_series_list = []
    for series in series_list:
        if len(series) == 1:
            final_series = try_extend_series_to_index(series, indexes_to_fill)
            final_series_list.append(final_series)
        else:
            final_series_list.append(series)
    
    return tuple(final_series_list)


def is_series_of_constant(series: pd.Series) -> bool:
    """
    A helper function for determining if a series has been constructed from
    a constant, which means that it is a series with just one element at index
    0.

    We need to make sure to extend these series, so that we can operate on
    them with sheet functions properly. 
    """
    return series.size == 1 and series.index.tolist() == [0]