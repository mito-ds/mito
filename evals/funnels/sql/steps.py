from typing import List, Dict, Any


def sql_generated_test(
    expected_output: str | None,
    sql_query_recieved: str | None,
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


def correct_tables_test(
    expected_tables: List[str],
    tables_in_query: List[str],
):
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


def no_table_halucinations_test(
    expected_tables: List[str],
    tables_in_query: List[str],
    schema: Dict[str, Any],
) -> None:
    """
    Verifies that no tables in the query are hallucinated (i.e. don't exist in the schema).

    Args:
        expected_tables: List of table names that should be used in the query
        tables_in_query: List of table names found in the generated SQL query
        schema: The database schema containing all valid tables and their columns

    Raises:
        AssertionError: If any hallucinated tables are found in the query
    """
    # If there are no expected tables, and no tables in the query,
    # we can assume the AI did what it was supposed to do.
    if len(expected_tables) == 0 and len(tables_in_query) == 0:
        return

    # tables_in_query is a list of strings, each respresenting a path:
    # `database_name.schema_name.table_name`

    # We want to check if each of these tables exist in the schema
    for table_path in tables_in_query:
        # Split the path into database_name, schema_name, and table_name
        database_name, schema_name, table_name = table_path.split(".")

        # Check if database exists
        assert (
            database_name in schema
        ), f"Database '{database_name}' does not exist in schema"

        # Check if schema exists within database
        assert (
            schema_name in schema[database_name]
        ), f"Schema '{schema_name}' does not exist in database '{database_name}'"

        # Check if table exists within schema
        assert (
            table_name in schema[database_name][schema_name]
        ), f"Table '{table_name}' does not exist in schema '{schema_name}' of database '{database_name}'"
