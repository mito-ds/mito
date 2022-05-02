#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from datetime import datetime
from typing import Any, Dict

from mitosheet.telemetry.telemetry_utils import identify
from mitosheet.types import StepsManagerType
from mitosheet.user import get_user_field, set_user_field
from mitosheet.user.schemas import UJ_FEEDBACKS_V2
    

UPDATE_FEEDBACK_V2_OBJECT_EVENT = 'update_feedback_v2_obj_update'
UPDATE_FEEDBACK_V2_OBJECT_EVENT_PARAMS = ['feedback_id', 'num_usages', 'questions_and_answers']

def execute_add_feedback_update(steps_manager: StepsManagerType, feedback_id: str, num_usages: int, questions_and_answers: Dict[str, Any]) -> None:
    """
    The function responsible for adding the feedback to the feedback_v2 object
    in the user.json. 
    """

    user_feedback_obj = get_user_field(UJ_FEEDBACKS_V2)
    if user_feedback_obj is None: 
        user_feedback_obj = {}

    if feedback_id not in user_feedback_obj:
        user_feedback_obj[feedback_id] = []

    # Create the feedback object for the feedback we're adding
    # to the user.json
    new_feedback_obj = {
        'date': datetime.today().strftime('%Y-%m-%d'),
        'num_usages': num_usages,
        'questions_and_answers': questions_and_answers
    }
    
    # Add the new feedback to the feedback_obj
    user_feedback_obj[feedback_id].append(new_feedback_obj)
    
    # Set the field to the new list
    set_user_field(UJ_FEEDBACKS_V2, user_feedback_obj)

    # Identify just in case
    identify()


UPDATE_FEEDBACK_V2_OBJECT_UPDATE = {
    'event_type': UPDATE_FEEDBACK_V2_OBJECT_EVENT,
    'params': UPDATE_FEEDBACK_V2_OBJECT_EVENT_PARAMS,
    'execute': execute_add_feedback_update
}
