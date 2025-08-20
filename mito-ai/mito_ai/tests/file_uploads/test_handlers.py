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
    handler.write = Mock()
    handler.finish = Mock()
    handler.set_status = Mock()
    handler.get_argument = Mock()

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

    handler._handle_regular_upload(filename, file_data)

    # Verify file was written
    with open(filename, "rb") as f:
        content = f.read()
    assert content == file_data

    # Verify response
    handler.write.assert_called_with(
        {"success": True, "filename": filename, "path": filename}
    )


def test_chunked_upload_first_chunk(handler, temp_dir):
    """Test handling first chunk of a chunked upload."""
    filename = "large_file.csv"
    file_data = b"chunk1_data"
    chunk_number = "1"
    total_chunks = "3"

    handler._handle_chunked_upload(filename, file_data, chunk_number, total_chunks)

    # Verify chunk file was created
    assert os.path.exists(f"{filename}.part1")

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

    # Create chunk files manually
    with open(f"{filename}.part1", "wb") as f:
        f.write(b"chunk1_data")
    with open(f"{filename}.part2", "wb") as f:
        f.write(b"chunk2_data")

    # Process final chunk
    handler._handle_chunked_upload(filename, b"chunk2_data", "2", str(total_chunks))

    # Verify final file was created
    assert os.path.exists(filename)
    with open(filename, "rb") as f:
        content = f.read()
    assert content == b"chunk1_datachunk2_data"

    # Verify chunk files were cleaned up
    assert not os.path.exists(f"{filename}.part1")
    assert not os.path.exists(f"{filename}.part2")

    # Verify completion response
    handler.write.assert_called_with(
        {
            "success": True,
            "filename": filename,
            "path": filename,
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

    # Create chunk files
    with open(f"{filename}.part1", "wb") as f:
        f.write(b"chunk1")
    with open(f"{filename}.part2", "wb") as f:
        f.write(b"chunk2")

    result = handler._are_all_chunks_received(filename, total_chunks)
    assert result is True


def test_are_all_chunks_received_false(handler, temp_dir):
    """Test that missing chunks are detected."""
    filename = "test.csv"
    total_chunks = 2

    # Create only one chunk file
    with open(f"{filename}.part1", "wb") as f:
        f.write(b"chunk1")

    result = handler._are_all_chunks_received(filename, total_chunks)
    assert result is False


def test_save_chunk(handler, temp_dir):
    """Test saving individual chunks."""
    filename = "test.csv"
    file_data = b"chunk_data"
    chunk_number = 1

    handler._save_chunk(filename, file_data, chunk_number)

    chunk_filename = f"{filename}.part{chunk_number}"
    assert os.path.exists(chunk_filename)
    with open(chunk_filename, "rb") as f:
        content = f.read()
    assert content == file_data
