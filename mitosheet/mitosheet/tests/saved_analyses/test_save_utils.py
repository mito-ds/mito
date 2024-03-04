#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for save utils.
"""
import json
import os
import random

import pandas as pd
import pytest
from mitosheet.saved_analyses import SAVED_ANALYSIS_FOLDER, write_save_analysis_file
from mitosheet.saved_analyses.save_utils import read_and_upgrade_analysis
from mitosheet.step_performers.filter import FC_NUMBER_EXACTLY
from mitosheet.tests.test_utils import (create_mito_wrapper_with_data,
                                        create_mito_wrapper)

# We assume only column A exists
PERSIST_ANALYSIS_TESTS = [
    (0, '=0'),
    (1, '=1'),
    (2, '=A + 1'),
    ('APPLE', '=UPPER(\'apple\')'),
    ('APPLE', '=UPPER(LOWER(UPPER(\'apple\')))')
]
@pytest.mark.parametrize("b_value,b_formula", PERSIST_ANALYSIS_TESTS)
def test_recover_analysis(b_value, b_formula):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula(b_formula, 0, 'B', add_column=True)
    # We first write out the analysis
    analysis_name = mito.mito_backend.analysis_name
    write_save_analysis_file(mito.mito_backend.steps_manager)

    df = pd.DataFrame(data={'A': [1]})
    new_mito = create_mito_wrapper(df)
    new_mito.replay_analysis(analysis_name)

    curr_step = new_mito.curr_step

    assert new_mito.dfs[0]['B'].tolist() == [b_value]
    assert json.dumps(new_mito.curr_step.column_formulas) == json.dumps(curr_step.column_formulas)


@pytest.mark.parametrize("b_value,b_formula", PERSIST_ANALYSIS_TESTS)
def test_persist_analysis_multi_sheet(b_value, b_formula):
    mito = create_mito_wrapper_with_data([1], sheet_two_A_data=[1])
    mito.set_formula(b_formula, 0, 'B', add_column=True)
    mito.set_formula(b_formula, 1, 'B', add_column=True)
    # We first write out the analysis
    analysis_name = mito.mito_backend.analysis_name
    write_save_analysis_file(mito.mito_backend.steps_manager)

    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [1]})

    new_mito = create_mito_wrapper(df1, df2)
    new_mito.replay_analysis(analysis_name)

    curr_step = new_mito.curr_step

    assert new_mito.dfs[0]['B'].tolist() == [b_value]
    assert new_mito.dfs[1]['B'].tolist() == [b_value]
    
    assert json.dumps(new_mito.curr_step.column_formulas) == json.dumps(curr_step.column_formulas)
    assert json.loads(new_mito.analysis_data_json)['code'] == json.loads(mito.analysis_data_json)['code']


def test_persist_rename_column():
    mito = create_mito_wrapper_with_data([1])
    mito.rename_column(0, 'A', 'NEW_COLUMN')

    analysis_name = mito.mito_backend.analysis_name
    write_save_analysis_file(mito.mito_backend.steps_manager)

    df1 = pd.DataFrame(data={'A': [1]})

    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(analysis_name)

    curr_step = new_mito.mito_backend.steps_manager.curr_step

    assert curr_step.dfs[0].equals(pd.DataFrame(data={'NEW_COLUMN': [1]}))

def test_persisit_delete_column():
    mito = create_mito_wrapper_with_data([1])
    mito.delete_columns(0, 'A')

    analysis_name = mito.mito_backend.analysis_name
    write_save_analysis_file(mito.mito_backend.steps_manager)

    df1 = pd.DataFrame(data={'A': [1]})

    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(analysis_name)

    curr_step = new_mito.mito_backend.steps_manager.curr_step

    assert len(curr_step.dfs[0].keys()) == 0


def test_save_analysis_update():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.delete_columns(0, 'A')

    random_name = 'UUID-test_save' + str(random.random())

    mito.save_analysis(random_name)

    df1 = pd.DataFrame(data={'A': [1]})

    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(random_name)

    curr_step = new_mito.mito_backend.steps_manager.curr_step
    assert curr_step.dfs[0].keys() == ['B']

def test_save_analysis_update_and_overwrite():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')

    random_name = 'UUID-test_save' + str(random.random())

    # Save it once    
    mito.save_analysis(random_name)

    mito.delete_columns(0, 'A')
    mito.delete_columns(0, 'B')

    # Save it again
    mito.save_analysis(random_name)

    df1 = pd.DataFrame(data={'A': [1]})

    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(random_name)

    curr_step = new_mito.mito_backend.steps_manager.curr_step
    assert len(curr_step.dfs[0].keys()) == 0


def test_failed_replay_does_not_add_steps():
    # Make an analysis and save it
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    # Try and rerun it on a dataframe it cannot be rerun on
    df = pd.DataFrame(data={'C': [1], 'B': [3]})
    new_mito = create_mito_wrapper(df)

    new_mito.replay_analysis(random_name)

    # Make sure no step was added
    assert len(new_mito.mito_backend.steps_manager.steps_including_skipped) == 1



def test_pivot_by_replays():
    # Make an analysis and save it
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, 
        ['Name'],
        [],
        {'Height': ['sum']}
    )
    
    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    new_mito = create_mito_wrapper(df1)

    new_mito.replay_analysis(random_name)

    # Make sure no step was added
    steps_manager = new_mito.mito_backend.steps_manager
    assert len(steps_manager.steps_including_skipped) == 2
    assert steps_manager.steps_including_skipped[1].step_type == 'pivot'
    assert len(steps_manager.curr_step.dfs) == 2
    assert steps_manager.curr_step.dfs[1].equals(
        pd.DataFrame({'Name': ['Nate'], 'Height sum': [9]})
    )


def test_merge_replays():
    # Make an analysis and save it
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.merge_sheets(
        'lookup',
        0, 0,
        [['Name', 'Name']],
        ['Name', 'Height'],
        ['Name', 'Height']
    )
    
    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(random_name)

    steps_manager = new_mito.mito_backend.steps_manager
    assert len(steps_manager.steps_including_skipped) == 2
    assert steps_manager.steps_including_skipped[1].step_type == 'merge'
    assert len(steps_manager.curr_step.dfs) == 2
    assert steps_manager.curr_step.dfs[1].equals(
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Height_df1': [4, 5], 'Height_df1_2': [4, 5]})
    )

TEST_FILE_PATH = 'test_file.csv'

def test_import_replays():

    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATH, index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATH])
    
    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    # Try and rerun it on a dataframe it cannot be rerun on
    new_mito = create_mito_wrapper()
    new_mito.replay_analysis(random_name)

    os.remove(TEST_FILE_PATH)

    # Make sure no step was added
    assert len(mito.steps_including_skipped) == 2
    assert mito.steps_including_skipped[1].step_type == 'simple_import'
    assert len(mito.curr_step.dfs) == 1
    assert mito.curr_step.dfs[0].equals(
        df
    )


def test_replay_analysis_does_not_make_removed_columns():

    df1 = pd.DataFrame(data={'A': [123], 'B': [1234]})
    mito = create_mito_wrapper(df1)

    mito.add_column(0, 'C')

    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    # Try and rerun it on a dataframe with no column B, and it shouldn't recreate B
    df1 = pd.DataFrame(data={'A': [123]})
    new_mito = create_mito_wrapper(df1)
    new_mito.replay_analysis(random_name)


    assert list(new_mito.dfs[0].keys()) == ['A', 'C']


def test_upgrades_old_analysis_before_replaying_it():
    with open(f'{SAVED_ANALYSIS_FOLDER}/UUID-test-upgrade.json', 'w+') as f:
        saved_analysis = {
            'version': '0.1.60',
            'steps': {"1": {"step_version": 1, "step_type": "group", "sheet_index": 0, "group_rows": ["A"], "group_columns": [], "values": {"B": "sum"}}},
        }
        f.write(json.dumps(saved_analysis))

    df = pd.DataFrame({'A': [123], 'B': [123]})
    new_mito = create_mito_wrapper(df)
    new_mito.replay_analysis('UUID-test-upgrade')

    # This pivot happens to be an identity!
    assert new_mito.dfs[1].equals(
        pd.DataFrame({'A': [123], 'B_sum': [123]})
    )

def test_save_analysis_saves_skipped_steps():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.filter(0, 'A', 'And', FC_NUMBER_EXACTLY, 2)
    mito.filter(0, 'A', 'And', FC_NUMBER_EXACTLY, 3)

    assert len(mito.steps_including_skipped) == 3

    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    saved_analysis = read_and_upgrade_analysis(random_name, ['df1'])
    assert len(saved_analysis['steps_data']) == 1
    assert saved_analysis['steps_data'][0]['params']['filters'][0]['value'] == 3

    new_mito = create_mito_wrapper_with_data([1, 2, 3])
    new_mito.replay_analysis(random_name)

    assert new_mito.dfs[0].equals(
        pd.DataFrame({'A': [3]}, index=[2])
    )


def test_save_replays_overwrite_by_ids_propererly():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.pivot_sheet(0, ['A'], ['A'], {'A': ['sum']}, step_id='1')
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']}, step_id='1')

    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    saved_analysis = read_and_upgrade_analysis(random_name, ['df1'])
    assert len(saved_analysis['steps_data']) == 1

    new_mito = create_mito_wrapper_with_data([1, 2, 3])
    new_mito.replay_analysis(random_name)

    assert new_mito.dfs[1].equals(
        pd.DataFrame({'A': [1, 2, 3], 'A count': [1, 1, 1]})
    )

def test_save_and_replay_different_interface_version_works():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.mito_backend.steps_manager.public_interface_version = 100

    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    saved_analysis = read_and_upgrade_analysis(random_name, ['df1'])
    assert saved_analysis is not None
    assert len(saved_analysis['steps_data']) == 0
    print(saved_analysis)
    assert saved_analysis['public_interface_version'] == 100

    new_mito = create_mito_wrapper_with_data([1, 2, 3])
    new_mito.replay_analysis(random_name)

    assert new_mito.mito_backend.steps_manager.public_interface_version == 100

def test_replay_failed_analysis_does_not_change_public_interface_version():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.delete_columns(0, ['A'])
    mito.mito_backend.steps_manager.public_interface_version = 100

    random_name = 'UUID-test_save' + str(random.random())
    mito.save_analysis(random_name)

    new_mito = create_mito_wrapper(pd.DataFrame({'B': [1, 2, 3]}))
    starting_val = new_mito.mito_backend.steps_manager.public_interface_version
    new_mito.replay_analysis(random_name)

    assert new_mito.mito_backend.steps_manager.public_interface_version == starting_val
    assert len(new_mito.optimized_code_chunks) == 0