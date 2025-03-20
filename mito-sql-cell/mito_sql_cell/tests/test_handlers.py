import json
from pathlib import Path

import pytest


@pytest.fixture
def jp_argv(config_file):
    """Allows tests to setup specific argv values."""
    # This is a trick to load the fixture config_file
    # before spinning up the Jupyter Server by modifying
    # Jupyter Server fixtures so that
    # the mocked config file is available to the server.
    return []


async def test_get_connections(jp_fetch, config_file):
    # If
    config_file.write_text("""[sqlite]
database = gh.sqlite
driver = sqlite

[snowflake]
username = johnsmith
password = unbreakable12345
account = john-smith-account
warehouse = warehouse-us-west
role = analyst
driver = snowflake
""")

    # When
    response = await jp_fetch("mito-sql-cell", "databases")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "connections": [
            {
                "name": "sqlite",
                "database": "gh.sqlite",
                "driver": "sqlite",
            },
            {
                "name": "snowflake",
                "username": "johnsmith",
                "password": "unbreakable12345",
                "account": "john-smith-account",
                "warehouse": "warehouse-us-west",
                "role": "analyst",
                "driver": "snowflake",
            },
        ],
        "configurationFile": str(config_file),
    }


async def test_post_connection(jp_fetch, config_file):
    # When
    response = await jp_fetch(
        "mito-sql-cell",
        "databases",
        method="POST",
        body=json.dumps(
            {
                "connectionName": "stars",
                "database": "starts.db",
                "driver": "sqlite",
            }
        ),
    )

    # Then
    assert response.code == 201
    assert (
        config_file.read_text()
        == f"""[db]
database = {Path(__file__).parent / "gh.sqlite"!s}
driver = sqlite

[stars]
database = starts.db
driver = sqlite

"""
    )


async def test_get_connection(jp_fetch, config_file):
    response = await jp_fetch("mito-sql-cell", "databases", "db")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "connectionName": "db",
        "database": str(Path(__file__).parent / "gh.sqlite"),
        "driver": "sqlite",
    }


async def test_delete_connection(jp_fetch, config_file):
    config_file.write_text("""[sqlite]
database = gh.sqlite
driver = sqlite

[snowflake]
username = johnsmith
password = unbreakable12345
account = john-smith-account
warehouse = warehouse-us-west
role = analyst
driver = snowflake
""")

    response = await jp_fetch("mito-sql-cell", "databases", "sqlite", method="DELETE")

    assert response.code == 204
    assert (
        config_file.read_text()
        == """[snowflake]
username = johnsmith
password = unbreakable12345
account = john-smith-account
warehouse = warehouse-us-west
role = analyst
driver = snowflake

"""
    )


async def test_patch_connection(jp_fetch, config_file):
    config_file.write_text("""[sqlite]
database = gh.sqlite
driver = sqlite

[snowflake]
username = johnsmith
password = unbreakable12345
account = john-smith-account
driver = snowflake
""")

    response = await jp_fetch(
        "mito-sql-cell",
        "databases",
        "snowflake",
        method="PATCH",
        body=json.dumps(
            {
                "username": "maryjane",
                "warehouse": "warehouse-us-west",
                "role": "analyst",
            }
        ),
    )

    assert response.code == 200
    assert (
        config_file.read_text()
        == """[sqlite]
database = gh.sqlite
driver = sqlite

[snowflake]
username = maryjane
password = unbreakable12345
account = john-smith-account
driver = snowflake
warehouse = warehouse-us-west
role = analyst

"""
    )
