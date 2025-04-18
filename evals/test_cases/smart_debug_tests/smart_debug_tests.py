# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import ChatTestCase, CodeGenTestCaseCore, SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


TESTS = [
    SmartDebugTestCase(
        name="error_missing_quote_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="x='aaron",
        correct_code="x='aaron'",
        workflow_tags=['simple'],
        type_tags=['SyntaxError']
    ),
    SmartDebugTestCase(
        name="single_equals_sign_in_if_statement_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
x = 1
if x = 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        correct_code="""
x = 1
if x == 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        workflow_tags=['simple'],
        type_tags=['SyntaxError']
    ),
    SmartDebugTestCase(
        name="output_comparison_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="print('hello world)",
        correct_code="print('hello world')",
        workflow_tags=['simple'],
        type_tags=['SyntaxError']
    ),
    SmartDebugTestCase(
        name="variable_name_typo_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
aaron_age = 27
aaron_age = Aaron_age + 1
""",
        correct_code="""
aaron_age = 27
aaron_age = aaron_age + 1
""",
        workflow_tags=['simple'],
        type_tags=['NameError']
    ),
    SmartDebugTestCase(
        name='string_integer_operations_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
y = '5'
x = y + 27
""",
        correct_code="""
y = 5
x = y + 27
""",
        workflow_tags=['simple'],
        type_tags=['TypeError'],
        variables_to_compare=['x']
    ),
    SmartDebugTestCase(
        name="typo_adding_code_cell_below",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
bb
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        correct_code="""
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        workflow_tags=['simple', 'typo'],
        type_tags=['NameError']
    )

]