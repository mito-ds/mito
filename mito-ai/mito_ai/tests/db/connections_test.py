import os
import json
import pytest
import requests
import threading
import time
import shutil
from typing import Final
from jupyter_server.serverapp import ServerApp
from traitlets.config import Config
from mito_ai.utils.schema import MITO_FOLDER

TOKEN = "test-token"
DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")
BACKUP_DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db_backup")
CONNECTION_JSON = {
    "type": "snowflake",
    "username": os.environ.get("SNOWFLAKE_USERNAME"),
    "password": os.environ.get("SNOWFLAKE_PASSWORD"),
    "account": os.environ.get("SNOWFLAKE_ACCOUNT"),
    "warehouse": "COMPUTE_WH",
}


@pytest.fixture(scope="session", autouse=True)
def backup_db_folder():
    """Backup the DB folder before tests and restore it after."""
    if os.path.exists(DB_DIR_PATH):
        # Create backup, so we can test with a clean db dir
        shutil.move(DB_DIR_PATH, BACKUP_DB_DIR_PATH)

    yield

    # Cleanup after tests
    if os.path.exists(DB_DIR_PATH):
        shutil.rmtree(DB_DIR_PATH)
    if os.path.exists(BACKUP_DB_DIR_PATH):
        shutil.move(BACKUP_DB_DIR_PATH, DB_DIR_PATH)


@pytest.fixture
def jp_server_config():
    """Configure the Jupyter server for testing."""
    config = Config()
    config.ServerApp.jpserver_extensions = {"mito_ai": True}
    # Disable password requirement for testing
    config.ServerApp.password = ""
    # Set the token for testing
    config.ServerApp.token = TOKEN
    # Enable authentication
    config.ServerApp.allow_unauthenticated_access = False
    return config


@pytest.fixture
def jp_serverapp(jp_server_config, tmp_path):
    """Create a Jupyter server instance for testing."""
    app = ServerApp(config=jp_server_config)
    app.root_dir = str(tmp_path)
    app.initialize(argv=[])

    # Start the server in a non-blocking way
    def start_server():
        app.start()

    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = (
        True  # This ensures the thread will be killed when the main program exits
    )
    server_thread.start()

    # Give the server a moment to start
    time.sleep(1)

    yield app
    app.stop()


@pytest.fixture
def jp_base_url(jp_serverapp):
    """Get the base URL of the Jupyter server."""
    return jp_serverapp.connection_url


@pytest.fixture
def first_connection_id():
    # Manually open the connections.json file and get the first connection ID
    with open(CONNECTIONS_PATH, "r") as f:
        connections = json.load(f)
    # Get the first connection ID from the object keys
    connection_id = next(iter(connections.keys()))
    return connection_id


# --- ADD CONNECTION ---


def test_add_connection_with_auth(jp_base_url):
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
        json=CONNECTION_JSON,
    )
    assert response.status_code == 200


def test_add_connection_with_no_auth(jp_base_url):
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        json=CONNECTION_JSON,
    )
    assert response.status_code == 403  # Forbidden


def test_add_connection_with_incorrect_auth(jp_base_url):
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token incorrect-token"},
        json=CONNECTION_JSON,
    )
    assert response.status_code == 403  # Forbidden


# --- GET CONNECTIONS ---


def test_get_connections_with_auth(jp_base_url):
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200


def test_get_connections_with_no_auth(jp_base_url):
    response = requests.get(jp_base_url + "/mito-ai/db/connections")
    assert response.status_code == 403  # Forbidden


def test_get_connections_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- DELETE CONNECTION ---


def test_delete_connection_with_no_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
    )
    assert response.status_code == 403  # Forbidden


def test_delete_connection_with_incorrect_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


def test_delete_connection_with_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
