#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
This file contains utilities for anonyimizing data. See the README.md in
this folder for more details on our approach to private telemetry.
"""

from typing import Any, Dict
from mitosheet.parser import parse_formula
from mitosheet.telemetry.private_params_map import LOG_PARAMS_FORMULAS, LOG_PARAMS_MAP_KEYS_TO_MAKE_PRIVATE, LOG_PARAMS_TO_LINEARIZE, LOG_PARAMS_PUBLIC
from mitosheet.types import StepsManagerType
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_USER_SALT

# When we anonymize, we use some combination of these words
# to construct new private words
valid_words = ['cat', 'dog', 'hat', 'time', 'person', 'year', 'way', 'thing', 'man', 'world', 'life', 'born', 'part', 'child', 'eye', 'woman', 'place', 'work', 'fall', 'case', 'point', 'company', 'number', 'group', 'problem', 'fact']

# We use the same salt to anonymize_words, and we read
# this salt in once the function is called for the first
# time, to make sure it's initialized properly
salt = None
def anonymize_as_string(word: Any) -> str:
    """
    Helper function that turns any specific value into
    a totally anonymous version of the value, consistently.

    Notably, this will cast the given value to a string before 
    anonymizing it.
    """
    # We make sure that the salt is read in after the entire
    # app has been initalized, so that we don't have to read
    # from the file all the time
    global salt
    if salt is None:
        salt = get_user_field(UJ_USER_SALT)

    word = str(word)

    # We select three indexes from the valid_words list, and concatenate them
    index_one = int(hash(salt + word + '0')) % len(valid_words)
    index_two = int(hash(salt + word + '1')) % len(valid_words)
    index_three = int(hash(salt + word + '2')) % len(valid_words)

    return valid_words[index_one] + valid_words[index_two] + valid_words[index_three]


def anonymize_formula(formula: str, sheet_index: int, steps_manager: StepsManagerType=None) -> str:
    """
    Helper function that anonymizes formula to 
    make sure that no private data is included in it.
    """
    if steps_manager is None:
        return anonymize_as_string(formula)

    # We just input a random address, as we don't use it
    _, _, dependencies = parse_formula(
        formula, 
        'A', 
        steps_manager.dfs[sheet_index].columns,
        throw_errors=False
    )
    
    for dependency in dependencies:
        formula = formula.replace(str(dependency), anonymize_as_string(dependency))
    
    return formula

def anonymize_object(obj: Any, anonymize_key: bool=False) -> Any:
    """
    Anoymizes any object it is given, handling any different
    type of object that it might be given.

    If obj is a dict and you want to anonymize the key instead of the value, 
    set anonymize_key=True
    """
    if isinstance(obj, list):
        return [anonymize_as_string(v) for v in obj]
    elif isinstance(obj, dict):
        if anonymize_key:
            return {anonymize_as_string(key) if anonymize_key else key: v for key, v in obj.items()}
        else: 
            return {key: anonymize_as_string(v) for key, v in obj.items()}
    
    return anonymize_as_string(obj)

def get_final_private_params_for_single_kv(key: str, value: Any, params: Dict[str, Any], steps_manager: StepsManagerType=None) -> Dict[str, Any]:
    """
    Given a single key, value pair for a set of params, this function will 
    turn them into a totally anonyimized version of the parameter. 
    """
    private_params: Dict[str, Any] = dict()

    # If this is a log to linearize, then we recurse and create private versions of those
    # nested parameters. Note we only do this if it's actually possible to recurse
    if key in LOG_PARAMS_TO_LINEARIZE and isinstance(value, dict): 
        for nested_key, nested_value in value.items():
            nested_params = get_final_private_params_for_single_kv(nested_key, nested_value, params, steps_manager)
            private_params = {
                **private_params, 
                # NOTE: we linearize the nested keys with {higher_key}_{lower_key} as the new key
                **{key + "_" + k: v for k, v in  nested_params.items()}
            }
    
        return private_params

    if key in LOG_PARAMS_PUBLIC:
        private_params[key] = value
    elif key in LOG_PARAMS_FORMULAS:
        private_params[key] = anonymize_formula(value, params['sheet_index'], steps_manager)
    else:
        private_params[key] = anonymize_object(value, anonymize_key=key in LOG_PARAMS_MAP_KEYS_TO_MAKE_PRIVATE)

    return private_params