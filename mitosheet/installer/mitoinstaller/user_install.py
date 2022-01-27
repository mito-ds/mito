import json
import os
import uuid
from copy import deepcopy

from mitoinstaller import __version__

# Where all global .mito files are stored
MITO_FOLDER = os.path.join(os.path.expanduser("~"), '.mito')

# The path of the user.json file, which notably is the same
# path as the USER_JSON_PATH in mitosheet
USER_JSON_PATH = os.path.join(MITO_FOLDER, 'user.json')

def get_random_id():
    """
    Creates a new random ID for the user, which for any given user,
    should only happen once.
    """
    return str(uuid.uuid1())

def is_running_test():
    """
    A helper function that quickly returns if the current code is running inside 
    of a test, which is useful for making sure we don't generate tons of logs 
    """
    running_pytests = "PYTEST_CURRENT_TEST" in os.environ
    running_ci = 'CI' in os.environ and os.environ['CI'] is not None

    return running_pytests or running_ci


# NOTE: the installer only creates the static id for the user, and
# otherwise does nothing with the user_json file. This makes sure
# we keep the dependencies as simple as possible with this file. 
# We also add the telemetry, which we turn off if the user has a 
# pro subscription
USER_JSON_DEFAULT = {
    'static_user_id': get_random_id() if not is_running_test() else 'github_action',
    'mitosheet_telemetry': True,
    'mitosheet_pro': False,
}

def try_create_user_json_file(is_pro=False):
    # Create the mito folder if it does not exist
    if not os.path.exists(MITO_FOLDER):
        os.mkdir(MITO_FOLDER)
        
    # We only create a user.json file if it does not exist
    if not os.path.exists(USER_JSON_PATH):
        with open(USER_JSON_PATH, 'w+') as f:
            # And write the default object
            default_user_json = deepcopy(USER_JSON_DEFAULT)
            default_user_json['mitosheet_telemetry'] = not is_pro
            default_user_json['mitosheet_pro'] = is_pro

            f.write(json.dumps(default_user_json))
    else:
        # Otherwise, we make sure to update the mitosheet_telemetry variable 
        with open(USER_JSON_PATH, 'r') as f:
            updated_user_json = json.loads(f.read())
            updated_user_json['mitosheet_telemetry'] = not is_pro
            updated_user_json['mitosheet_pro'] = is_pro      
        with open(USER_JSON_PATH, 'w') as f:
            f.write(json.dumps(updated_user_json))


def get_static_user_id():
    try:
        with open(USER_JSON_PATH) as f:
            return json.load(f)['static_user_id']
    except: 
        return None

def get_mitosheet_telemetry():
    try:
        with open(USER_JSON_PATH) as f:
            return json.load(f)['mitosheet_telemetry']
    except: 
        return True

def user_json_only_has_static_user_id():
    """
    Returns True if the user.json file only has the static_user_id in it
    and otherwise returns False
    """
    try:
        with open(USER_JSON_PATH) as f:
            user_json_object = json.load(f)
            return len(user_json_object) == 1 and 'static_user_id' in user_json_object
    except:
        return False
