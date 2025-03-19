import os
from datetime import datetime
import pytest
from unittest.mock import patch, MagicMock, call

from mito_ai.models import MessageType
from mito_ai.utils.server_limits import (
    OS_MONTHLY_AI_COMPLETIONS_LIMIT,
    OS_MONTHLY_AUTOCOMPLETE_LIMIT,
    check_mito_server_quota,
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES,
    UJ_MITO_AI_LAST_RESET_DATE
)
from mito_ai.utils.telemetry_utils import MITO_SERVER_FREE_TIER_LIMIT_REACHED

# Constants for testing
CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")
OLD_DATE = "2020-01-01"
FUTURE_DATE = (datetime.now().replace(year=datetime.now().year + 1)).strftime("%Y-%m-%d")

# Each test case is a tuple of:
# (is_pro, chat_completion_count, autocomplete_count, last_reset_date, message_type, should_raise_error)

# 1. Open Source Subscription Tests
OS_SUBSCRIPTION_TESTS = [
    # Below both limits
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.CHAT, False),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
    
    # Above AI completions limit only
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.CHAT, True),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
    
    # Above autocomplete limit only
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1, CURRENT_DATE, MessageType.CHAT, False),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, True),
    
    # Above both limits
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1, CURRENT_DATE, MessageType.CHAT, True),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, True),
    
    # Equal to limits
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.CHAT, True),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT, CURRENT_DATE, MessageType.CHAT, False),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT, CURRENT_DATE, MessageType.INLINE_COMPLETION, True),
]

# 2. Pro Subscription Tests
PRO_SUBSCRIPTION_TESTS = [
    # Pro user below limits
    (True, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.CHAT, False),
    (True, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
    
    # Pro user above limits - should still not raise error
    (True, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 100, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 100, CURRENT_DATE, MessageType.CHAT, False),
    (True, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 100, OS_MONTHLY_AUTOCOMPLETE_LIMIT + 100, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
]

# 3. Error Handling Tests - Note: None values are replaced in the test function
ERROR_HANDLING_TESTS = [
    # Missing last reset date - should not raise error and set the date
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, None, MessageType.CHAT, False),
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT - 1, OS_MONTHLY_AUTOCOMPLETE_LIMIT - 1, None, MessageType.INLINE_COMPLETION, False),
]

# 4. Edge Cases
EDGE_CASE_TESTS = [
    # Negative counts - should be treated as below limit
    (False, -10, -10, CURRENT_DATE, MessageType.CHAT, False),
    (False, -10, -10, CURRENT_DATE, MessageType.INLINE_COMPLETION, False),
]

# Combine all tests
ALL_TEST_CASES = OS_SUBSCRIPTION_TESTS + PRO_SUBSCRIPTION_TESTS + ERROR_HANDLING_TESTS + EDGE_CASE_TESTS

@pytest.mark.parametrize(
    "is_pro, chat_completion_count, autocomplete_count, last_reset_date, message_type, should_raise_error",
    ALL_TEST_CASES
)
def test_check_mito_server_quota(is_pro, chat_completion_count, autocomplete_count, last_reset_date, message_type, should_raise_error):
    """Test the check_mito_server_quota function with various combinations of inputs."""
    
    # Create the patch context managers
    patches = [
        patch("mito_ai.utils.server_limits.is_pro", return_value=is_pro),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=chat_completion_count),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=autocomplete_count),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=last_reset_date),
    ]
    
    # Add set_user_field mock if needed for None values
    if last_reset_date is None:
        patches.append(patch("mito_ai.utils.server_limits.set_user_field"))
    
    # Apply all patches
    for p in patches:
        p.start()
    
    try:
        if should_raise_error:
            # Should raise PermissionError
            with pytest.raises(PermissionError) as exc_info:
                check_mito_server_quota(message_type)
            assert str(exc_info.value) == MITO_SERVER_FREE_TIER_LIMIT_REACHED
        else:
            # Should not raise any error
            check_mito_server_quota(message_type)
    finally:
        # Stop all patches
        for p in patches:
            p.stop()

# New dedicated test cases for date-related reset behavior
# Each test case is a tuple of:
# (reset_date, is_pro, message_type, should_reset)
DATE_RESET_TEST_CASES = [
    # Old date should trigger reset for both message types
    (OLD_DATE, False, MessageType.CHAT, True),
    (OLD_DATE, False, MessageType.INLINE_COMPLETION, True),
    
    # Pro user with old date should not trigger reset (they have no limits)
    (OLD_DATE, True, MessageType.CHAT, False),
    (OLD_DATE, True, MessageType.INLINE_COMPLETION, False),
    
    # Current date should not trigger reset
    (CURRENT_DATE, False, MessageType.CHAT, False),
    (CURRENT_DATE, False, MessageType.INLINE_COMPLETION, False),
    
    # Future date should not trigger reset
    (FUTURE_DATE, False, MessageType.CHAT, False),
    (FUTURE_DATE, False, MessageType.INLINE_COMPLETION, False),
]

@pytest.mark.parametrize(
    "reset_date, is_pro, message_type, should_reset",
    DATE_RESET_TEST_CASES
)
def test_date_triggers_reset(reset_date, is_pro, message_type, should_reset):
    """
    Test whether different dates trigger counter reset operations.
    Rather than checking downstream behavior, directly verify the reset operation occurs.
    """
    # Mock set_user_field to track calls
    mock_set_user_field = MagicMock()
    
    with (
        patch("mito_ai.utils.server_limits.is_pro", return_value=is_pro),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=reset_date),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=1),
        patch("mito_ai.utils.server_limits.set_user_field", mock_set_user_field)
    ):
        # Call the function
        check_mito_server_quota(message_type)
        
        # Verify whether reset was triggered based on expectations
        reset_calls = [
            call(UJ_AI_MITO_API_NUM_USAGES, 0),
            call(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
        ]
        
        if should_reset:
            # Check that the API usages and autocomplete usages were reset to 0
            # The format is slightly different because of how we're building the calls list
            for reset_call in reset_calls:
                assert reset_call in mock_set_user_field.call_args_list, f"Expected reset call {reset_call} not found"
            
            # Also verify that the reset date was updated
            assert any(call[0][0] == UJ_MITO_AI_LAST_RESET_DATE for call in mock_set_user_field.call_args_list), "Reset date was not updated"
        else:
            # For cases that shouldn't reset, verify the reset calls were NOT made
            # If we're setting a missing date (None), we'll still see calls, but they won't be resets
            if reset_date is not None:
                for reset_call in reset_calls:
                    assert reset_call not in mock_set_user_field.call_args_list, f"Unexpected reset call {reset_call} found"

# Special test cases that require specific patching of constants
def test_zero_limits_configured():
    """Test when limits are configured as zero."""
    with (
        patch("mito_ai.utils.server_limits.OS_MONTHLY_AI_COMPLETIONS_LIMIT", 0),
        patch("mito_ai.utils.server_limits.OS_MONTHLY_AUTOCOMPLETE_LIMIT", 0),
        patch("mito_ai.utils.server_limits.is_pro", return_value=False),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=1),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=CURRENT_DATE)
    ):
        # Test with chat completion - should raise error
        with pytest.raises(PermissionError) as exc_info:
            check_mito_server_quota(MessageType.CHAT)
        assert str(exc_info.value) == MITO_SERVER_FREE_TIER_LIMIT_REACHED
        
        # Test with inline completion - should raise error
        with pytest.raises(PermissionError) as exc_info:
            check_mito_server_quota(MessageType.INLINE_COMPLETION)
        assert str(exc_info.value) == MITO_SERVER_FREE_TIER_LIMIT_REACHED