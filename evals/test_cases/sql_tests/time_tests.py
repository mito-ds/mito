# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.notebook_states import *
from evals.eval_types import SQLTestCase
from evals.test_cases.sql_tests.constants import *

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
    ),
    SQLTestCase(
        name="highest_volume_last_week",
        user_input="Which stock had the highest volume in the last 7 days?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT SYMBOL, VOLUME
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE >= DATEADD(day, -7, (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS))
            ORDER BY VOLUME DESC
            LIMIT 1
        """.strip(),
    ),
    SQLTestCase(
        name="min_max_close_yesterday",
        user_input="What were the minimum and maximum closing prices of SP500 stocks yesterday?",
        schema=SMALL_SCHEMA,
        notebook_state=EMPTY_NOTEBOOK,
        expected_output="""
            SELECT MIN(CLOSE) AS min_close, MAX(CLOSE) AS max_close
            FROM SP_500.PUBLIC.SP500_STOCKS
            WHERE DATE = DATEADD(day, -1, (SELECT MAX(DATE) FROM SP_500.PUBLIC.SP500_STOCKS))
        """.strip(),
    ),
    # MEDIUM SCHEMA
    # LARGE SCHEMA
]
