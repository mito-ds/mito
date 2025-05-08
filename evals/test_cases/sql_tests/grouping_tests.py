# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

AGGREGATION_AND_GROUPING_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="average_market_cap",
        user_input="What is the average market cap of all companies in the S&P 500?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT AVG(MARKETCAP) FROM SP_500.PUBLIC.SP500_COMPANIES",
    ),
    SQLTestCase(
        name="average_market_cap_by_sector",
        user_input="What is the average market cap of companies by sector?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT SECTOR, AVG(MARKETCAP) FROM SP_500.PUBLIC.SP500_COMPANIES GROUP BY SECTOR",
    ),
    SQLTestCase(
        name="tech_companies_w_positive_revenue_growth",
        user_input="How many tech companies have positive revenue growth?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT COUNT(*) FROM SP_500.PUBLIC.SP500_COMPANIES WHERE SECTOR = 'Technology' AND REVENUEGROWTH > 0",
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="avg_ltv_for_churned_customers",
        user_input="What is the average LTV for churned customers?",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT AVG(CLTV) FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS WHERE CHURN_LABEL = TRUE",
    ),
    SQLTestCase(
        name="avg_referrals_for_all_services",
        user_input="What is the avg number of referrals for customer subscribed to all services?",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT AVG(NUMBER_OF_REFERRALS) FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS WHERE INTERNET_SERVICE = TRUE AND PHONE_SERVICE = TRUE",
    ),
    SQLTestCase(
        name="avg_referrals_for_all_services",
        user_input="For each satisfaction score, what is the avg lifetime value?",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT SATISFACTION_SCORE, AVG(CLTV) FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS GROUP BY SATISFACTION_SCORE",
    ),
    # LARGE SCHEMA
    SQLTestCase(
        name="average_market_cap_by_sector",
        user_input="What is the average market cap of companies by sector?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT SECTOR, AVG(MARKETCAP) FROM SP_500.PUBLIC.SP500_COMPANIES GROUP BY SECTOR",
    ),
    SQLTestCase(
        name="avg_ltv_for_churned_customers",
        user_input="What is the average LTV for churned customers?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT AVG(CLTV) FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS WHERE CHURN_LABEL = TRUE",
    ),
    SQLTestCase(
        name="avg_referrals_for_all_services",
        user_input="What is the avg number of referrals for customer subscribed to all services?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="SELECT AVG(NUMBER_OF_REFERRALS) FROM TELCO_CHRUN.PUBLIC.SERVICE_OPTIONS WHERE INTERNET_SERVICE = TRUE AND PHONE_SERVICE = TRUE",
    ),
]
