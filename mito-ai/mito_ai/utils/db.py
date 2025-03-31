# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Helpers for accessing the user.json file
"""
import os
import json
from typing import Any, Optional, Final
from mito_ai.utils.schema import (
    MITO_FOLDER, 
    UJ_AI_MITO_API_NUM_USAGES, 
    UJ_MITO_AI_FIRST_USAGE_DATE, 
    UJ_MITO_AI_LAST_RESET_DATE,
    UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES
)

# The path of the user.json file
USER_JSON_PATH: Final[str] = os.path.join(MITO_FOLDER, 'user.json')


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
    Updates the value of a specific field in user.json
    """
    with open(USER_JSON_PATH, 'r') as user_file_old:
        old_user_json = json.load(user_file_old)
        old_user_json[field] = value
        with open(USER_JSON_PATH, 'w+') as f:
            f.write(json.dumps(old_user_json))
            
def get_chat_completion_count() -> int:
    """
    Returns the number of AI completions the user has made in the current 30-day period.
    
    Using this helper function lets us mock the number of completions in tests.
    """
    return get_user_field(UJ_AI_MITO_API_NUM_USAGES) or 0

def get_autocomplete_count() -> int:
    """
    Returns the number of autocomplete completions the user has made in the current 30-day period.
    
    Using this helper function lets us mock the number of autocomplete completions in tests.
    """
    return get_user_field(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES) or 0

def get_first_completion_date() -> Optional[str]:
    """
    Returns the date of the user's last completion in YYYY-MM-DD format.
    
    Using this helper function lets us mock the date of the first completion in tests.
    """
    return get_user_field(UJ_MITO_AI_FIRST_USAGE_DATE) or None

def get_last_reset_date() -> Optional[str]:
    """
    Returns the date of the user's last reset in YYYY-MM-DD format.
    Both chat completions and autocomplete share the same reset date.
    
    Using this helper function lets us mock the date of the last reset in tests.
    """
    return get_user_field(UJ_MITO_AI_LAST_RESET_DATE) or None