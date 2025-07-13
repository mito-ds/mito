# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from datetime import datetime
from unittest.mock import patch
from mito_ai.utils.server_limits import (
    check_mito_server_quota,
    OS_MONTHLY_AI_COMPLETIONS_LIMIT,
    OS_MONTHLY_AUTOCOMPLETE_LIMIT,
)
from mito_ai.completions.models import MessageType
from mito_ai.utils.open_ai_utils import _prepare_request_data_and_headers

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")


def test_check_mito_server_quota_open_source_user() -> None:
    # Under chat completions limit
    with patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1) as mock_count, \
         patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=TODAY) as mock_date, \
         patch("mito_ai.utils.server_limits.is_pro", return_value=False):
        
        check_mito_server_quota(MessageType.CHAT)
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == 1
        assert mock_date.return_value == TODAY

    # Under autocomplete limit
    with patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=1) as mock_count, \
         patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=TODAY) as mock_date, \
         patch("mito_ai.utils.server_limits.is_pro", return_value=False):
        
        check_mito_server_quota(MessageType.INLINE_COMPLETION)
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == 1
        assert mock_date.return_value == TODAY

    # Over chat completions limit
    with pytest.raises(PermissionError), \
         patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1) as mock_count, \
         patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=TODAY) as mock_date, \
         patch("mito_ai.utils.server_limits.is_pro", return_value=False):
        
        check_mito_server_quota(MessageType.CHAT)
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1
        assert mock_date.return_value == TODAY

    # Over autocomplete limit
    with pytest.raises(PermissionError), \
         patch("mito_ai.utils.server_limits.get_autocomplete_count", return_value=OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1) as mock_count, \
         patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=TODAY) as mock_date, \
         patch("mito_ai.utils.server_limits.is_pro", return_value=False):
        
        check_mito_server_quota(MessageType.INLINE_COMPLETION)
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == OS_MONTHLY_AUTOCOMPLETE_LIMIT + 1
        assert mock_date.return_value == TODAY


def test_check_mito_server_quota_pro_user() -> None:
    # No error should be thrown since pro users don't have limits
    with patch("mito_ai.utils.server_limits.is_pro", return_value=True), \
         patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1000), \
         patch("mito_ai.utils.server_limits.get_last_reset_date", return_value=REALLY_OLD_DATE):
        
        check_mito_server_quota(MessageType.CHAT)

def test_prepare_request_data_and_headers_basic() -> None:
    """Test basic functionality of _prepare_request_data_and_headers"""

    # Mock the user fields
    with patch("mito_ai.utils.open_ai_utils.get_user_field") as mock_get_user_field:
        mock_get_user_field.side_effect = ["test@example.com", "user123"]
        
        # Mock the quota check
        data, headers = _prepare_request_data_and_headers(
            last_message_content="test message",
            ai_completion_data={"key": "value"},
            timeout=30,
            max_retries=3,
            message_type=MessageType.CHAT
        )

        # Verify data structure
        assert data["timeout"] == 30
        assert data["max_retries"] == 3
        assert data["email"] == "test@example.com"
        assert data["user_id"] == "user123"
        assert data["data"] == {"key": "value"}
        assert data["user_input"] == "test message"

        # Verify headers
        assert headers == {"Content-Type": "application/json"}

def test_prepare_request_data_and_headers_null_message() -> None:
    """Test handling of null message content"""
    with patch("mito_ai.utils.open_ai_utils.get_user_field") as mock_get_user_field:
        mock_get_user_field.side_effect = ["test@example.com", "user123"]
        
        with patch("mito_ai.utils.open_ai_utils.check_mito_server_quota"):
            data, _ = _prepare_request_data_and_headers(
                last_message_content=None,
                ai_completion_data={},
                timeout=30,
                max_retries=3,
                message_type=MessageType.CHAT
            )

            # Verify empty string is used for null message
            assert data["user_input"] == ""

def test_prepare_request_data_and_headers_caches_user_info() -> None:
    """Test that user info is cached after first call"""
    # Mock both the global variables and the get_user_field function
    with patch("mito_ai.utils.open_ai_utils.__user_email", None), \
         patch("mito_ai.utils.open_ai_utils.__user_id", None), \
         patch("mito_ai.utils.open_ai_utils.get_user_field") as mock_get_user_field:
        
        mock_get_user_field.side_effect = ["test@example.com", "user123"]
        
        with patch("mito_ai.utils.open_ai_utils.check_mito_server_quota"):
            # First call
            data1, _ = _prepare_request_data_and_headers(
                last_message_content="test",
                ai_completion_data={},
                timeout=30,
                max_retries=3,
                message_type=MessageType.CHAT
            )

            # Second call
            data2, _ = _prepare_request_data_and_headers(
                last_message_content="test",
                ai_completion_data={},
                timeout=30,
                max_retries=3,
                message_type=MessageType.CHAT
            )

            # Verify get_user_field was only called twice (once for email, once for user_id)
            assert mock_get_user_field.call_count == 2
            
            # Verify both calls return same user info
            assert data1["email"] == data2["email"] == "test@example.com"
            assert data1["user_id"] == data2["user_id"] == "user123"
