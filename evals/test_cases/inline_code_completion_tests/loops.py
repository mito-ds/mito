# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, RETURNS_DICT_NOTEBOOK

YEARLY_RETURNS_FOR_LOOP_ANALYSIS: CodeGenTestCaseCore = CodeGenTestCaseCore(
    notebook_state=RETURNS_DICT_NOTEBOOK,
    expected_code="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))
""",
    variables_to_compare=["percent_changes"],
    workflow_tags=["loops"],
)


LOOP_TESTS = [
    InlineCodeCompletionTestCase(
        name="calls_function_to_produce_required_output_all_one_cell",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            variables_to_compare=["percent_changes"],
            workflow_tags=["loops"],
            expected_code="""

returns = {
    '2020': {
        'current_close': 100,
        'previous_close': 50,
    },
    '2021': {
        'current_close': 150,
        'previous_close': 100,
    },
    '2022': {
        'current_close': 200,
        'previous_close': 150,
    },
    '2023': {
        'current_close': 250,
        'previous_close': 200,
    },
    '2024': {
        'current_close': 300,
        'previous_close': 250,
    },
}

def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))

""",
        ),
        prefix="""

returns = {
    '2020': {
        'current_close': 100,
        'previous_close': 50,
    },
    '2021': {
        'current_close': 150,
        'previous_close': 100,
    },
    '2022': {
        'current_close': 200,
        'previous_close': 150,
    },
    '2023': {
        'current_close': 250,
        'previous_close': 200,
    },
    '2024': {
        'current_close': 300,
        'previous_close': 250,
    },
}

def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    """,
        suffix="""""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="calls_function_to_produce_required_output_split_across_cells",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    """,
        suffix="""""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="adds_missing_aggregator_variable_before_loop",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value
""",
        suffix="""
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))
""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="finishes_for_loop_condition",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in """,
        suffix="""
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))
""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="create_entire_for_loop_line",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
""",
        suffix="""
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))
""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="creates_entire_for_loop",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
""",
        type_tags=["code_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="creates_entire_for_loop_ending_with_comment",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []

# Calculate the percent change for each year 
""",
        type_tags=['comment_following'],
    ),
    InlineCodeCompletionTestCase(
        name="creates_entire_for_loop_ending_with_code",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

# Calculate the percent change for each year    
percent_changes = []
""",
        type_tags=['comment_following'],
    ),
    InlineCodeCompletionTestCase(
        name="returns_calculation_complete",
        test_case_core=YEARLY_RETURNS_FOR_LOOP_ANALYSIS,
        prefix="""
def calculate_percent_change(current_value, previous_value):
    return (current_value - previous_value) / previous_value

percent_changes = []
for year in returns.keys():
    current_close = returns[year]['current_close']
    previous_close = returns[year]['previous_close']
    percent_changes.append(calculate_percent_change(current_close, previous_close))
""",
        type_tags=['no_expressed_intent'],
    )
]
