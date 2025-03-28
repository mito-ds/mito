import os
import pandas
import pytest

from mito_sql_cell.magic import DEFAULT_VARIABLE_NAME


def get_snowflake_credentials() -> dict[str, str] | None:
    username = os.environ.get("SNOWFLAKE_USERNAME", "None")
    password = os.environ.get("SNOWFLAKE_PASSWORD", "None")
    account = os.environ.get("SNOWFLAKE_ACCOUNT", "None")

    if username == "None" or password == "None" or account == "None":
        return None

    return {"username": username, "password": password, "account": account}


def test_basic_magic(ipython_shell):
    r = ipython_shell.run_cell_magic("sql", "db", "SELECT * FROM repositories")

    assert isinstance(r, pandas.DataFrame)
    assert len(r) == 5

    assert DEFAULT_VARIABLE_NAME in ipython_shell.user_ns
    assert ipython_shell.user_ns[DEFAULT_VARIABLE_NAME] is r


@pytest.mark.parametrize("option", ["-o", "--out"])
def test_magic_custom_out(ipython_shell, option):
    VARIABLE_NAME = "dfsql"

    r = ipython_shell.run_cell_magic(
        "sql", f"{option} {VARIABLE_NAME} db", "SELECT * FROM repositories"
    )

    assert VARIABLE_NAME in ipython_shell.user_ns
    assert ipython_shell.user_ns[VARIABLE_NAME] is r


@pytest.mark.parametrize("option", ["-c", "--configfile"])
def test_magic_custom_config(tmp_path, ipython_shell, sqlite_db, option):
    CONFIG_FILE = tmp_path / "custom_db.ini"
    CONFIG_FILE.write_text(f"""[fake]
database = {sqlite_db.absolute()!s}
driver = sqlite
""")

    r = ipython_shell.run_cell_magic(
        "sql", f'{option} "{CONFIG_FILE.absolute()!s}" fake', "SELECT * FROM profiles"
    )

    assert isinstance(r, pandas.DataFrame)
    assert len(r) == 20


def test_snowflake_connection(tmp_path, ipython_shell):
    snowflake = get_snowflake_credentials()
    if snowflake is None:
        pytest.skip("No Snowflake credentials found")

    CONFIG_FILE = tmp_path / "snowflake.ini"
    CONFIG_FILE.write_text(f"""[snowflake]
driver = snowflake
user = {snowflake["username"]}
password = {snowflake["password"]}
account = {snowflake["account"]}
""")

    r = ipython_shell.run_cell_magic(
        "sql",
        f'-c "{CONFIG_FILE.absolute()!s}" snowflake',
        "SELECT * FROM PYTESTDATABASE.PYTESTSCHEMA.SIMPLE_PYTEST_TABLE",
    )

    assert isinstance(r, pandas.DataFrame)
    assert len(r) == 3
