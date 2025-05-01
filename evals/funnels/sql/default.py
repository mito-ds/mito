from typing import List, Dict, Any
from evals.eval_types import SQLTestCase, SQLDetails
from evals.funnels.sql.steps import (
    sql_generated_test,
    correct_tables_test,
    no_table_halucinations_test,
)


def test_funnel(
    test_case_specs: SQLTestCase,
    sql_details: SQLDetails,
    schema: Dict[str, Any],
):
    """
    This is the default funnel entry point. It takes two arguments:

    1. `test_case_specs` - our outline of the expected tables, columns, etc.
    2. `sql_details` - the AI generated query + some extracted metadata.

    It then uses a series of "funnels" to compare the two and determine if the SQL is correct.
    """
    print(sql_details)

    # 1. SQL generated - did the AI generate a SQL query?
    sql_generated_test(test_case_specs.expected_output, sql_details.query)

    # 2. Tables - does the SQL query use the correct tables?
    correct_tables_test(test_case_specs.expected_tables, sql_details.tables)

    # 3. No halucinated tables - does the SQL query reference any tables that are not in the schema?
    no_table_halucinations_test(
        test_case_specs.expected_tables, sql_details.tables, schema
    )

    # 4. No column-table mismatches - does the SQL query reference any columns that are not in the schema?

    # 5. No halucinated columns - does the SQL query reference any columns that are not in the schema?

    # 6. Syntax check - does the query actually run?

    # 7. Correct data - does the SQL query return the correct data?
