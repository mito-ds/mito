# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.test_cases.inline_code_completion_tests.variable_tests import VARIABLE_TESTS
from evals.test_cases.inline_code_completion_tests.function_tests import FUNCTION_TESTS
from evals.test_cases.inline_code_completion_tests.misc_tests import MISC_TESTS
from evals.test_cases.inline_code_completion_tests.loops import LOOP_TESTS
from evals.test_cases.inline_code_completion_tests.dataframe_transformation_tests import DATAFRAME_TRANSFORMATION_TESTS


INLINE_CODE_COMPLETION_TESTS = [
    *MISC_TESTS,
    *VARIABLE_TESTS,
    *FUNCTION_TESTS,
    *LOOP_TESTS,
    *DATAFRAME_TRANSFORMATION_TESTS,
]
