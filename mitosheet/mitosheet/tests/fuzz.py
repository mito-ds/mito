#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import sys
from typing import Any, Dict

import atheris
import pandas as pd

with atheris.instrument_imports():
    import mitosheet
    from mitosheet.step_performers.filter import FC_NUMBER_EXACTLY
    from mitosheet.tests.test_utils import (MitoWidgetTestWrapper,
                                            create_mito_wrapper_dfs)



def get_random_event(fdp: atheris.FuzzedDataProvider) -> Dict[str, Any]:
    """
    Takes a fuzz data provider, returns a random
    event to send to the backend.
    
    TODO: for now, we just use one dataframe
    """
    return {
        'type': 'add_column_edit',
        'step_id': fdp.ConsumeUnicode(4),
        'id': fdp.ConsumeUnicode(4),
        'params': {
            'sheet_index': 0,
            'column_header': fdp.ConsumeUnicode(100),
            'column_header_index': fdp.ConsumeInt(3)
        }
    }


def send_random_event(mito: MitoWidgetTestWrapper, fdp: atheris.FuzzedDataProvider) -> None:

    random_sheet_index = fdp.PickValueInList(list(range(len(mito.dfs))))
    random_existing_column_header = fdp.PickValueInList(list(mito.dfs[random_sheet_index].keys()))

    other_random_sheet_index = fdp.PickValueInList(list(range(len(mito.dfs))))
    random_column_header = fdp.ConsumeUnicode(1)
    other_random_column_header = fdp.ConsumeUnicode(1)

    event = fdp.ConsumeIntInRange(0, 20)

    print(event)

    if event == 0:
        mito.add_column(
            random_sheet_index,
            random_column_header,
            fdp.ConsumeInt(3)
        )
    elif event == 1:
        mito.set_formula(
            '=0', # TODO: randomize this 
            random_sheet_index,
            random_column_header, 
            False,
        )

    elif event == 2:
        mito.merge_sheets(
            'left', # TODO: randomize this
            random_sheet_index, 
            random_column_header, 
            [random_column_header],
            other_random_sheet_index, 
            other_random_column_header,
            [other_random_column_header]
        )

    elif event == 3:
        mito.drop_duplicates(
            random_sheet_index, 
            [random_existing_column_header], # TODO: randomize this 
            'last', # TODO: randomize this
        )

    elif event == 4:
        mito.pivot_sheet(
            random_sheet_index, 
            # TODO: take these from the pivoted sheet
            [random_column_header],
            [other_random_column_header],
            {random_column_header: ['sum']},
            flatten_column_headers=True,
            # TODO: add other params here
        )

    elif event == 5:
        mito.filter(
            random_sheet_index,
            random_column_header,
            'And',
            FC_NUMBER_EXACTLY,
            1
        )
    elif event == 6:
        mito.sort(
            random_sheet_index, 
            random_column_header,
            'ascending'
        )

    elif event == 7:
        mito.reorder_column(
            random_sheet_index, 
            random_column_header, 
            fdp.ConsumeInt(3)
        )

    elif event == 8:
        mito.rename_column(
            random_sheet_index, 
            random_column_header, 
            other_random_column_header
        )

    elif event == 9:
        mito.delete_columns(
            random_sheet_index,
            [random_column_header]
        )

    elif event == 10:
        mito.change_column_dtype(
            random_sheet_index, 
            random_column_header, 
            'string'
        )

    elif event == 11:
        mito.bulk_old_rename(
            move_to_deprecated_id_algorithm=fdp.ConsumeBool()
        )

    elif event == 12:
        mito.undo()

    elif event == 13:
        mito.redo()

    elif event == 14:
        mito.clear()

    elif event == 15:
        mito.delete_dataframe(random_sheet_index)

    elif event == 16:
        mito.duplicate_dataframe(random_sheet_index)

    elif event == 17:
        mito.rename_dataframe(random_sheet_index, random_column_header)

    elif event == 18:
        mito.set_cell_value(
            random_sheet_index, 
            random_column_header,
            fdp.ConsumeInt(3),
            other_random_column_header
        )

    elif event == 19:
        pass # TODO: simple import
    elif event == 20:
        pass # TODO: excel import


NUM_EVENTS = 20

def TestMito(data):
    import random
    fdp = atheris.FuzzedDataProvider(data)
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [random.randint(0, 100) for _ in range(50)], 'B': [random.randint(0, 100) for _ in range(50)]}))

    for _ in range(NUM_EVENTS):
        send_random_event(mito, fdp)

    print("NUM STEPS:", len(mito.steps))


atheris.Setup(sys.argv, TestMito)
atheris.Fuzz()
