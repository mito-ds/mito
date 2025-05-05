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
    sql_details: ParsedSQLDetails,
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
    sql_generated_result = is_sql_generated_test(
        test_case_specs.expected_output, sql_details.query
    )
    print(sql_generated_result)

    # 2. Tables - does the SQL query use the correct tables?
    correct_tables_result = correct_tables_test(
        test_case_specs.expected_tables,
        [table.name for table in sql_details.tables],
    )
    print(correct_tables_result)

    # 3. No halucinated tables - does the SQL query reference any tables that are not in the schema?
    no_table_halucinations_result = no_table_halucinations_test(
        test_case_specs.expected_tables,
        [table.name for table in sql_details.tables],
        schema,
    )
    print(no_table_halucinations_result)

    # 4. No column-table mismatches - does the SQL query reference any columns that are not in the schema?
    no_column_table_mismatch_result = no_column_table_mismatch_test(
        sql_details.tables, schema
    )
    print(no_column_table_mismatch_result)

    # ================================================
    # At this point, we switch over to comparing the actual response from the query.
    # To do this, we'll store the response as a pandas DataFrame, and use that to compare.
    expected_df, error = run_sql_query(test_case_specs.expected_output or "")

    # 5. Syntax check - does the query actually run?
    df_from_generated_query, syntax_check_result = execute_without_errors_test(sql_details)
    print(syntax_check_result)

    # 6. Correct data shape - do the two dataframes have the same shape?
    correct_data_shape_result = correct_data_shape_test(
        expected_df, df_from_generated_query
    )
    print(correct_data_shape_result)

    # 7. Correct data - do the two dataframes have the same data?
    correct_data_result = correct_data_test(expected_df, df_from_generated_query)
    print(correct_data_result)
