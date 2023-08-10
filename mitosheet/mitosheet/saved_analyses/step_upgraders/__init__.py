#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
This module contains functions that upgrade steps from one version
to another version. 

# Why

Imagine a user has a saved analysis that they created with an older
version of mitosheet. The add column step in that saved analysis
takes the parameters (sheet_index, column_name).

Then, we create a new version of mitosheet that changes the add column
step to take the parameters (sheet_index, column_name, column_type).

If we don't upgrade the saved analysis, then when the user loads
the saved analysis, the add column step will be missing the column_type
parameter, and the step will fail to execute. 

Thus, anytime you add a parameter to a step, you must write an upgrade
function that adds the parameter to the step. We do this as we have a 
really strong forwards compatibility guarantee. We _never_ want to break
a user's saved analysis!

# How

1.  Go to the step performer of the step you wish to upgrade. Find the old step version -- 
    e.g. in mitosheet/step_performers/graph_steps/graph.py, the step_version is 4 currently.
    Bump the version number by 1.
2.  Create a new file in this directory called {step}.py, if it doesn't already exist.
3.  In that file, create a function called upgrade_{step}_{old_version_num}_to_{new_version_num}.
4.  In that function, write code that upgrades the step from the old version to the new version.
    In most cases, this will mean adding a new parameter to the step, and setting a default
    value for that parameter.
5.  In the upgrade.py file, edit the STEP_UPGRADES_FUNCTION_MAPPING_NEW_FORMAT dictionary
    to include the new upgrade function you just wrote.
6.  Write a test for the upgrade function you just wrote. See mitosheet/tests/test_upgrade.py --
    where you can add an entry to the UPGRADE_TESTS. (The "version" field isn't too important, 
    you can use whatever other tests are using)
7.  Update the version in test_step_format.py in the tests directory to use the new version. 

When adding a test, you can generate a new saved analysis by running the old version of mitosheet,
and using the old version of the step you are upgrading. Then, open ~/.mito/saved_analyses and find 
the analysis with that ID. 

Then, copy that analysis into mitosheet/tests/saved_analyses - and properly specify what the new 
format should be.
"""