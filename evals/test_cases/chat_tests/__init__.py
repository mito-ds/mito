# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from evals.eval_types import ChatTestCase

# Chat Tests
from evals.test_cases.chat_tests.variable_tests import VARIABLE_TESTS
from evals.test_cases.chat_tests.dataframe_creation_tests import DATAFRAME_CREATION_TESTS
from evals.test_cases.chat_tests.dataframe_transformation_tests import DATAFRAME_TRANSFORMATION_TESTS
from evals.test_cases.chat_tests.function_tests import FUNCTION_TESTS
from evals.test_cases.chat_tests.multistep_tests import MULTISTEP_TESTS

CHAT_TESTS: List[ChatTestCase] = [
    *VARIABLE_TESTS,
    *DATAFRAME_CREATION_TESTS,
    *DATAFRAME_TRANSFORMATION_TESTS,
    *FUNCTION_TESTS,
    *MULTISTEP_TESTS
] 
