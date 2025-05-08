# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

TEST_TYPE = "basic_retrieval_and_filtering"

BASIC_RETRIEVAL_AND_FILTERING_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="tech_sector_companies",
        user_input="Which companies belong to the Technology sector?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL 
            FROM SP_500.PUBLIC.SP500_COMPANIES 
            WHERE SECTOR = 'Technology'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="high_market_cap",
        user_input="Show me companies with a market cap over 1 trillion.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, MARKETCAP 
            FROM SP_500.PUBLIC.SP500_COMPANIES 
            WHERE MARKETCAP > 1000000000000
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="top_five_by_price",
        user_input="Show the 5 companies with the highest current price.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, CURRENTPRICE 
            FROM SP_500.PUBLIC.SP500_COMPANIES 
            ORDER BY CURRENTPRICE DESC 
            LIMIT 5
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="just_joined_low_satisfaction",
        user_input="Find all customers who just joined and have the lowest possible satisfaction score.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID, SATISFACTION_SCORE 
            FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS 
            WHERE CUSTOMER_STATUS = 'Joined' AND SATISFACTION_SCORE = 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="churned_and_gave_a_reason",
        user_input="Find all customers who churned and gave a reason.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID, CHURN_REASON 
            FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS 
            WHERE CHURN_LABEL = TRUE AND CHURN_REASON IS NOT NULL
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="made_referral_but_does_not_have_multiple_lines",
        user_input="Find all customers who made a referral but do not have multiple lines.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID 
            FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS 
            WHERE NUMBER_OF_REFERRALS > 0 AND MULTIPLE_LINES = FALSE
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # LARGE SCHEMA (mix and match from the previous tests, good to see if there is performance degradation)
    SQLTestCase(
        name="tech_sector_companies",
        user_input="Which companies belong to the Technology sector?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL 
            FROM SP_500.PUBLIC.SP500_COMPANIES 
            WHERE SECTOR = 'Technology'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="churned_and_gave_a_reason",
        user_input="Find all customers who churned and gave a reason.",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID, CHURN_REASON 
            FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS 
            WHERE CHURN_LABEL = TRUE AND CHURN_REASON IS NOT NULL
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="made_referral_but_does_not_have_multiple_lines",
        user_input="Find all customers who made a referral but do not have multiple lines.",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID 
            FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS 
            WHERE NUMBER_OF_REFERRALS > 0 AND MULTIPLE_LINES = FALSE
        """.strip(),
        test_type=TEST_TYPE,
    ),
]
