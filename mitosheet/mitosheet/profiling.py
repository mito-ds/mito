#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Helper functions for timing the Mito codebase in the least intrusive
way possible :) 
"""

import time

# Change this if you don't want to print anything
PRINT_TIMING = False

def timeit(function):
    """
    A decorator that makes it easy to time a function by just adding @timeit. 

    The PRINT_TIMING variable aboves controls what is done with the resulting
    calculation (e.g. should it be printed, or what). 

    TODO: factor PRINT_TIMING out into a config file?
    """

    # A decorator for timing a function!
    # TODO: make this take the parameter from the sheet function call that 
    def timed(*args, **kwargs):
        time_start = time.time()
        result = function(*args, **kwargs)
        time_end = time.time()
        if PRINT_TIMING:
            print(f'{function.__name__} took {time_end - time_start} seconds.')

        return result 
    return timed