# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

BASIC_RETRIEVAL_AND_FILTERING_TESTS = [
    # SMALL SCHEMA
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
        expected_output="SELECT * FROM SP_500.PUBLIC.SP500_COMPANIES WHERE LONGNAME LIKE '%Inc%'",
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="churned_customers_with_high_cltv",
        user_input="Find all churned customers with a high CLTV (over 6k).",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS WHERE CHURN_LABEL = TRUE AND CLTV > 6000",
    ),
    SQLTestCase(
        name="just_joined_low_satisfaction",
        user_input="Find all customers who just joined and have the lowest possible satisfaction score.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS WHERE CUSTOMER_STATUS = 'Joined' AND SATISFACTION_SCORE = 1",
    ),
    SQLTestCase(
        name="churned_and_gave_a_reason",
        user_input="Find all customers who churned and gave a reason.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS WHERE CHURN_LABEL = TRUE AND CHURN_REASON IS NOT NULL",
    ),  
    SQLTestCase(
        name="made_referral_but_does_not_have_multiple_lines",
        user_input="Find all customers who made a referral but do not have multiple lines.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS WHERE NUMBER_OF_REFERRALS > 0 AND MULTIPLE_LINES = FALSE",
    ),  
    SQLTestCase(
        name="most_referrals",
        user_input="Find the customer with the most referrals.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT * FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS ORDER BY NUMBER_OF_REFERRALS DESC LIMIT 1",
    ),
    # LARGE SCHEMA
    
]
