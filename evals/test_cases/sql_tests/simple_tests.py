from evals.notebook_states import *
from evals.eval_types import SQLTestCase

SIMPLE_TESTS = [
    SQLTestCase(
        name="simple_test_1",
        user_input="get the company with the largest market cap",
        schema="small.json",
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM companies ORDER BY market_cap DESC LIMIT 1",
        expected_tables=["companies"],
        expected_columns=["*"],
    )
]
