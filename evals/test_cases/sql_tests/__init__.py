# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import SQLTestCase

# SQL Tests
from evals.test_cases.sql_tests.sample_tests import SAMPLE_TESTS
from evals.test_cases.sql_tests.retrieval_filtering_test import (
    BASIC_RETRIEVAL_AND_FILTERING_TESTS,
)
from evals.test_cases.sql_tests.grouping_tests import AGGREGATION_AND_GROUPING_TESTS
from evals.test_cases.sql_tests.join_tests import JOIN_TESTS
from evals.test_cases.sql_tests.time_tests import TIME_BASED_TESTS

SQL_TESTS: List[SQLTestCase] = [
    *SAMPLE_TESTS,
    *BASIC_RETRIEVAL_AND_FILTERING_TESTS,
    *AGGREGATION_AND_GROUPING_TESTS,
    *JOIN_TESTS,
    *TIME_BASED_TESTS,
]
