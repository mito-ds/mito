# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

JOIN_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="join_companies_and_prices",
        user_input="Find the ticker symbol and market cap for the company with the highest volume for the last reported date",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT c.SYMBOL, c.MARKETCAP FROM SP_500.PUBLIC.SP500_COMPANIES c JOIN SP_500.PUBLIC.SP500_STOCKS s ON c.SYMBOL = s.SYMBOL WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) ORDER BY s.VOLUME DESC LIMIT 1",
    ),
    
]
