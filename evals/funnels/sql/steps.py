import inspect
from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class FunnelStepResult:
    name: str
    passed: bool
    notes: Optional[str] = None


def sql_generated_test(
    expected_output: str | None,
    sql_query_recieved: str | None,
) -> FunnelStepResult:
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
    name = "sql_generated_test"

    if (expected_output is None) and (sql_query_recieved is None):
        # No SQL query was expected and none was generated
        return FunnelStepResult(name=name, passed=True)
    elif (expected_output is not None) and (sql_query_recieved is not None):
        # A SQL query was expected and one was generated
        return FunnelStepResult(name=name, passed=True)
    else:
        return FunnelStepResult(
            name=name,
            passed=False,
            notes="SQL query was not generated when it was expected, or generated when it was not expected",
        )


def correct_tables_test(
    expected_tables: List[str],
    tables_in_query: List[str],
) -> FunnelStepResult:
    """
    Verifies that all expected tables are present in the generated SQL query.

    Args:
        expected_tables: List of table names that should be used in the query
        tables_in_query: List of table names actually found in the generated SQL query

    Raises:
        AssertionError: If any expected table is missing from the query
    """
    name = "correct_tables_test"

    for expected_table in expected_tables:
        if expected_table not in tables_in_query:
            return FunnelStepResult(
                name=name,
                passed=False,
                notes=f"Expected table '{expected_table}' not found in query",
            )

    return FunnelStepResult(name=name, passed=True)


def no_table_halucinations_test(
    expected_tables: List[str],
    tables_in_query: List[str],
    schema: Dict[str, Any],
) -> FunnelStepResult:
    """
    Verifies that no tables in the query are hallucinated (i.e. don't exist in the schema).

    Args:
        expected_tables: List of table names that should be used in the query
        tables_in_query: List of table names found in the generated SQL query
        schema: The database schema containing all valid tables and their columns

    Raises:
        AssertionError: If any hallucinated tables are found in the query
    """
    name = "no_table_halucinations_test"

    if len(expected_tables) == 0 and len(tables_in_query) == 0:
        # No tables expected, no tables generated.
        return FunnelStepResult(name=name, passed=True)

    # We want to check if each of these tables exist in the schema
    for table_path in tables_in_query:
        # When working with Snowflake, the table path is in the format:
        # database_name.schema_name.table_name
        database_name, schema_name, table_name = table_path.split(".")

        # Check if database exists
        if database_name not in schema:
            return FunnelStepResult(
                name=name,
                passed=False,
                notes=f"Database '{database_name}' does not exist in schema",
            )

        # Check if schema exists within database
        if schema_name not in schema[database_name]:
            return FunnelStepResult(
                name=name,
                passed=False,
                notes=f"Schema '{schema_name}' does not exist in database '{database_name}'",
            )

        # Check if table exists within schema
        if table_name not in schema[database_name][schema_name]:
            return FunnelStepResult(
                name=name,
                passed=False,
                notes=f"Table '{table_name}' does not exist in schema '{schema_name}' of database '{database_name}'",
            )

    return FunnelStepResult(name=name, passed=True)


def no_column_table_mismatch_test(
    columns_in_query: List[str],
    tables_in_query: List[str],
    schema: Dict[str, Any],
) -> None:
    """
    Verifies that all columns referenced in the query exist in their respective tables.

    Args:
        columns_in_query: List of column names referenced in the query
        tables_in_query: List of table paths (can be just table name or database.schema.table)
        schema: The database schema containing all valid tables and their columns

    Raises:
        AssertionError: If any column referenced in the query doesn't exist in any of the referenced tables
    """
    # If there are no columns or tables in the query, there's nothing to check
    if not columns_in_query or not tables_in_query:
        return

    # For each column, check if it exists in any of the referenced tables
    for column_name in columns_in_query:
        # Skip wildcard columns
        if column_name == "*":
            continue

        column_found = False
        for table_path in tables_in_query:
            # Split the path into components
            path_parts = table_path.split(".")

            # Handle different path formats
            if len(path_parts) == 1:
                # Just table name - search through all schemas
                table_name = path_parts[0]
                for database in schema.values():
                    for schema_name, tables in database.items():
                        if table_name in tables and column_name in tables[table_name]:
                            column_found = True
                            break
                    if column_found:
                        break
            elif len(path_parts) == 3:
                # Full path: database.schema.table
                database_name, schema_name, table_name = path_parts
                if (
                    database_name in schema
                    and schema_name in schema[database_name]
                    and table_name in schema[database_name][schema_name]
                    and column_name in schema[database_name][schema_name][table_name]
                ):
                    column_found = True
            else:
                # Unsupported path format
                continue

            if column_found:
                break

        assert (
            column_found
        ), f"Column '{column_name}' does not exist in any of the referenced tables"


def no_column_halucinations_test():
    pass
