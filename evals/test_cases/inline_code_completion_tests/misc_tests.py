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

    InlineCodeCompletionTestCase(
        name="finish_today_variable_with_equals",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
import datetime

# Get today's date with just the date component using datetime.datetime.today().date()
today_date = datetime.datetime.today().date()
""",
            workflow_tags=["misc"],
        ),
        prefix="""
import datetime

# Get today's date with just the date component using datetime.datetime.today().date()
today_date = """,
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name="finish_today_variable_without_equals",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
import datetime

# Get today's date with just the date component using datetime.datetime.today().date()
today_date = datetime.datetime.today().date()
""",
            workflow_tags=["misc"],
        ),
        prefix="""
import datetime

# Get today's date with just the date component using datetime.datetime.today().date()
today_date """,
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name='finish_total_variable_before_equals',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum = x + y + z
""",
            workflow_tags=["misc"],
        ),
        prefix="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum""",
        suffix="""""",
        type_tags=["code_completion"],
    ),

        InlineCodeCompletionTestCase(
        name='finish_total_variable_before_equals_with_space',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum = x + y + z
""",
            workflow_tags=["misc"],
        ),
        prefix="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum """,
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name='finish_total_variable_at_equals',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum = x + y + z
""",
            workflow_tags=["misc"],
        ),
        prefix="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum =""",
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name='finish_total_variable_after_equals_space',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum = x + y + z
""",
            workflow_tags=["misc"],
        ),
        prefix="""
x = 10
y = 20
z = 30

# Sum of x, y, and z
total_sum = """,
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name="print_after_15th_cursor_at_end_of_comment",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
import datetime

today_date = datetime.datetime.today().date()

# If today is after the 15th of the month print 'After 15th'
if today_date.day > 15:
    print('After 15th')
""",
            workflow_tags=["misc"],
        ),
        prefix="""
import datetime

today_date = datetime.datetime.today().date()

# If today is after the 15th of the month print 'After 15th'""",
        suffix="""""",
        type_tags=["comment_following"],
    ),
            InlineCodeCompletionTestCase(
        name="print_after_2pm_cursor_after_comment",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
import datetime

today_date = datetime.datetime.today().date()

# If today is after the 15th of the month print 'After 15th'
if today_date.day > 15:
    print('After 15th')
""",
            workflow_tags=["misc"],
        ),
        prefix="""
import datetime

today_date = datetime.datetime.today().date()

# If today is after the 15th of the month print 'After 15th'
""",
        suffix="""""",
        type_tags=["comment_following"],
    ),
]
