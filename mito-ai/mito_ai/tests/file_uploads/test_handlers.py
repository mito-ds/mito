# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
import pytest
from unittest.mock import Mock, patch
import tornado.web
from tornado.httputil import HTTPServerRequest
from tornado.web import Application

from mito_ai.file_uploads.handlers import FileUploadHandler


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    temp_dir = tempfile.mkdtemp()
    original_cwd = os.getcwd()
    os.chdir(temp_dir)
    yield temp_dir
    os.chdir(original_cwd)
    # Clean up temporary files
    for file in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, file))
    os.rmdir(temp_dir)


@pytest.fixture
def handler():
    """Create a FileUploadHandler instance for testing."""
    app = Application()
    request = HTTPServerRequest(method="POST", uri="/upload")

    # Mock the connection to avoid Tornado's assertion
    request.connection = Mock()

    handler = FileUploadHandler(app, request)

    # Mock methods properly to avoid mypy errors
    handler.write = Mock()  # type: ignore
    handler.finish = Mock()  # type: ignore
    handler.set_status = Mock()  # type: ignore
    handler.get_argument = Mock()  # type: ignore

    # Mock authentication for Jupyter server
    handler._jupyter_current_user = "test_user"  # type: ignore

    return handler


def test_validate_file_upload_success(handler):
    """Test successful file upload validation."""
    handler.request.files = {"file": [Mock(filename="test.csv", body=b"data")]}  # type: ignore
    result = handler._validate_file_upload()
    assert result is True


def test_validate_file_upload_failure(handler):
    """Test file upload validation when no file is present."""
    handler.request.files = {}  # type: ignore
    result = handler._validate_file_upload()
    assert result is False
    handler.set_status.assert_called_with(400)


def test_regular_upload_success(handler, temp_dir):
    """Test successful regular (non-chunked) file upload."""
    filename = "test.csv"
    file_data = b"test,data\n1,2"
    notebook_dir = temp_dir

    handler._handle_regular_upload(filename, file_data, notebook_dir)

    # Verify file was written
    file_path = os.path.join(notebook_dir, filename)
    with open(file_path, "rb") as f:
        content = f.read()
    assert content == file_data

    # Verify response
    handler.write.assert_called_with(
        {"success": True, "filename": filename, "path": file_path}
    )


def test_chunked_upload_first_chunk(handler, temp_dir):
    """Test handling first chunk of a chunked upload."""
    filename = "large_file.csv"
    file_data = b"chunk1_data"
    chunk_number = "1"
    total_chunks = "3"
    notebook_dir = temp_dir

    handler._handle_chunked_upload(
        filename, file_data, chunk_number, total_chunks, notebook_dir
    )

    # Verify chunk was saved (check temp dir structure)
    assert filename in handler._temp_dirs
    temp_dir_path = handler._temp_dirs[filename]["temp_dir"]
    chunk_file = os.path.join(temp_dir_path, "chunk_1")
    assert os.path.exists(chunk_file)

    # Verify response indicates chunk received but not complete
    handler.write.assert_called_with(
        {
            "success": True,
            "chunk_received": True,
            "chunk_number": 1,
            "total_chunks": 3,
        }
    )


def test_chunked_upload_completion(handler, temp_dir):
    """Test completing a chunked upload when all chunks are received."""
    filename = "large_file.csv"
    total_chunks = 2
    notebook_dir = temp_dir

    # Process first chunk
    handler._handle_chunked_upload(
        filename, b"chunk1_data", "1", str(total_chunks), notebook_dir
    )

    # Process final chunk
    handler._handle_chunked_upload(
        filename, b"chunk2_data", "2", str(total_chunks), notebook_dir
    )

    # Verify final file was created
    file_path = os.path.join(notebook_dir, filename)
    assert os.path.exists(file_path)
    with open(file_path, "rb") as f:
        content = f.read()
    assert content == b"chunk1_datachunk2_data"

    # Verify temp dir was cleaned up
    assert filename not in handler._temp_dirs

    # Verify completion response
    handler.write.assert_called_with(
        {
            "success": True,
            "filename": filename,
            "path": file_path,
            "chunk_complete": True,
        }
    )


def test_error_handling(handler):
    """Test error handling in upload process."""
    error_message = "Test error message"
    status_code = 500

    handler._handle_error(error_message, status_code)

    handler.set_status.assert_called_with(status_code)
    handler.write.assert_called_with({"error": error_message})
    handler.finish.assert_called_once()


@patch("mito_ai.file_uploads.handlers.FileUploadHandler._validate_file_upload")
def test_post_method_regular_upload(mock_validate, handler):
    """Test POST method for regular upload."""
    mock_validate.return_value = True
    handler.request.files = {"file": [Mock(filename="test.csv", body=b"data")]}  # type: ignore
    handler.get_argument.return_value = None  # No chunk parameters

    handler.post()

    mock_validate.assert_called_once()
    handler.finish.assert_called_once()


@patch("mito_ai.file_uploads.handlers.FileUploadHandler._validate_file_upload")
def test_post_method_chunked_upload(mock_validate, handler):
    """Test POST method for chunked upload."""
    mock_validate.return_value = True
    handler.request.files = {"file": [Mock(filename="test.csv", body=b"data")]}  # type: ignore
    handler.get_argument.side_effect = lambda name, default=None: {
        "chunk_number": "1",
        "total_chunks": "3",
    }.get(name, default)

    handler.post()

    mock_validate.assert_called_once()
    handler.finish.assert_called_once()


def test_are_all_chunks_received_true(handler, temp_dir):
    """Test that all chunks are detected when present."""
    filename = "test.csv"
    total_chunks = 2

    # Manually set up the temp dir structure
    temp_dir_path = tempfile.mkdtemp(prefix=f"mito_upload_{filename}_")
    handler._temp_dirs[filename] = {
        "temp_dir": temp_dir_path,
        "total_chunks": total_chunks,
        "received_chunks": {1, 2},
    }

    result = handler._are_all_chunks_received(filename, total_chunks)
    assert result is True

    # Clean up
    import shutil

    shutil.rmtree(temp_dir_path)


def test_are_all_chunks_received_false(handler, temp_dir):
    """Test that missing chunks are detected."""
    filename = "test.csv"
    total_chunks = 2

    # Manually set up the temp dir structure with only one chunk
    temp_dir_path = tempfile.mkdtemp(prefix=f"mito_upload_{filename}_")
    handler._temp_dirs[filename] = {
        "temp_dir": temp_dir_path,
        "total_chunks": total_chunks,
        "received_chunks": {1},  # Only chunk 1 received
    }

    result = handler._are_all_chunks_received(filename, total_chunks)
    assert result is False

    # Clean up
    import shutil

    shutil.rmtree(temp_dir_path)


def test_save_chunk(handler, temp_dir):
    """Test saving individual chunks."""
    filename = "test.csv"
    file_data = b"chunk_data"
    chunk_number = 1
    total_chunks = 3

    # Mock the file operations to avoid filesystem issues
    with patch("builtins.open", create=True) as mock_open:
        mock_file = Mock()
        mock_open.return_value.__enter__.return_value = mock_file

        handler._save_chunk(filename, file_data, chunk_number, total_chunks)

        # Verify temp dir was created in the handler's tracking
        assert filename in handler._temp_dirs
        temp_dir_path = handler._temp_dirs[filename]["temp_dir"]

        # Verify the expected chunk filename was used
        expected_chunk_filename = os.path.join(temp_dir_path, f"chunk_{chunk_number}")
        mock_open.assert_called_with(expected_chunk_filename, "wb")

        # Verify file data was written
        mock_file.write.assert_called_with(file_data)

        # Verify chunk was marked as received
        assert chunk_number in handler._temp_dirs[filename]["received_chunks"]

        # Clean up
        del handler._temp_dirs[filename]


def test_image_size_limit_exceeded(handler, temp_dir):
    """Test that image uploads exceeding 3MB are rejected."""
    filename = "large_image.jpg"
    # Create 5MB of data (5 * 1024 * 1024 bytes)
    file_data = b"x" * (5 * 1024 * 1024)
    notebook_dir = temp_dir

    # The _handle_regular_upload should raise a ValueError for oversized images
    with pytest.raises(ValueError) as exc_info:
        handler._handle_regular_upload(filename, file_data, notebook_dir)
    
    # Verify the error message mentions the size limit
    assert "exceeded 3MB limit" in str(exc_info.value)
