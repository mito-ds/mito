# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import SQLTestCase

# SQL Tests
from evals.test_cases.sql_tests.simple_tests import SIMPLE_TESTS


SQL_TESTS: List[SQLTestCase] = [
    *SIMPLE_TESTS,
]
