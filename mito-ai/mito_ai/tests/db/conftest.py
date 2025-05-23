import os
import json
import pytest
import shutil
import threading
import time
from jupyter_server.serverapp import ServerApp
from traitlets.config import Config
from mito_ai.tests.db.test_db_constants import (
    TOKEN,
    DB_DIR_PATH,
    CONNECTIONS_PATH,
    BACKUP_DB_DIR_PATH,
)


@pytest.fixture(scope="module", autouse=True)
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
