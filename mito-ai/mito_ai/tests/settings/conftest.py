import os
import pytest
import shutil
import threading
import time
from jupyter_server.serverapp import ServerApp
from traitlets.config import Config
from test_constants import TOKEN, SETTINGS_PATH, BACKUP_SETTINGS_PATH


@pytest.fixture(scope="module", autouse=True)
def backup_settings_json():
    """Backup the settings.json file before tests and restore it after."""
    if os.path.exists(SETTINGS_PATH):
        # Create backup, so we can test with a clean settings.json file
        shutil.move(SETTINGS_PATH, BACKUP_SETTINGS_PATH)

    yield

    # Cleanup after tests
    if os.path.exists(SETTINGS_PATH):
        os.remove(SETTINGS_PATH)
    if os.path.exists(BACKUP_SETTINGS_PATH):
        shutil.move(BACKUP_SETTINGS_PATH, SETTINGS_PATH)


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
