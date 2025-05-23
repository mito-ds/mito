# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import threading
import time
from jupyter_server.serverapp import ServerApp
from traitlets.config import Config

TOKEN = "test-token"

@pytest.fixture
def jp_server_config(token_fixture):
    """Configure the Jupyter server for testing."""
    config = Config()
    config.ServerApp.jpserver_extensions = {"mito_ai": True}
    # Disable password requirement for testing
    config.ServerApp.password = ""
    # Set the token for testing
    config.ServerApp.token = token_fixture
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
    server_thread.daemon = True  # This ensures the thread will be killed when the main program exits
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
def token_fixture():
    return TOKEN
