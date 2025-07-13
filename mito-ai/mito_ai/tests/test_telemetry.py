# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.utils.telemetry_utils import PRINT_LOGS

def test_print_logs_is_false():
    """
    Test to ensure that PRINT_LOGS is set to False.
    """
    assert not PRINT_LOGS, "PRINT_LOGS should be False by default."

