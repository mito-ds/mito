import pytest
import requests
from jupyter_server.serverapp import ServerApp
from traitlets.config import Config
import threading
import time

TOKEN = "test-token"


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


def test_get_connections_with_no_auth(jp_base_url):
    response = requests.get(jp_base_url + "/mito-ai/db/connections")
    assert response.status_code == 403  # Forbidden


def test_get_connections_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


def test_get_connections_with_auth(jp_base_url):
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
