#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
After reading in the arguments passed to the frontend,
this update figures out which of them were dataframes
and which of them were file paths, and updates the 
df names in the steps properly.
"""

from mitosheet.utils import get_valid_dataframe_names

ARGS_UPDATE_EVENT = 'args_update'
ARGS_UPDATE_PARAMS = ['args']


def is_str_df_name(arg):
    """
    Helper function that returns true if this argument
    name is in fact a file path - aka it is passed
    as a string to the mitosheet (not a dataframe
    variable directly).
    """
    return arg.startswith('\'') or arg.startswith('\"')

def execute_args_update(
        steps_manager,
        args
    ):
    """
    Changes the df_names in the current step from information
    from the frontend.

    The information from the frontend is a list of all the parameters
    to the mitosheet.sheet call, which may contain both dataframe names
    as well as as strings. 

    For the dataframe names, we take them as is. For the strings, we 
    strip the quotes, and turn them into valid df names. NOTE: the df
    names we turn it into _must be the same as the names transpiled_
    by the preprocess read file paths preprocessing step!
    """

    # We send / don't do anything with empty df_name updates
    # as we want the sheet to refresh in this case with no errors
    if len(args) > 0:
        # Get all the string arguments, and strip off the quotes
        str_args = [arg for arg in args if is_str_df_name(arg)]
        str_args = [str_arg[1:-1] for str_arg in str_args]

        # Then, we turn these into dataframe names.
        # NOTE: there is potentially a bug if a user passes in a dataframe
        # with the same name as the the result of the return of this function,
        # but we ignore this for now. E.g. mitosheet.sheet('df1.csv', 'df1_csv') 
        # will cause only variable to exist.
        str_df_names = get_valid_dataframe_names([], str_args)

        final_names = []
        used_str_df_names = 0
        for arg in args:
            if is_str_df_name(arg):
                final_names.append(str_df_names[used_str_df_names])
                used_str_df_names += 1
            else:
                final_names.append(arg)

        # Finially, we don't add more names than there are dataframes (as this is clearly
        # nonsense), and thus this allows us to filter out Nones that are passed at the 
        # end of the arguments (not creating phantom tabs that cannot be clicked)
        steps_manager.curr_step.post_state.df_names = final_names[:len(steps_manager.curr_step.dfs)]
    

ARGS_UPDATE = {
    'event_type': ARGS_UPDATE_EVENT,
    'params': ARGS_UPDATE_PARAMS,
    'execute': execute_args_update
}