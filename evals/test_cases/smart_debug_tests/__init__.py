from typing import List
from evals.eval_types import SmartDebugTestCase

# Smart Debug Tests
from evals.test_cases.smart_debug_tests.smart_debug_tests import TESTS
from evals.test_cases.smart_debug_tests.function_tests import FUNCTION_TESTS
from evals.test_cases.smart_debug_tests.pandas_tests import PANDAS_TESTS
from evals.test_cases.smart_debug_tests.import_tests import IMPORT_TESTS
from evals.test_cases.smart_debug_tests.matplotlib_tests import MATPLOTLIB_TESTS


SMART_DEBUG_TESTS: List[SmartDebugTestCase] = [
    *TESTS,
    *FUNCTION_TESTS,
    *PANDAS_TESTS,
    *IMPORT_TESTS,
    *MATPLOTLIB_TESTS,
]