from pathlib import Path

from mito_sql_cell.connections import MitoConnectorManager


def test_read_configuration_file(config_file):
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
    manager = MitoConnectorManager(str(config_file))

    # Test __len__
    assert len(manager) == 2
    # Test __iter__
    assert list(manager) == ["sqlite", "snowflake"]

    # Test __contains__
    assert "sqlite" in manager
    assert "snowflake" in manager

    # Test __getitem__
    sqlite = manager["sqlite"]
    assert sqlite["database"] == "gh.sqlite"
    assert sqlite["driver"] == "sqlite"

    snowflake = manager["snowflake"]
    assert snowflake["username"] == "johnsmith"
    assert snowflake["password"] == "unbreakable12345"
    assert snowflake["account"] == "john-smith-account"
    assert snowflake["warehouse"] == "warehouse-us-west"
    assert snowflake["role"] == "analyst"
    assert snowflake["driver"] == "snowflake"


def test_configuration_file_serialize(config_file):
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
    manager = MitoConnectorManager(str(config_file))

    assert manager.serialize() == [
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
    ]


def test_configuration_file_set(config_file):
    manager = MitoConnectorManager(str(config_file))

    # Test __setitem__
    manager["snowflake"] = {
        "username": "johnsmith",
        "password": "unbreakable12345",
        "account": "john-smith-account",
        "warehouse": "warehouse-us-west",
        "role": "analyst",
        "driver": "snowflake",
    }

    assert (
        config_file.read_text()
        == f"""[db]
database = {Path(__file__).parent / "gh.sqlite"!s}
driver = sqlite

[snowflake]
username = johnsmith
password = unbreakable12345
account = john-smith-account
warehouse = warehouse-us-west
role = analyst
driver = snowflake

"""
    )


def test_configuration_file_del(config_file):
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
    manager = MitoConnectorManager(str(config_file))

    del manager["snowflake"]

    assert (
        config_file.read_text()
        == """[sqlite]
database = gh.sqlite
driver = sqlite

"""
    )
