import pytest
from datetime import datetime
from unittest.mock import patch
from mito_ai.utils.open_ai_utils import (
    MITO_SERVER_FREE_TIER_LIMIT_REACHED,
    OPEN_SOURCE_AI_COMPLETIONS_LIMIT,
    check_mito_server_quota,
)

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")


def test_check_mito_server_quota_open_source_user() -> None:
    # Under both limits
    check_mito_server_quota(1, TODAY)

    # Over the both limits
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED):
        check_mito_server_quota(OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1, REALLY_OLD_DATE)

    # Over the chat limit
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED):
        check_mito_server_quota(OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1, TODAY)

    # Over the inline limit
    with pytest.raises(PermissionError, match=MITO_SERVER_FREE_TIER_LIMIT_REACHED):
        check_mito_server_quota(1, REALLY_OLD_DATE)


def test_check_mito_server_quota_pro_user() -> None:
    # No error should be thrown since pro users don't have limits
    with patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True):
        check_mito_server_quota(1, TODAY)
        check_mito_server_quota(OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1, REALLY_OLD_DATE)
        check_mito_server_quota(OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1, TODAY)
        check_mito_server_quota(1, REALLY_OLD_DATE)
