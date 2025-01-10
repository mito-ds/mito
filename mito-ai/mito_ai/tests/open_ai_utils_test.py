from mito_ai.utils.open_ai_utils import (
    OPEN_SOURCE_AI_COMPLETIONS_LIMIT,
    check_mito_server_quota,
)


def test_check_mito_server_quota():
    check_mito_server_quota(1, )
