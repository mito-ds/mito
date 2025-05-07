# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

RETRIEVAL_AND_FILTERING_TESTS = [
    SQLTestCase(
        name="list_all_companies",
        user_input="List all S&P 500 companies.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="tech_sector_companies",
        user_input="Which companies belong to the Technology sector?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="high_market_cap",
        user_input="Show me companies with a market cap over 1 trillion.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="companies_in_texas",
        user_input="Which S&P 500 companies are based in Texas?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="top_five_by_price",
        user_input="Show the 5 companies with the highest current price.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="revenue_growth_positive",
        user_input="Which companies had positive revenue growth?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="companies_named_inc",
        user_input="Find all companies with 'Inc' in the name.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="stocks_on_date",
        user_input="Show the stock prices for all companies on January 1st, 2024.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="high_volume_trades",
        user_input="Which stock trades had a volume over 10 million?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
    SQLTestCase(
        name="specific_company_stock",
        user_input="Show the stock performance of AAPL over time.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
    ),
]
