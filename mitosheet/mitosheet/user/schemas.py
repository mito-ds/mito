#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Schemas for the user.json file. As we evolve the format overtime,
we should include them here, so that we can track what upgrades
are required / necessary.

NOTE: USER_JSON_DEFAULT is the default user.json object for the currrent
version always.
"""

from datetime import datetime
from mitosheet.experiments.experiment_utils import get_new_experiment
from mitosheet.utils import get_random_id
from mitosheet._version import __version__

# Some helpful constants
GITHUB_ACTION_ID = 'github_action'
GITHUB_ACTION_EMAIL = 'github@action.com'

# Old field names
UJ_INTENDED_BEHAVIOR = 'intended_behavior'
UJ_CLOSED_FEEDBACK = 'closed_feedback'
UJ_MITOSHEET_LAST_FIVE_USAGES = 'mitosheet_last_five_usages'

# Current field names
UJ_USER_JSON_VERSION = 'user_json_version'
UJ_STATIC_USER_ID = 'static_user_id'
UJ_USER_SALT = 'user_salt'
UJ_USER_EMAIL = 'user_email'
UJ_RECEIVED_TOURS = 'received_tours'
UJ_FEEDBACKS = 'feedbacks'
UJ_FEEDBACKS_V2 = 'feedbacks_v2'
UJ_MITOSHEET_CURRENT_VERSION = 'mitosheet_current_version'
UJ_MITOSHEET_LAST_UPGRADED_DATE = 'mitosheet_last_upgraded_date'
UJ_MITOSHEET_LAST_FIFTY_USAGES = 'mitosheet_last_fifty_usages'
UJ_MITOSHEET_TELEMETRY = 'mitosheet_telemetry'
UJ_MITOSHEET_PRO = 'mitosheet_pro'
UJ_EXPERIMENT = 'experiment'
UJ_RECEIVED_CHECKLISTS = 'received_checklists'


# This was the final version of the user.json with user_json_version == 1
# and since we added fields to it over time, we make sure that all users 
# upgrading from version 1 actually get all the fields they need before 
# being upgraded
# NOTE: tests ensure we cannot change this object
USER_JSON_VERSION_1 = {
    UJ_USER_JSON_VERSION: 1,
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    UJ_USER_EMAIL: '',
    # A list of actions the user intends to do on the tool, which they fill
    # out when they sign up
    UJ_INTENDED_BEHAVIOR: [],
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    # If the user opted out of feedback, we store that they opted out, so
    # that we don't bombard them with feedback
    UJ_CLOSED_FEEDBACK: False,
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIVE_USAGES: [datetime.today().strftime('%Y-%m-%d')]
}

USER_JSON_VERSION_2 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 2,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')]
}

USER_JSON_VERSION_3 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 3,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True
}

"""
The only difference between version 3 and 4 is the addition of the UJ_FEEDBACKS_V2. 
We moved to this format because we wanted to insist on more structure to our feedback, 
allowing us to more intelligently extract information from the feedback object if we need to. 

It has the format:
{
	"pivot_edit_usage_triggered": [
		{
			"date": "2021-11-16",
			"num_usages": 1
			"questions_and_answers": [
				{
					"question": "how successful was that pivot table?",
					"answer":  5
				},
				{
					"question": "what was your experience like",
					"answer":  "It was difficult because ...", 
				}
			]
		},
		{
			"date": "2021-11-17",
			"num_usages": 2
			"questions_and_answers": [
				{
					"question": "how successful was that pivot table?",
					"answer":  5
				},
				{
					"question": "what was your experience like",
					"answer":  "It was difficult because ...", 
				}
			]
		}
	],
	"other_feedback_id": [
		...
	]
}
"""
USER_JSON_VERSION_4 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 4,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_FEEDBACKS_V2: {},
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True
}

"""
Adds UJ_MITOSHEET_PRO, and sets to equal to False. The upgrade step
sets it to False only if the field is not already there.
"""
USER_JSON_VERSION_5 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 5,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_FEEDBACKS_V2: {},
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True,
    UJ_MITOSHEET_PRO: False
}

"""
Adds UJ_EXPERIMENTS, and sets it equal to an empty list. This is a list of experiments
that the user has been assigned to. It has the format [{'experiment_id': '<ID>', 'variant': '<VARIANT>'}]
"""
USER_JSON_VERSION_6 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 6,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_FEEDBACKS_V2: {},
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True,
    UJ_MITOSHEET_PRO: False,
    UJ_EXPERIMENT: get_new_experiment()
}

"""
Adds UJ_RECEIVED_CHECKLISTS, which is a list of checklists that the user has received,
and the steps for each checklist they have been through, with the format:
{"onboarding_checklist": ['signup', 'import', 'filter', 'pivot', 'graph']}
"""
USER_JSON_VERSION_7 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 7,
    # The static id of the user
    UJ_STATIC_USER_ID: get_random_id(),
    # A random secret that the user can use as salt when hashing things
    UJ_USER_SALT: get_random_id(),
    # Email of the user
    UJ_USER_EMAIL: '',
    # Tours that the user has received
    UJ_RECEIVED_TOURS: [],
    # A list of all the feedback the user has given
    UJ_FEEDBACKS: [],
    UJ_FEEDBACKS_V2: {},
    UJ_MITOSHEET_CURRENT_VERSION: __version__,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True,
    UJ_MITOSHEET_PRO: False,
    UJ_EXPERIMENT: get_new_experiment(),
    UJ_RECEIVED_CHECKLISTS: {}
}


# This is the most up to date user json, and you must update it when
# you add a new schema
USER_JSON_DEFAULT = USER_JSON_VERSION_7