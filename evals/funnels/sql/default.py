# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, Any
from evals.eval_types import SQLTestCase, ParsedSQLDetails
from evals.funnels.sql.utils import run_sql_query
from evals.funnels.sql.steps import (
    is_sql_generated_test,
    correct_tables_test,
    no_table_halucinations_test,
    no_column_table_mismatch_test,
    execute_without_errors_test,
    correct_data_shape_test,
    correct_data_test,
)


def default_test_funnel(
    test_case_specs: SQLTestCase,
    parsed_actual_sql: ParsedSQLDetails,
    parsed_expected_sql: ParsedSQLDetails,
    schema: Dict[str, Any],
):
    """
    This is the default funnel entry point. It takes two arguments:

    1. `test_case_specs` - our outline of the expected tables, columns, etc.
    2. `parsed_actual_sql` - the AI generated query + some extracted metadata.
    3. `parsed_expected_sql` - the expected query + some extracted metadata.
    4. `schema` - the schema of the database.

    It then uses a series of "funnels" to compare the two and determine if the SQL is correct.
    """
    results = {
        "name": test_case_specs.name,
        "actual_sql": parsed_actual_sql.query,
        "expected_sql": parsed_expected_sql.query,
        "results": [],
    }

    # 1. SQL generated - did the AI generate a SQL query?
    is_sql_generated_result = is_sql_generated_test(
        test_case_specs.expected_output, parsed_actual_sql.query
    )
    results["results"].append(is_sql_generated_result)

    # 2. Tables - does the SQL query use the correct tables?
    correct_tables_result = correct_tables_test(
        [table.name for table in parsed_expected_sql.tables],
        [table.name for table in parsed_actual_sql.tables],
    )
    results["results"].append(correct_tables_result)

    # 3. No halucinated tables - does the SQL query reference any tables that are not in the schema?
    no_table_halucinations_result = no_table_halucinations_test(
        [table.name for table in parsed_expected_sql.tables],
        [table.name for table in parsed_actual_sql.tables],
        schema,
    )
    results["results"].append(no_table_halucinations_result)

    # 4. No column-table mismatches - does the SQL query reference any columns that are not in the schema?
    no_column_table_mismatch_result = no_column_table_mismatch_test(
        parsed_actual_sql.tables, schema
    )
    results["results"].append(no_column_table_mismatch_result)

    # ================================================
    # At this point, we switch over to comparing the actual response from the query.
    # To do this, we'll store the response as a pandas DataFrame, and use that to compare.
    expected_df, error = run_sql_query(test_case_specs.expected_output or "")

    # 5. Syntax check - does the query actually run?
    df_from_generated_query, execute_without_errors_result = execute_without_errors_test(
        parsed_actual_sql
    )
    results["results"].append(execute_without_errors_result)

    # 6. Correct data shape - do the two dataframes have the same shape?
    correct_data_shape_result = correct_data_shape_test(
        expected_df, df_from_generated_query
    )
    results["results"].append(correct_data_shape_result)

    # 7. Correct data - do the two dataframes have the same data?
    correct_data_result = correct_data_test(expected_df, df_from_generated_query)
    results["results"].append(correct_data_result)

    return results

