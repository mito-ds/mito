from typing import List, Dict, Any
from evals.eval_types import SQLTestCase, SQLDetails


def sql_generated_test(
    expected_output: str | None, sql_query_recieved: str | None
) -> None:
    """
    Verifies whether a SQL query was generated as expected.

    This is the first funnel in the SQL evaluation process. It checks if the AI generated
    a SQL query when it was supposed to, or didn't generate one when it wasn't supposed to.

    Args:
        expected_output: The expected output string or None if no SQL query was expected
        sql_query_recieved: The actual SQL query string generated or None if no query was generated

    Raises:
        AssertionError: If the presence/absence of a SQL query doesn't match expectations
    """
    if expected_output is None:
        assert sql_query_recieved is None, "Expected no SQL query but one was generated"
    else:
        assert (
            sql_query_recieved is not None
        ), "Expected a SQL query but none was generated"


def correct_tables_test(expected_tables: List[str], tables_in_query: List[str]):
    """
    Verifies that all expected tables are present in the generated SQL query.

    Args:
        expected_tables: List of table names that should be used in the query
        tables_in_query: List of table names actually found in the generated SQL query

    Raises:
        AssertionError: If any expected table is missing from the query
    """
    for expected_table in expected_tables:
        assert (
            expected_table in tables_in_query
        ), f"Expected table '{expected_table}' not found in query"


def no_halucinated_tables_test(
    expected_tables: List[str], tables_in_query: List[str], schema: Dict[str, Any]
):
    """
    Verifies that no tables in the query are hallucinated (i.e. don't exist in the schema).

    Args:
        expected_tables: List of table names that should be used in the query
        tables_in_query: List of table names actually found in the generated SQL query
        schema: The database schema containing all valid tables, structured as:
            {
                "database_name": {
                    "schema_name": {
                        "table_name": [
                            {"name": "column_name", "type": "column_type"},
                            ...
                        ]
                    }
                }
            }

    Raises:
        AssertionError: If any table in the query doesn't exist in the schema
    """
    # Get all valid tables from the schema
    valid_tables = set()
    for database in schema.values():
        for schema_name in database.values():
            for table_name in schema_name.keys():
                valid_tables.add(table_name)

    # Check each table in the query against valid tables
    for table in tables_in_query:
        # Remove database and schema prefix if present
        table_name = table.split(".")[-1]
        assert (
            table_name in valid_tables
        ), f"Table '{table}' does not exist in the schema"


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
    no_halucinated_tables_test(
        test_case_specs.expected_tables, sql_details.tables, schema
    )

    # 4. No column-table mismatches - does the SQL query reference any columns that are not in the schema?

    # 5. No halucinated columns - does the SQL query reference any columns that are not in the schema?

    # 6. Syntax check - does the query actually run?

    # 7. Correct data - does the SQL query return the correct data?
