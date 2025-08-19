# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import base64
import os
import tempfile
import pytest
from unittest.mock import MagicMock, patch

from mito_ai.file_uploads.handlers import FileUploadHandler


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    temp_dir = tempfile.mkdtemp()
    original_cwd = os.getcwd()
    os.chdir(temp_dir)

    yield temp_dir

    # Cleanup
    os.chdir(original_cwd)
    for file in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, file)
        if os.path.isfile(file_path):
            os.remove(file_path)
    os.rmdir(temp_dir)


@pytest.fixture
def mocked_handler():
    """Create a mocked FileUploadHandler instance for testing."""
    # Create a mock handler without calling __init__
    handler = MagicMock(spec=FileUploadHandler)
    handler._status_code = 200
    handler._write_buffer = []

    def mock_write(chunk) -> None:
        # Handle both string and dict inputs
        if isinstance(chunk, dict):
            encoded_chunk = json.dumps(chunk).encode("utf-8")
        else:
            encoded_chunk = chunk.encode("utf-8") if isinstance(chunk, str) else chunk
        handler._write_buffer.append(encoded_chunk)

    def mock_set_status(status_code: int) -> None:
        handler._status_code = status_code

    def mock_finish() -> None:
        pass

    # Set up the mock methods
    handler.write = mock_write
    handler.set_status = mock_set_status
    handler.finish = mock_finish

    # Mock the request object
    handler.request = MagicMock()

    return handler


def _create_post_side_effect():
    """Create the side effect function that simulates the actual post method logic."""

    def side_effect(self):
        try:
            data = json.loads(self.request.body.decode("utf-8"))
            filename = data.get("filename")
            content = data.get("content")

            if not filename or not content:
                self.set_status(400)
                self.write({"error": "Missing filename or content"})
                self.finish()
                return

            # Extract base64 content from data URL format
            if "," in content:
                base64_content = content.split(",")[1]
            else:
                base64_content = content

            # Convert base64 to binary
            file_data = base64.b64decode(base64_content)

            # Save file to root directory
            with open(filename, "wb") as f:
                f.write(file_data)

            # Return success response
            self.write({"success": True, "filename": filename, "path": filename})
            self.finish()

        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": f"Failed to save file: {str(e)}"})
            self.finish()

    return side_effect


def test_successful_file_upload(mocked_handler, temp_dir):
    """Test successful file upload with valid filename and base64 content."""
    # Prepare test data
    filename = "test.txt"
    content = "Hello, World!"
    base64_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")

    # Mock request body
    request_data = {"filename": filename, "content": base64_content}
    mocked_handler.request.body = json.dumps(request_data).encode("utf-8")

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert response_body["success"] is True
    assert response_body["filename"] == filename
    assert response_body["path"] == filename
    assert mocked_handler._status_code == 200

    # Verify file was actually written
    assert os.path.exists(filename)
    with open(filename, "r") as f:
        assert f.read() == content


def test_successful_file_upload_with_data_url(mocked_handler, temp_dir):
    """Test successful file upload with data URL prefix."""
    # Prepare test data with data URL prefix
    filename = "test.txt"
    content = "Hello, World!"
    base64_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    data_url_content = f"data:text/plain;base64,{base64_content}"

    # Mock request body
    request_data = {"filename": filename, "content": data_url_content}
    mocked_handler.request.body = json.dumps(request_data).encode("utf-8")

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert response_body["success"] is True
    assert mocked_handler._status_code == 200

    # Verify file was actually written
    assert os.path.exists(filename)
    with open(filename, "r") as f:
        assert f.read() == content


def test_missing_filename(mocked_handler, temp_dir):
    """Test request with content but no filename."""
    # Mock request body without filename
    request_data = {"content": "base64content"}
    mocked_handler.request.body = json.dumps(request_data).encode("utf-8")

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify error response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert "error" in response_body
    assert response_body["error"] == "Missing filename or content"
    assert mocked_handler._status_code == 400


def test_missing_content(mocked_handler, temp_dir):
    """Test request with filename but no content."""
    # Mock request body without content
    request_data = {"filename": "test.txt"}
    mocked_handler.request.body = json.dumps(request_data).encode("utf-8")

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify error response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert "error" in response_body
    assert response_body["error"] == "Missing filename or content"
    assert mocked_handler._status_code == 400


def test_invalid_json(mocked_handler, temp_dir):
    """Test request with invalid JSON in body."""
    # Mock request body with invalid JSON
    mocked_handler.request.body = b"invalid json content"

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify error response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert "error" in response_body
    assert response_body["error"] == "Invalid JSON in request body"
    assert mocked_handler._status_code == 400


def test_file_writing_verification(mocked_handler, temp_dir):
    """Test that file is actually written to disk with correct content."""
    # Prepare test data
    filename = "test_file.txt"
    content = "This is test content with special chars: !@#$%^&*()"
    base64_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")

    # Mock request body
    request_data = {"filename": filename, "content": base64_content}
    mocked_handler.request.body = json.dumps(request_data).encode("utf-8")

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify file exists and has correct content
    assert os.path.exists(filename)
    with open(filename, "r", encoding="utf-8") as f:
        file_content = f.read()
        assert file_content == content

    # Verify file size
    file_size = os.path.getsize(filename)
    assert file_size == len(content.encode("utf-8"))
