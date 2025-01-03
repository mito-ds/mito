import os
from datetime import datetime
from .utils import get_random_id

# Current field names
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
UJ_MITOSHEET_ENTERPRISE = 'mitosheet_enterprise'
UJ_EXPERIMENT = 'experiment'
UJ_RECEIVED_CHECKLISTS = 'received_checklists'
UJ_AI_PRIVACY_POLICY = 'ai_privacy_policy'
UJ_AI_MITO_API_NUM_USAGES = 'ai_mito_api_num_usages'
UJ_MITO_AI_FIRST_USAGE_DATE = 'mito_ai_first_usage_date'

MITO_CONFIG_KEY_HOME_FOLDER = 'MITO_CONFIG_HOME_FOLDER'
if MITO_CONFIG_KEY_HOME_FOLDER in os.environ:
    HOME_FOLDER = os.path.expanduser(os.environ[MITO_CONFIG_KEY_HOME_FOLDER])
else:
    HOME_FOLDER = os.path.expanduser('~')

# Where all global .mito files are stored
MITO_FOLDER = os.path.join(HOME_FOLDER, ".mito")

"""
The most up to date version of the user.json object
"""
USER_JSON_VERSION_10 = {
    # The new version of the user json object
    UJ_USER_JSON_VERSION: 10,
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
    UJ_MITOSHEET_CURRENT_VERSION: 0,
    UJ_MITOSHEET_LAST_UPGRADED_DATE: datetime.today().strftime('%Y-%m-%d'),
    UJ_MITOSHEET_LAST_FIFTY_USAGES: [datetime.today().strftime('%Y-%m-%d')],
    UJ_MITOSHEET_TELEMETRY: True,
    UJ_MITOSHEET_PRO: False,
    UJ_MITOSHEET_ENTERPRISE: False,
    UJ_EXPERIMENT: {
        'experiment_id': 'installer_communication_and_time_to_value',
        'variant': 'B',
    },
    UJ_RECEIVED_CHECKLISTS: {},
    UJ_AI_PRIVACY_POLICY: False,
    UJ_AI_MITO_API_NUM_USAGES: 0,
    UJ_MITO_AI_FIRST_USAGE_DATE: datetime.today().strftime('%Y-%m-%d'),
}

# This is the most up to date user json, and you must update it when
# you add a new schema
USER_JSON_DEFAULT = USER_JSON_VERSION_10