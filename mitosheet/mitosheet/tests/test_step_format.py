#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for edit events.
"""
import random
from typing import Type

from mitosheet.step_performers import (
    STEP_PERFORMERS,
    StepPerformer,
    PivotStepPerformer,
    FilterStepPerformer,
    SortStepPerformer,
    ReorderColumnStepPerformer,
    AddColumnStepPerformer,
    SetColumnFormulaStepPerformer,
    SetCellValueStepPerformer,
    MergeStepPerformer,
    DeleteColumnStepPerformer,
    RenameColumnStepPerformer,
    ChangeColumnDtypeStepPerformer,
    SimpleImportStepPerformer,
    DataframeDeleteStepPerformer,
    DataframeDuplicateStepPerformer,
    DataframeRenameStepPerformer,
    BulkOldRenameStepPerformer, 
    ExcelImportStepPerformer,
    DropDuplicatesStepPerformer,
    GraphStepPerformer,
    ConcatStepPerformer,
    ExcelRangeImportStepPerformer,
    ExportToFileStepPerformer,
    ResetIndexStepPerformer,
    SnowflakeImportStepPerformer
)
from mitosheet.step_performers.import_steps.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.delete_row import DeleteRowStepPerformer
from mitosheet.step_performers.column_steps.split_text_to_columns import SplitTextToColumnsStepPerformer
from mitosheet.step_performers.fill_na import FillNaStepPerformer
from mitosheet.step_performers.graph_steps.graph_delete import GraphDeleteStepPerformer
from mitosheet.step_performers.graph_steps.graph_duplicate import GraphDuplicateStepPerformer
from mitosheet.step_performers.graph_steps.graph_rename import GraphRenameStepPerformer
from mitosheet.step_performers.melt import MeltStepPerformer
from mitosheet.enterprise.step_performers.one_hot_encoding import OneHotEncodingStepPerformer
from mitosheet.step_performers.promote_row_to_header import PromoteRowToHeaderStepPerformer
from mitosheet.pro.step_performers.set_dataframe_format import SetDataframeFormatStepPerformer
from mitosheet.step_performers.transpose import TransposeStepPerformer

def check_step(
        step_performer: Type[StepPerformer], 
        step_version: int, 
        step_type: str
    ) -> None:
    """
    Helper function that checks a given step definition against the 
    expected step_version, step_type, and params for that step. 

    Throws an assertion error if any of them do not match! 
    """
    assert step_performer.step_version() == step_version
    assert step_performer.step_type() == step_type

def test_params_static():
    """
    NOTE: This is a regression test! Before changing this test to make it pass, talk to 
    the engineering team and make sure you know what you're doing. 

    Remeber:
    1. Each Mito analysis is written to a file, where each step is saved with its
       parameters.
    2. If the _name_ of the step, or the _parameters to the step_ change, then this
       will break existing user analyses. 
    
    Thus, this test is to make sure that we _know_ when we're breaking things. 
    
    However, note that there are ways to break existing user analyses other than this. 
    For example, if you change how the group step flattens headers, this may cause
    issues if the user then later renames one of those flattened columns. So, this
    regression test is not perfect, but it is a good start!
    """

    check_step(
        AddColumnStepPerformer,
        2,
        'add_column'
    )

    check_step(
        DeleteColumnStepPerformer,
        3,
        'delete_column'
    )

    check_step(
        RenameColumnStepPerformer,
        2,
        'rename_column'
    )

    check_step(
        FilterStepPerformer,
        4,
        'filter_column'
    )
    
    check_step(
        PivotStepPerformer,
        8,
        'pivot'
    )

    check_step(
        MergeStepPerformer,
        4,
        'merge'
    )

    check_step(
        ReorderColumnStepPerformer,
        2,
        'reorder_column'
    )

    check_step(
        SetColumnFormulaStepPerformer,
        4,
        'set_column_formula'
    )

    check_step(
        SortStepPerformer,
        2,
        'sort'
    )


    check_step(
        ChangeColumnDtypeStepPerformer,
        3,
        'change_column_dtype'
    )

    check_step(
        SetDataframeFormatStepPerformer,
        2,
        'set_dataframe_format'
    )

    check_step(
        SimpleImportStepPerformer,
        2,
        'simple_import'
    )

    check_step(
        DataframeDeleteStepPerformer,
        1,
        'dataframe_delete'
    )

    check_step(
        DataframeDuplicateStepPerformer,
        1,
        'dataframe_duplicate'
    )

    check_step(
        DataframeRenameStepPerformer,
        1,
        'dataframe_rename'
    )

    check_step(
        SetCellValueStepPerformer,
        1,
        'set_cell_value'
    )

    check_step(
        BulkOldRenameStepPerformer,
        1,
        'bulk_old_rename'
    )

    check_step(
        ExcelImportStepPerformer,
        1,
        'excel_import'
    )

    check_step(
        DropDuplicatesStepPerformer,
        1,
        'drop_duplicates'
    )

    check_step(
        GraphStepPerformer,
        4,
        'graph'
    )

    check_step(
        GraphDeleteStepPerformer,
        1,
        'graph_delete'
    )

    check_step(
        GraphDuplicateStepPerformer,
        1,
        'graph_duplicate'
    )

    check_step(
        GraphRenameStepPerformer,
        1,
        'graph_rename'
    )

    check_step(
        ConcatStepPerformer,
        1,
        'concat'
    )

    check_step(
        FillNaStepPerformer,
        1,
        'fill_na'
    )

    check_step(
        DeleteRowStepPerformer,
        1,
        'delete_row'
    )

    check_step(
        PromoteRowToHeaderStepPerformer,
        1,
        'promote_row_to_header'
    )

    check_step(
        SplitTextToColumnsStepPerformer,
        1,
        'split_text_to_columns'
    )

    check_step(
        TransposeStepPerformer,
        1,
        'transpose'
    )

    check_step(
        MeltStepPerformer,
        1,
        'melt'
    )

    check_step(
        OneHotEncodingStepPerformer,
        1,
        'one_hot_encoding'
    )

    check_step(
        DataframeImportStepPerformer,
        1,
        'dataframe_import'
    )

    check_step(
        ResetIndexStepPerformer,
        1,
        'reset_index'
    )

    check_step(
        ExcelRangeImportStepPerformer,
        1,
        'excel_range_import'
    )

    check_step(
        ExportToFileStepPerformer,
        1,
        'export_to_file'
    )

    check_step(
        SnowflakeImportStepPerformer,
        1,
        'snowflake_import'
    )

    assert len(STEP_PERFORMERS) == 36