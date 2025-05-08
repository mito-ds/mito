# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

JOIN_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="market_cap_for_highest_volume",
        user_input="Find the ticker symbol and market cap for the company with the highest volume for the last reported date",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT c.SYMBOL, c.MARKETCAP FROM SP_500.PUBLIC.SP500_COMPANIES c JOIN SP_500.PUBLIC.SP500_STOCKS s ON c.SYMBOL = s.SYMBOL WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) ORDER BY s.VOLUME DESC LIMIT 1",
    ),
    SQLTestCase(
        name="ticker_with_lowest_open",
        user_input="What ticker had the lowest opening price in the last reported date, and what was its high for that day?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT c.SYMBOL, s.HIGH FROM SP_500.PUBLIC.SP500_COMPANIES c JOIN SP_500.PUBLIC.SP500_STOCKS s ON c.SYMBOL = s.SYMBOL WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) ORDER BY s.OPEN ASC LIMIT 1",
    ),
    SQLTestCase(
        name="find_non_existent_sma_table",
        user_input="Can you find the tech company with the lowest SMA50 over the last 30 days?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    # MEDIUM SCHEMA

    # LARGE SCHEMA

]
