#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
See mito/mitosheet/steps/README.md for more information about 
how to add a step!
"""

from typing import Dict, List, Type
from mitosheet.step_performers.concat import ConcatStepPerformer
from mitosheet.step_performers.drop_duplicates import DropDuplicatesStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.pivot import PivotStepPerformer
from mitosheet.step_performers.filter import FilterStepPerformer
from mitosheet.step_performers.sort import SortStepPerformer
from mitosheet.step_performers.set_cell_value import SetCellValueStepPerformer
from mitosheet.step_performers.column_steps.reorder_column import ReorderColumnStepPerformer
from mitosheet.step_performers.column_steps.add_column import AddColumnStepPerformer
from mitosheet.step_performers.column_steps.set_column_formula import SetColumnFormulaStepPerformer
from mitosheet.step_performers.merge import MergeStepPerformer
from mitosheet.step_performers.column_steps.delete_column import DeleteColumnStepPerformer
from mitosheet.step_performers.column_steps.rename_column import RenameColumnStepPerformer
from mitosheet.step_performers.column_steps.change_column_dtype import ChangeColumnDtypeStepPerformer
from mitosheet.step_performers.column_steps.change_column_format import ChangeColumnFormatStepPerformer
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.step_performers.dataframe_steps.dataframe_delete import DataframeDeleteStepPerformer
from mitosheet.step_performers.dataframe_steps.dataframe_duplicate import DataframeDuplicateStepPerformer
from mitosheet.step_performers.dataframe_steps.dataframe_rename import DataframeRenameStepPerformer
from mitosheet.step_performers.bulk_old_rename.bulk_old_rename import BulkOldRenameStepPerformer
from mitosheet.step_performers.graph_steps.graph import GraphStepPerformer
from mitosheet.step_performers.graph_steps.graph_delete import GraphDeleteStepPerformer
from mitosheet.step_performers.graph_steps.graph_duplicate import GraphDuplicateStepPerformer
from mitosheet.step_performers.graph_steps.graph_rename import GraphRenameStepPerformer


# All steps must be listed in this variable. Note the Type annotation allows for
# subtypes of the step performer to be passed
STEP_PERFORMERS: List[Type[StepPerformer]] = [
    PivotStepPerformer,
    ReorderColumnStepPerformer,
    FilterStepPerformer,
    SortStepPerformer,
    SetCellValueStepPerformer,
    AddColumnStepPerformer,
    SetColumnFormulaStepPerformer,
    ChangeColumnDtypeStepPerformer,
    ChangeColumnFormatStepPerformer,
    MergeStepPerformer,
    ConcatStepPerformer,
    DeleteColumnStepPerformer,
    RenameColumnStepPerformer,
    SimpleImportStepPerformer,
    ExcelImportStepPerformer,
    DataframeDeleteStepPerformer,
    DataframeDuplicateStepPerformer,
    DataframeRenameStepPerformer,
    BulkOldRenameStepPerformer,
    DropDuplicatesStepPerformer,
    GraphStepPerformer,
    GraphDeleteStepPerformer,
    GraphDuplicateStepPerformer,
    GraphRenameStepPerformer
]

# A helpful mapping for looking up steps based on the incoming events
EVENT_TYPE_TO_STEP_PERFORMER: Dict[str, Type[StepPerformer]] = {
    step_performer.step_event_type(): step_performer
    for step_performer in STEP_PERFORMERS
}

# We also build a useful lookup mapping for the step type to step object
STEP_TYPE_TO_STEP_PERFORMER: Dict[str, Type[StepPerformer]] = {
    step_performer.step_type(): step_performer
    for step_performer in STEP_PERFORMERS
}

# A dictionary mapping step performers to their usage triggered feedback id
STEP_TYPE_TO_USAGE_TRIGGERED_FEEDBACK_ID: Dict[str, str] = {
    step_performer.step_type(): step_performer.step_type() + '_usage_triggered'
    for step_performer in STEP_PERFORMERS
}
del STEP_TYPE_TO_USAGE_TRIGGERED_FEEDBACK_ID[BulkOldRenameStepPerformer.step_type()]
