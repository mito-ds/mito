# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Final
from mito_ai.utils.db import (
    get_chat_completion_count, 
    get_autocomplete_count,
    get_first_completion_date, 
    get_last_reset_date,
    get_user_field, 
    set_user_field
)
from mito_ai.utils.schema import (
    UJ_MITO_AI_FIRST_USAGE_DATE, 
    UJ_AI_MITO_API_NUM_USAGES, 
    UJ_MITO_AI_LAST_RESET_DATE,
    UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES
)
from mito_ai.utils.telemetry_utils import (MITO_SERVER_FREE_TIER_LIMIT_REACHED, log)
from mito_ai.utils.version_utils import is_pro
from mito_ai.completions.models import MessageType
from datetime import datetime, timedelta

"""
IT IS EXPRESSLY AGAINST THE SOFTWARE LICENSE TO MODIFY, BYPASS, OR OTHERWISE
CIRCUMVENT THE QUOTA LIMITS OF THE FREE TIER. We want to provide users with a 
free tier, but running AI models is expensive, so we need to limit the usage 
or we will no longer be able to provide this free tier.
"""
# Monthly chat completions limit for free tier users
OS_MONTHLY_AI_COMPLETIONS_LIMIT: Final[int] = 50

# Monthly autocomplete limit for free tier users
OS_MONTHLY_AUTOCOMPLETE_LIMIT: Final[int] = 5000

def check_mito_server_quota(message_type: MessageType) -> None:
    """
    Checks if the user has exceeded their Mito server quota. Pro users have no limits.
    Raises PermissionError if the user has exceeded their quota.
    
    IT IS EXPRESSLY AGAINST THE SOFTWARE LICENSE TO MODIFY, BYPASS, OR OTHERWISE
    CIRCUMVENT THE QUOTA LIMITS OF THE FREE TIER. We want to provide users with a 
    free tier, but running AI models is expensive, so we need to limit the usage 
    or we will no longer be able to provide this free tier.
    """
    if is_pro():
        return

    # Get current date
    current_date = datetime.now()
    
    # Get the date when the last reset occurred
    last_reset_date_str = get_last_reset_date()
        
    # If no last reset date is found, set it to today and reset both counters
    if last_reset_date_str is None:
        set_user_field(UJ_MITO_AI_LAST_RESET_DATE, current_date.strftime("%Y-%m-%d"))
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, 0)
        set_user_field(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
        return
    
    # Convert the last reset date string to a datetime object
    last_reset_date = datetime.strptime(last_reset_date_str, "%Y-%m-%d")
    
    # Calculate the date one month from the last reset
    one_month_later = last_reset_date + timedelta(days=30)  # Approximating a month as 30 days
    
    # If it's been more than a month since the last reset, reset both counters
    if current_date >= one_month_later:
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, 0)
        set_user_field(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
        set_user_field(UJ_MITO_AI_LAST_RESET_DATE, current_date.strftime("%Y-%m-%d"))
        
    # Check the appropriate limit based on message type
    if message_type == MessageType.INLINE_COMPLETION:
        # Check autocomplete limit
        autocomplete_count = get_autocomplete_count()
        
        if autocomplete_count >= OS_MONTHLY_AUTOCOMPLETE_LIMIT:
            log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
            raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
    else:
        # Check chat completion limit
        completion_count = get_chat_completion_count()
        
        if completion_count >= OS_MONTHLY_AI_COMPLETIONS_LIMIT:
            log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
            raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
        

def update_mito_server_quota(message_type: MessageType) -> None:
    """
    Update the user's quota for the Mito Server.
    
    IT IS EXPRESSLY AGAINST THE SOFTWARE LICENSE TO MODIFY, BYPASS, OR OTHERWISE
    CIRCUMVENT THE QUOTA LIMITS OF THE FREE TIER. We want to provide users with a 
    free tier, but running AI models is expensive, so we need to limit the usage 
    or we will no longer be able to provide this free tier.
    """
    
    if message_type == MessageType.CHAT_NAME_GENERATION:
        # We do not count the Chat Name Generation message type towards the quota
        return
    
    current_date = datetime.now()
    first_usage_date = get_first_completion_date()
    last_reset_date_str = get_last_reset_date()
    
    if first_usage_date is None:
        first_usage_date = current_date.strftime("%Y-%m-%d")
        set_user_field(UJ_MITO_AI_FIRST_USAGE_DATE, first_usage_date)
    
    # Initialize the reset date if it doesn't exist
    if last_reset_date_str is None:
        last_reset_date_str = current_date.strftime("%Y-%m-%d")
        set_user_field(UJ_MITO_AI_LAST_RESET_DATE, last_reset_date_str)
        
    # Convert the last reset date string to a datetime object
    last_reset_date = datetime.strptime(last_reset_date_str, "%Y-%m-%d")
    
    # Calculate the date one month from the last reset
    one_month_later = last_reset_date + timedelta(days=30)
    
    # If it's been more than a month since the last reset, reset both counters
    # and make today's date the new reset date
    if current_date >= one_month_later:
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, 0)
        set_user_field(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
        last_reset_date_str = current_date.strftime("%Y-%m-%d")
        set_user_field(UJ_MITO_AI_LAST_RESET_DATE, last_reset_date_str)
    
    # Update the appropriate usage counter based on message type
    if message_type == MessageType.INLINE_COMPLETION:
        # Increment autocomplete count
        autocomplete_count = get_autocomplete_count()
        autocomplete_count = 1 if autocomplete_count is None else autocomplete_count + 1
        
        try:
            set_user_field(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, autocomplete_count)
        except Exception as e:
            raise e
    else:
        # Increment chat completion count
        completion_count = get_chat_completion_count()
        completion_count = 1 if completion_count is None else completion_count + 1
        
        try:
            set_user_field(UJ_AI_MITO_API_NUM_USAGES, completion_count)
            set_user_field(UJ_MITO_AI_FIRST_USAGE_DATE, first_usage_date)
        except Exception as e:
            raise e
        