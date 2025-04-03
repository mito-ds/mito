import pytest

pytest_plugins = ("pytest_jupyter.jupyter_server", )


@pytest.fixture
def jp_server_config(jp_server_config):
    return {"ServerApp": {"jpserver_extensions": {"mito_sql_cell": True}}}
