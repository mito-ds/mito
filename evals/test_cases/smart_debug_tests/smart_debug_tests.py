from evals.eval_types import CodeGenTestCase, CodeGenTestCaseCore, SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


SMART_DEBUG_TESTS = [
    SmartDebugTestCase(
        name="error_missing_quote",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="x='aaron",
        correct_code="x='aaron'",
        tags=['error_handling']
    ),
]