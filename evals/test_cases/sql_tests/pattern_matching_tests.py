# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

TEST_TYPE = "search_and_pattern_matching"

SEARCH_AND_PATTERN_MATCHING_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="companies_with_inc_in_name",
        user_input="List all companies that have 'Inc' in their full name.",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, LONGNAME
            FROM SP_500.PUBLIC.SP500_COMPANIES
            WHERE LONGNAME ILIKE '%Inc%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="companies_with_growth_in_summary",
        user_input="Which companies mention 'growth' in their business summary?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, LONGNAME
            FROM SP_500.PUBLIC.SP500_COMPANIES
            WHERE LONGBUSINESSSUMMARY ILIKE '%growth%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="customers_with_dissatisfaction_in_reason",
        user_input="Find all customers who mentioned 'dissatisfaction' in their churn reason.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID, CHURN_REASON
            FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS
            WHERE CHURN_REASON ILIKE '%dissatisfaction%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # LARGE SCHEMA
    SQLTestCase(
        name="companies_with_inc_in_name",
        user_input="List all companies that have 'Inc' in their full name.",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, LONGNAME
            FROM SP_500.PUBLIC.SP500_COMPANIES
            WHERE LONGNAME ILIKE '%Inc%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="companies_with_growth_in_summary",
        user_input="Which companies mention 'growth' in their business summary?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, LONGNAME
            FROM SP_500.PUBLIC.SP500_COMPANIES
            WHERE LONGBUSINESSSUMMARY ILIKE '%growth%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="customers_with_dissatisfaction_in_reason",
        user_input="Find all customers who mentioned 'dissatisfaction' in their churn reason.",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT CUSTOMER_ID, CHURN_REASON
            FROM TELCO_CHRUN.PUBLIC.STATUS_ANALYSIS
            WHERE CHURN_REASON ILIKE '%dissatisfaction%'
        """.strip(),
        test_type=TEST_TYPE,
    ),
]
