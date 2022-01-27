#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains the exports for update events, which are events that manipulate
the steps in some way, but do not _just generate a step_ (see ../steps for
more information about steps).

Examples of this sort of event are:
- Lots of steps being replayed from the front-end.
- A user undoing an existing step. 
"""

from mitosheet.updates.undo import UNDO_UPDATE
from mitosheet.updates.redo import REDO_UPDATE
from mitosheet.updates.clear import CLEAR_UPDATE
from mitosheet.updates.args_update import ARGS_UPDATE
from mitosheet.updates.save_analysis import SAVE_ANALYSIS_UPDATE
from mitosheet.updates.replay_analysis import REPLAY_ANALYSIS_UPDATE
from mitosheet.updates.set_user_field_update import SET_USER_FIELD_UPDATE
from mitosheet.updates.checkout_step_by_idx import CHECKOUT_STEP_BY_IDX_UPDATE
from mitosheet.updates.append_user_field import APPEND_USER_FIELD_UPDATE
from mitosheet.updates.update_feedback_v2_object import UPDATE_FEEDBACK_V2_OBJECT_UPDATE
from mitosheet.updates.go_pro import GO_PRO_UPDATE


# All update events must be listed in this variable.
UPDATES = [
    UNDO_UPDATE,
    REDO_UPDATE,
    CLEAR_UPDATE,
    ARGS_UPDATE,
    SAVE_ANALYSIS_UPDATE,
    REPLAY_ANALYSIS_UPDATE,
    CHECKOUT_STEP_BY_IDX_UPDATE,
    APPEND_USER_FIELD_UPDATE,
    SET_USER_FIELD_UPDATE,
    CHECKOUT_STEP_BY_IDX_UPDATE,
    UPDATE_FEEDBACK_V2_OBJECT_UPDATE,
    GO_PRO_UPDATE
]