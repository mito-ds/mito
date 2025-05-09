# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

TEST_TYPE = "time_based"

TIME_BASED_TESTS = [
    # SMALL SCHEMA
    SQLTestCase(
        name="latest_close_for_most_recent_date",
        user_input="What was the closing price of the SP500 stocks on the most recent date?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, CLOSE
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE = (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS)
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="highest_volume_last_week",
        user_input="Which stock had the highest volume in the last 7 recorded days?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, VOLUME
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE >= DATEADD(day, -7, (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS))
            ORDER BY VOLUME DESC
            LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="min_max_close_yesterday",
        user_input="What were the minimum and maximum closing prices of SP500 stocks for the last recorded day?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT MIN(CLOSE) AS min_close, MAX(CLOSE) AS max_close
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE = DATEADD(day, -1, (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS))
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # MEDIUM SCHEMA
    SQLTestCase(
        name="total_orders_last_7_days",
        user_input="How many orders were placed in the last 7 recorded days?",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT COUNT(*) AS total_orders
            FROM SALES_DB.PUBLIC.ORDERS
            WHERE ORDER_DATE >= DATEADD(day, -7, (SELECT MAX(ORDER_DATE) FROM SALES_DB.PUBLIC.ORDERS))
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="daily_order_totals_last_30_days",
        user_input="Show the total order amount per day for the past 30 recorded days.",
        schema=MEDIUM_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT ORDER_DATE, SUM(TOTAL_AMOUNT)
            FROM SALES_DB.PUBLIC.ORDERS
            WHERE ORDER_DATE >= DATEADD(day, -30, (SELECT MAX(ORDER_DATE) FROM SALES_DB.PUBLIC.ORDERS))
            GROUP BY ORDER_DATE
            ORDER BY ORDER_DATE
        """.strip(),
        test_type=TEST_TYPE,
    ),
    # LARGE SCHEMA
    SQLTestCase(
        name="highest_volume_last_week",
        user_input="Which stock had the highest volume in the last 7 recorded days?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, VOLUME
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE >= DATEADD(day, -7, (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS))
            ORDER BY VOLUME DESC
            LIMIT 1
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="total_orders_last_7_days",
        user_input="How many orders were placed in the last 7 recorded days?",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT COUNT(*) AS total_orders
            FROM SALES_DB.PUBLIC.ORDERS
            WHERE ORDER_DATE >= DATEADD(day, -7, (SELECT MAX(ORDER_DATE) FROM SALES_DB.PUBLIC.ORDERS))
        """.strip(),
        test_type=TEST_TYPE,
    ),
    SQLTestCase(
        name="daily_order_totals_last_30_days",
        user_input="Show the total order amount per day for the past 30 recorded days.",
        schema=LARGE_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT ORDER_DATE, SUM(TOTAL_AMOUNT) AS daily_total
            FROM SALES_DB.PUBLIC.ORDERS
            WHERE ORDER_DATE >= DATEADD(day, -30, (SELECT MAX(ORDER_DATE) FROM SALES_DB.PUBLIC.ORDERS))
            GROUP BY ORDER_DATE
            ORDER BY ORDER_DATE
        """.strip(),
        test_type=TEST_TYPE,
    ),
]
