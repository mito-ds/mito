#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""Utilities for working work NaN values."""

from copy import copy
from typing import Set, Tuple

import numpy as np


NAN_STRING = 'NaN'

def is_nan_in_set(s: Set) -> bool:
    return NAN_STRING in s or any(map(lambda x: isinstance(x, float) and np.isnan(x), s))

def get_set_without_nan_values(s: Set) -> Tuple[Set, bool]:
    if is_nan_in_set(s):
        return set(filter(lambda x: (isinstance(x, float) and not np.isnan(x)) and not x != NAN_STRING, s)), True
    return s, False

def toggle_values_in_set(s: Set, values_to_toggle: Set, add_to_set: bool) -> Set:
    if add_to_set:
        new_set = set(s)
        new_set.update(values_to_toggle)
    else:
        if is_nan_in_set(s) and is_nan_in_set(values_to_toggle):
            # Take out NaN
            new_set = set(filter(lambda x: (isinstance(x, float) and not np.isnan(x)) and not x != NAN_STRING, s))
            # Then, the rest of the values to toggle
            new_set = copy(new_set).difference(values_to_toggle)
        else:
            new_set = copy(s).difference(values_to_toggle)

    return new_set