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
    InlineCodeCompletionTestCase(
        name="print_hi_with_prefix",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="print('Hi')",
            workflow_tags=["misc"],
        ),
        prefix="""#Print 'Hi'
pri""",
        suffix="""""",
        type_tags=["comment_following"],
    ),
    InlineCodeCompletionTestCase(
        name="print_hi_most_of_line",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="print('Hi')",
            workflow_tags=["misc"],
        ),
        prefix="""#Print 'Hi'
print('Hi""",
        suffix="""""",
        type_tags=["comment_following"],
    ),
    # No expressed intent left in the line
    InlineCodeCompletionTestCase(
        name="print_hi_finished_line",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="print('Hi')",
            workflow_tags=["misc"],
        ),
        prefix="""#Print 'Hi'
print('Hi')""",
        suffix="""""",
        type_tags=["comment_following"],
    ),

]
