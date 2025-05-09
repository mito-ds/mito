# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from datetime import datetime
from typing import Dict, Optional
import pytest
from unittest.mock import patch, MagicMock, call

from mito_ai.completions.models import MessageType
from mito_ai.utils.server_limits import (
    OS_MONTHLY_AI_COMPLETIONS_LIMIT,
    OS_MONTHLY_AUTOCOMPLETE_LIMIT,
    check_mito_server_quota,
    update_mito_server_quota,
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES,
    UJ_MITO_AI_LAST_RESET_DATE,
    UJ_MITO_AI_FIRST_USAGE_DATE
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
def test_check_mito_server_quota(
    is_pro: bool, 
    chat_completion_count: int,
    autocomplete_count: int,
    last_reset_date: Optional[str], 
    message_type: MessageType, 
    should_raise_error: bool
) -> None:
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
def test_date_triggers_reset(reset_date: Optional[str], is_pro: bool, message_type: MessageType, should_reset: bool) -> None:
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
def test_zero_limits_configured() -> None:
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

# New test cases for update_mito_server_quota function
# Each case is (first_usage_date, last_reset_date, current_completion_count, current_autocomplete_count, message_type, expected_operations)
# The expected_operations is a dict specifying what operations should happen: reset_counters, update_first_date, increment_chat, increment_autocomplete
UPDATE_QUOTA_TEST_CASES = [
    # Basic cases - incrementing counters
    (
        CURRENT_DATE, CURRENT_DATE, 10, 20, MessageType.CHAT, 
        {"reset_counters": False, "update_first_date": False, "increment_chat": True, "increment_autocomplete": False}
    ),
    (
        CURRENT_DATE, CURRENT_DATE, 10, 20, MessageType.INLINE_COMPLETION, 
        {"reset_counters": False, "update_first_date": False, "increment_chat": False, "increment_autocomplete": True}
    ),
    
    # First usage initialization
    (
        None, CURRENT_DATE, 10, 20, MessageType.CHAT, 
        {"reset_counters": False, "update_first_date": True, "increment_chat": True, "increment_autocomplete": False}
    ),
    
    # Reset date initialization
    (
        CURRENT_DATE, None, 10, 20, MessageType.CHAT, 
        {"reset_counters": False, "update_first_date": False, "increment_chat": True, "increment_autocomplete": False}
    ),
    
    # Both dates missing
    (
        None, None, 10, 20, MessageType.CHAT, 
        {"reset_counters": False, "update_first_date": True, "increment_chat": True, "increment_autocomplete": False}
    ),
    
    # Old reset date - should reset counters before updating
    (
        CURRENT_DATE, OLD_DATE, 10, 20, MessageType.CHAT, 
        {"reset_counters": True, "update_first_date": False, "increment_chat": True, "increment_autocomplete": False}
    ),
    (
        CURRENT_DATE, OLD_DATE, 10, 20, MessageType.INLINE_COMPLETION, 
        {"reset_counters": True, "update_first_date": False, "increment_chat": False, "increment_autocomplete": True}
    ),
    
    # None counts - should be handled as 0
    (
        CURRENT_DATE, CURRENT_DATE, None, 20, MessageType.CHAT, 
        {"reset_counters": False, "update_first_date": False, "increment_chat": True, "increment_autocomplete": False}
    ),
    (
        CURRENT_DATE, CURRENT_DATE, 10, None, MessageType.INLINE_COMPLETION, 
        {"reset_counters": False, "update_first_date": False, "increment_chat": False, "increment_autocomplete": True}
    ),
]

@pytest.mark.parametrize(
    "first_usage_date, last_reset_date, completion_count, autocomplete_count, message_type, expected_ops",
    UPDATE_QUOTA_TEST_CASES
)
def test_update_mito_server_quota(
    first_usage_date: Optional[str], 
    last_reset_date: Optional[str], 
    completion_count: int, 
    autocomplete_count: int, 
    message_type: MessageType, 
    expected_ops: Dict[str, bool]
) -> None:
    """Test the update_mito_server_quota function with various input combinations."""
    # Mock set_user_field to track calls
    mock_set_user_field = MagicMock()
    
    with (
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=first_usage_date),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=last_reset_date),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=completion_count),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=autocomplete_count),
        patch("mito_ai.utils.server_limits.set_user_field", mock_set_user_field)
    ):
        # Call the function
        update_mito_server_quota(message_type)
        
        # Check initialization of first usage date
        if first_usage_date is None or expected_ops["update_first_date"]:
            assert any(call[0][0] == UJ_MITO_AI_FIRST_USAGE_DATE for call in mock_set_user_field.call_args_list), \
                "First usage date should have been initialized"
        
        # Check initialization of reset date
        if last_reset_date is None:
            assert any(call[0][0] == UJ_MITO_AI_LAST_RESET_DATE for call in mock_set_user_field.call_args_list), \
                "Reset date should have been initialized"
        
        # Check counter reset operations
        if expected_ops["reset_counters"]:
            reset_calls = [
                call(UJ_AI_MITO_API_NUM_USAGES, 0),
                call(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
            ]
            for reset_call in reset_calls:
                assert reset_call in mock_set_user_field.call_args_list, \
                    f"Expected reset call {reset_call} not found"
            
            # Reset date should also be updated
            assert any(call[0][0] == UJ_MITO_AI_LAST_RESET_DATE for call in mock_set_user_field.call_args_list), \
                "Reset date should have been updated"
        
        # Check counter increment operations
        if expected_ops["increment_chat"]:
            expected_count = 1 if completion_count is None else completion_count + 1
            chat_call = call(UJ_AI_MITO_API_NUM_USAGES, expected_count)
            assert chat_call in mock_set_user_field.call_args_list, \
                f"Expected chat completion increment call {chat_call} not found"
        
        if expected_ops["increment_autocomplete"]:
            expected_count = 1 if autocomplete_count is None else autocomplete_count + 1
            autocomplete_call = call(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, expected_count)
            assert autocomplete_call in mock_set_user_field.call_args_list, \
                f"Expected autocomplete increment call {autocomplete_call} not found"

# Special edge cases for update_mito_server_quota
def test_update_quota_exception_handling() -> None:
    """Test that exceptions from set_user_field are properly propagated."""
    
    with (
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=CURRENT_DATE),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=CURRENT_DATE),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=10),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=20),
        patch("mito_ai.utils.server_limits.set_user_field", side_effect=ValueError("Test error"))
    ):
        # Test with chat completion
        with pytest.raises(ValueError) as exc_info:
            update_mito_server_quota(MessageType.CHAT)
        assert str(exc_info.value) == "Test error"
        
        # Test with inline completion
        with pytest.raises(ValueError) as exc_info:
            update_mito_server_quota(MessageType.INLINE_COMPLETION)
        assert str(exc_info.value) == "Test error"

def test_update_quota_future_reset_date() -> None:
    """Test behavior when reset date is in the future."""
    
    mock_set_user_field = MagicMock()
    
    with (
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=CURRENT_DATE),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=FUTURE_DATE),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=10),
        patch("mito_ai.utils.server_limits.set_user_field", mock_set_user_field)
    ):
        # Call the function
        update_mito_server_quota(MessageType.CHAT)
        
        # Check that counters weren't reset
        reset_calls = [
            call(UJ_AI_MITO_API_NUM_USAGES, 0),
            call(UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES, 0)
        ]
        for reset_call in reset_calls:
            assert reset_call not in mock_set_user_field.call_args_list, \
                "Counters should not be reset when reset date is in the future"
        
        # Chat count should still be incremented
        chat_call = call(UJ_AI_MITO_API_NUM_USAGES, 11)
        assert chat_call in mock_set_user_field.call_args_list, \
            "Chat completion count should still be incremented"

def test_update_quota_chat_name_generation() -> None:
    """
    Test that when message_type is MessageType.CHAT_NAME_GENERATION, 
    neither UJ_AI_MITO_API_NUM_USAGES nor UJ_AI_MITO_AUTOCOMPLETE_NUM_USAGES is incremented.
    """
    
    # Mock set_user_field to track calls
    mock_set_user_field = MagicMock()
    
    with (
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=CURRENT_DATE),
        patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=CURRENT_DATE),
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=10),
        patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=20),
        patch("mito_ai.utils.server_limits.set_user_field", mock_set_user_field)
    ):
        # Call the function with CHAT_NAME_GENERATION message type
        update_mito_server_quota(MessageType.CHAT_NAME_GENERATION)
        
        # Verify that set_user_field was not called at all - no counters should be updated
        mock_set_user_field.assert_not_called()
        
        # For comparison, call with a normal message type
        update_mito_server_quota(MessageType.CHAT)
        
        # Now verify set_user_field was called to increment the chat counter
        chat_call = call(UJ_AI_MITO_API_NUM_USAGES, 11)
        assert chat_call in mock_set_user_field.call_args_list, \
            "Chat completion count should be incremented for regular chat messages"