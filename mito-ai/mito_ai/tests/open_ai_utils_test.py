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
from mito_ai.utils.telemetry_utils import MITO_SERVER_FREE_TIER_LIMIT_REACHED
from mito_ai.completions.models import MessageType

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
