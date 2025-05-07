# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

SAMPLE_TESTS = [
    # SQLTestCase(
    #     name="non_existent_table",
    #     user_input="which car brand sold the most cars in 2020?",
    #     schema=SMALL_SCHEMA,
    #     notebook_state=EMPTY_NOTEBOOK,
    #     expected_output=None,
    # ),
    # SQLTestCase(
    #     name="simple_test_1",
    #     user_input="get the company with the largest market cap",
    #     schema=SMALL_SCHEMA,
    #     notebook_state=EMPTY_NOTEBOOK,
    #     expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES ORDER BY MARKETCAP DESC LIMIT 1",
    # ),
]    
