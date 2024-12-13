from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


MISC_TESTS = [
    InlineCodeCompletionTestCase(
        name="completely_empty_notebook",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="",
            workflow_tags=["misc"],
        ),
        prefix="""""",
        suffix="""""",
        type_tags=["no_expressed_intent"],
    ),
]
