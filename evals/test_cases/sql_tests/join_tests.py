# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

TEST_TYPE = "join_tests"

JOIN_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="market_cap_for_highest_volume",
        user_input="Find the ticker symbol and market cap for the company with the highest volume for the last reported date",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT c.SYMBOL, c.MARKETCAP 
            FROM SP_500.PUBLIC.SP500_COMPANIES c 
            JOIN SP_500.PUBLIC.SP500_STOCKS s 
            ON c.SYMBOL = s.SYMBOL 
            WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) 
            ORDER BY s.VOLUME DESC 
            LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="ticker_with_lowest_open",
        user_input="What ticker had the lowest opening price in the last reported date, and what was its high for that day?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT c.SYMBOL, s.HIGH 
            FROM SP_500.PUBLIC.SP500_COMPANIES c 
            JOIN SP_500.PUBLIC.SP500_STOCKS s 
            ON c.SYMBOL = s.SYMBOL 
            WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) 
            ORDER BY s.OPEN ASC LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="find_non_existent_sma_table",
        user_input="Can you find the tech company with the lowest SMA50 over the last 30 days?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output=None,
        test_type=TEST_TYPE,
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="churned_customer_avg_age",
        user_input="What is the avg age for a churned customer?",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT AVG(c.AGE) 
            FROM TELCO_CHRUN.PUBLIC.CUSTOMER_INFO c 
            JOIN TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS s 
            ON c.CUSTOMER_ID = s.CUSTOMER_ID 
            WHERE s.CHURN_LABEL = TRUE
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="most_referrals_zip_code",
        user_input="Can you find the zip code for the customer who has made the most referrals",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT l.ZIP_CODE 
            FROM TELCO_CHRUN.PUBLIC.LOCATION_DATA l 
            JOIN TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS s 
            ON l.CUSTOMER_ID = s.CUSTOMER_ID 
            WHERE s.NUMBER_OF_REFERRALS = (SELECT MAX(NUMBER_OF_REFERRALS) FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS) 
            LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # LARGE SCHEMA
    SQLTestCase(
        name="market_cap_for_highest_volume",
        user_input="Find the ticker symbol and market cap for the company with the highest volume for the last reported date",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT c.SYMBOL, c.MARKETCAP 
            FROM SP_500.PUBLIC.SP500_COMPANIES c 
            JOIN SP_500.PUBLIC.SP500_STOCKS s 
            ON c.SYMBOL = s.SYMBOL 
            WHERE s.DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS) 
            ORDER BY s.VOLUME DESC LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="churned_customer_avg_age",
        user_input="What is the avg age for a churned customer?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT AVG(c.AGE) 
            FROM TELCO_CHRUN.PUBLIC.CUSTOMER_INFO c 
            JOIN TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS s 
            ON c.CUSTOMER_ID = s.CUSTOMER_ID 
            WHERE s.CHURN_LABEL = TRUE
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="most_referrals_zip_code",
        user_input="Can you find the zip code for the customer who has made the most referrals",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT l.ZIP_CODE 
            FROM TELCO_CHRUN.PUBLIC.LOCATION_DATA l 
            JOIN TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS s 
            ON l.CUSTOMER_ID = s.CUSTOMER_ID 
            WHERE s.NUMBER_OF_REFERRALS = (SELECT MAX(NUMBER_OF_REFERRALS) FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS) 
            LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
]
