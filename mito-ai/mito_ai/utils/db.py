"""
Helpers for accessing the user.json file
"""
import os
import json
from typing import Any, Dict, Optional
from .schema import MITO_FOLDER

# The path of the user.json file
USER_JSON_PATH = os.path.join(MITO_FOLDER, 'user.json')

def get_user_field(field: str) -> Optional[Any]:
    """
    Returns the value stored at field in the user.json file,
    but may read a different file if it passed
    """
    try:
        with open(USER_JSON_PATH) as f:
            return json.load(f)[field]
    except: 
        return None
    
def set_user_field(field: str, value: Any) -> None:
    """
    Updates the value of a specific feild in user.json
    """
    with open(USER_JSON_PATH, 'r') as user_file_old:
        old_user_json = json.load(user_file_old)
        old_user_json[field] = value
        with open(USER_JSON_PATH, 'w+') as f:
            f.write(json.dumps(old_user_json))