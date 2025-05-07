# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import SQLTestCase

# SQL Tests
from evals.test_cases.sql_tests.sample_tests import SAMPLE_TESTS


SQL_TESTS: List[SQLTestCase] = [
    *SAMPLE_TESTS,
]
