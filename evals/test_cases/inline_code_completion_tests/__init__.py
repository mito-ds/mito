
from evals.test_cases.inline_code_completion_tests.variable_tests import VARIABLE_TESTS
from evals.test_cases.inline_code_completion_tests.function_tests import FUNCTION_TESTS
from evals.test_cases.inline_code_completion_tests.misc_tests import MISC_TESTS

INLINE_CODE_COMPLETION_TESTS = [
    *MISC_TESTS,
    *VARIABLE_TESTS,
    *FUNCTION_TESTS,
]
