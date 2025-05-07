# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

BASIC_RETRIEVAL_AND_FILTERING_TESTS = [
    SQLTestCase(
        name="list_all_companies",
        user_input="List all S&P 500 companies.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES",
    ),
    SQLTestCase(
        name="tech_sector_companies",
        user_input="Which companies belong to the Technology sector?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES WHERE SECTOR = 'Technology'",
    ),
    SQLTestCase(
        name="high_market_cap",
        user_input="Show me companies with a market cap over 1 trillion.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES WHERE MARKETCAP > 1000000000000",
    ),
    SQLTestCase(
        name="top_five_by_price",
        user_input="Show the 5 companies with the highest current price.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES ORDER BY CURRENTPRICE DESC LIMIT 5",
    ),
    SQLTestCase(
        name="companies_named_inc",
        user_input="Find all companies with 'Inc' in the name.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES WHERE NAME LIKE '%Inc%'",
    ),
]
