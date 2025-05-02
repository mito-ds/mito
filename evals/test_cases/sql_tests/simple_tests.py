from evals.notebook_states import *
from evals.eval_types import SQLTestCase

SIMPLE_TESTS = [
    SQLTestCase(
        name="non_existent_table",
        user_input="which car brand sold the most cars in 2020?",
        schema="small.json",
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
        expected_tables=[],
        expected_columns=[],
    ),
    SQLTestCase(
        name="simple_test_1",
        user_input="get the company with the largest market cap",
        schema="small.json",
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES ORDER BY MARKETCAP DESC LIMIT 1",
        expected_tables=["SP_500.PUBLIC.SP500_COMPANIES"],
        expected_columns=["*"],
    ),
]    
