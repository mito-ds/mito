from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import *

VARIABLE_TESTS = [
    InlineCodeCompletionTestCase(
        name="empty_notebook_variable_declaration_with_prefix",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="x=1",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""
# Create a variable x and set it equal to 1
x =""",
        suffix="",
        type_tags=["comment_following"],
    ),
    InlineCodeCompletionTestCase(
        name="empty_notebook_variable_declaration_no_prefix",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="x=1",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""# Create a variable x and set it equal to 1""",
        suffix="",
        type_tags=["comment_following"],
    ),
    InlineCodeCompletionTestCase(
        name="empty_notebook_variable_declaration_with_suffix",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x=1
y=2""",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""
# Set x equal to 1
x =""",
        suffix="""
y=2""",
        type_tags=["comment_following"],
    ),
    InlineCodeCompletionTestCase(
        name='code_pattern_following_no_suffix',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
a = 1 # set a to 1
b = 2 # set b to 2
c = 3 # set c to 3
d = 4 # set d to 4""",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""
a = 1 # set a to 1
b = 2 # set b to 2
c = 3 # set c to 3
d""",
        suffix='',
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name='code_pattern_following_small_prefix',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
a = 1 # set a to 1
b = 2 # set b to 2
c = 3 # set c to 3
d = 4 # set d to 4""",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""
a
""",
        suffix="""
b = 2 # set b to 2
c = 3 # set c to 3
d = 4 # set d to 4""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name='code_pattern_following_no_prefix',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
a = 1 # set a to 1
b = 2 # set b to 2
c = 3 # set c to 3
d = 4 # set d to 4""",
            workflow_tags=["variable_declaration"],
        ),
        prefix="""""",
        suffix="""
b = 2 # set b to 2
c = 3 # set c to 3
d = 4 # set d to 4""",
        type_tags=["code_completion"],
    ),

]
