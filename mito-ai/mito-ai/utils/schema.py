import os

# Current field names
UJ_USER_EMAIL = 'user_email'
UJ_STATIC_USER_ID = 'static_user_id'
UJ_MITOSHEET_PRO = 'mitosheet_pro'
UJ_MITOSHEET_ENTERPRISE = 'mitosheet_enterprise'
UJ_AI_MITO_API_NUM_USAGES = 'ai_mito_api_num_usages'

MITO_CONFIG_KEY_HOME_FOLDER = 'MITO_CONFIG_HOME_FOLDER'
if MITO_CONFIG_KEY_HOME_FOLDER in os.environ:
    HOME_FOLDER = os.path.expanduser(os.environ[MITO_CONFIG_KEY_HOME_FOLDER])
else:
    HOME_FOLDER = os.path.expanduser('~')

# Where all global .mito files are stored
MITO_FOLDER = os.path.join(HOME_FOLDER, ".mito")