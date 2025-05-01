from evals.eval_types import SQLTestCase, SQLDetails


def sql_generated_test(expected_output, sql_query_recieved):
    """
    This is the first funnel. It checks if the AI generated a SQL query.

    Note that if the expected output is None, then the AI is not expected to generate a SQL query.
    In this case, we want to make sure the sql_query_recieved is also None.
    """
    if expected_output is None:
        assert sql_query_recieved is None
    else:
        assert sql_query_recieved is not None


def correct_tables_test(expected_tables, tables_in_query):
    """
    We want to make sure that the AI selects the correct tables.
    """
    for table in expected_tables:
        assert table in tables_in_query


def test_funnel(
    test_case_specs: SQLTestCase,
    sql_details: SQLDetails,
):
    """
    This is the default funnel entry point. It takes two arguments:

    1. `test_case_specs` - outline of the expected tables, columns, etc
    2. `sql_details` - the acutal query + some extracted metadata

    It then uses a series of "funnels" to compare the two and determine if the SQL is correct.
    """
    print(sql_details)

    # 1. SQL generated
    sql_generated_test(test_case_specs.expected_output, sql_details.query)

    # 2. Tables - does the SQL query use the correct tables?
    correct_tables_test(test_case_specs.expected_tables, sql_details.tables)
