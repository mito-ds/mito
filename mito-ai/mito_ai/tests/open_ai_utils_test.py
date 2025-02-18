import pytest
from datetime import datetime
from unittest.mock import patch
from mito_ai.utils.open_ai_utils import (
    MITO_AI_PROD_URL,
    MITO_AI_URL,
    MITO_SERVER_FREE_TIER_LIMIT_REACHED,
    OPEN_SOURCE_AI_COMPLETIONS_LIMIT,
    check_mito_server_quota,
)

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")


def test_check_mito_server_quota_open_source_user() -> None:
    # Under both limits
    with patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1) as mock_count, \
         patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY) as mock_date:
        check_mito_server_quota()
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == 1
        assert mock_date.return_value == TODAY

    # Over both limits
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED), \
         patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1) as mock_count, \
         patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE) as mock_date:
        check_mito_server_quota()
        assert mock_count.called
        assert mock_date.called
        assert mock_count.return_value == OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1
        assert mock_date.return_value == REALLY_OLD_DATE

    # Over the chat limit
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED), \
         patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1), \
         patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY):
        check_mito_server_quota()

    # Over the inline limit
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED), \
         patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1), \
         patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE):
        check_mito_server_quota()


def test_check_mito_server_quota_pro_user() -> None:
    # No error should be thrown since pro users don't have limits
    with patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True), \
         patch("mito_ai.utils.db.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1), \
         patch("mito_ai.utils.db.get_first_completion_date", return_value=REALLY_OLD_DATE):
        check_mito_server_quota()

def test_mito_ai_url_is_prod_url() -> None:
    assert MITO_AI_URL == MITO_AI_PROD_URL
