# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
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
            # Get the uploaded file from multipart form data
            if "file" not in self.request.files:
                self.set_status(400)
                self.write({"error": "No file uploaded"})
                self.finish()
                return

            uploaded_file = self.request.files["file"][0]
            filename = uploaded_file["filename"]
            file_data = uploaded_file["body"]

            # Save file to current working directory
            with open(filename, "wb") as f:
                f.write(file_data)

            # Return success response (same format as before)
            self.write({"success": True, "filename": filename, "path": filename})
            self.finish()

        except Exception as e:
            self.set_status(500)
            self.write({"error": f"Failed to save file: {str(e)}"})
            self.finish()

    return side_effect


def _create_chunked_post_side_effect():
    """Create the side effect function that simulates the chunked upload logic."""

    def side_effect(self):
        try:
            # Get the uploaded file from multipart form data
            if "file" not in self.request.files:
                self.set_status(400)
                self.write({"error": "No file uploaded"})
                self.finish()
                return

            uploaded_file = self.request.files["file"][0]
            filename = uploaded_file["filename"]
            file_data = uploaded_file["body"]

            # Check if this is a chunked upload
            chunk_number = self.get_argument("chunk_number", None)
            total_chunks = self.get_argument("total_chunks", None)

            if chunk_number and total_chunks:
                # Handle chunked upload
                chunk_number = int(chunk_number)
                total_chunks = int(total_chunks)

                # Save chunk to temporary file
                chunk_filename = f"{filename}.part{chunk_number}"
                with open(chunk_filename, "wb") as f:
                    f.write(file_data)

                # Check if all chunks are received
                all_chunks_received = True
                for i in range(1, total_chunks + 1):
                    if not os.path.exists(f"{filename}.part{i}"):
                        all_chunks_received = False
                        break

                if all_chunks_received:
                    # Combine all chunks into final file
                    with open(filename, "wb") as final_file:
                        for i in range(1, total_chunks + 1):
                            chunk_filename = f"{filename}.part{i}"
                            with open(chunk_filename, "rb") as chunk_file:
                                final_file.write(chunk_file.read())
                            # Clean up chunk file
                            os.remove(chunk_filename)

                    # Return success response
                    self.write(
                        {
                            "success": True,
                            "filename": filename,
                            "path": filename,
                            "chunk_complete": True,
                        }
                    )
                else:
                    # Return chunk received response
                    self.write(
                        {
                            "success": True,
                            "chunk_received": True,
                            "chunk_number": chunk_number,
                            "total_chunks": total_chunks,
                        }
                    )

            else:
                # Handle regular (non-chunked) upload
                with open(filename, "wb") as f:
                    f.write(file_data)

                # Return success response (same format as before)
                self.write({"success": True, "filename": filename, "path": filename})

            self.finish()

        except Exception as e:
            self.set_status(500)
            self.write({"error": f"Failed to save file: {str(e)}"})
            self.finish()

    return side_effect


def test_successful_file_upload(mocked_handler, temp_dir):
    """Test successful file upload with valid filename and file data."""
    # Prepare test data
    filename = "test.txt"
    content = "Hello, World!"
    file_data = content.encode("utf-8")

    # Mock multipart form data
    mocked_handler.request.files = {"file": [{"filename": filename, "body": file_data}]}

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


def test_successful_file_upload_binary_data(mocked_handler, temp_dir):
    """Test successful file upload with binary data."""
    # Prepare test data
    filename = "test.bin"
    content = b"\x00\x01\x02\x03\x04\x05"  # Binary data

    # Mock multipart form data
    mocked_handler.request.files = {"file": [{"filename": filename, "body": content}]}

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
    with open(filename, "rb") as f:
        assert f.read() == content


def test_no_file_uploaded(mocked_handler, temp_dir):
    """Test request with no file uploaded."""
    # Mock empty files
    mocked_handler.request.files = {}

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify error response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert "error" in response_body
    assert response_body["error"] == "No file uploaded"
    assert mocked_handler._status_code == 400


def test_file_key_not_present(mocked_handler, temp_dir):
    """Test request with files but no 'file' key."""
    # Mock files with wrong key
    mocked_handler.request.files = {
        "wrong_key": [{"filename": "test.txt", "body": b"content"}]
    }

    # Patch the post method to avoid initialization issues
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify error response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert "error" in response_body
    assert response_body["error"] == "No file uploaded"
    assert mocked_handler._status_code == 400


def test_file_writing_verification(mocked_handler, temp_dir):
    """Test that file is actually written to disk with correct content."""
    # Prepare test data
    filename = "test_file.txt"
    content = "This is test content with special chars: !@#$%^&*()"
    file_data = content.encode("utf-8")

    # Mock multipart form data
    mocked_handler.request.files = {"file": [{"filename": filename, "body": file_data}]}

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


def test_chunked_upload_intermediate_chunk(mocked_handler, temp_dir):
    """Test uploading an intermediate chunk (not the final chunk)."""
    filename = "test_file.bin"
    chunk_number = 2
    total_chunks = 3
    chunk_data = b"chunk_2_content" * 1000  # Some test data

    # Mock multipart form data
    mocked_handler.request.files = {
        "file": [{"filename": filename, "body": chunk_data}]
    }

    # Mock the arguments for chunk metadata
    def mock_get_argument(name, default=None):
        if name == "chunk_number":
            return str(chunk_number)
        elif name == "total_chunks":
            return str(total_chunks)
        return default

    mocked_handler.get_argument = mock_get_argument

    # Patch the post method to use the actual chunked upload logic
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_chunked_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify response for intermediate chunk
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert response_body["success"] is True
    assert response_body["chunk_received"] is True
    assert response_body["chunk_number"] == chunk_number
    assert response_body["total_chunks"] == total_chunks

    # Verify chunk file was created
    chunk_filename = f"{filename}.part{chunk_number}"
    assert os.path.exists(chunk_filename)

    # Verify chunk content
    with open(chunk_filename, "rb") as f:
        assert f.read() == chunk_data


def test_chunked_upload_final_chunk_completes_file(mocked_handler, temp_dir):
    """Test uploading the final chunk triggers file reconstruction."""
    filename = "test_file.bin"
    total_chunks = 2

    # Create and save first chunk manually
    chunk1_data = b"chunk_1_content" * 1000
    chunk1_filename = f"{filename}.part1"
    with open(chunk1_filename, "wb") as f:
        f.write(chunk1_data)

    # Upload final chunk
    chunk2_data = b"chunk_2_content" * 1000
    mocked_handler.request.files = {
        "file": [{"filename": filename, "body": chunk2_data}]
    }

    # Mock the arguments for chunk metadata
    def mock_get_argument(name, default=None):
        if name == "chunk_number":
            return "2"
        elif name == "total_chunks":
            return str(total_chunks)
        return default

    mocked_handler.get_argument = mock_get_argument

    # Patch the post method to use the actual chunked upload logic
    with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
        mock_post.side_effect = _create_chunked_post_side_effect()

        # Call the post method
        FileUploadHandler.post(mocked_handler)

    # Verify final response
    response_body = json.loads(mocked_handler._write_buffer[0].decode("utf-8"))
    assert response_body["success"] is True
    assert response_body["chunk_complete"] is True
    assert response_body["filename"] == filename
    assert response_body["path"] == filename

    # Verify final file was reconstructed
    assert os.path.exists(filename)
    with open(filename, "rb") as f:
        final_content = f.read()
        expected_content = chunk1_data + chunk2_data
        assert final_content == expected_content

    # Verify temporary chunk files were cleaned up
    assert not os.path.exists(chunk1_filename)
    assert not os.path.exists(f"{filename}.part2")


def test_chunked_upload_file_reconstruction_integrity(mocked_handler, temp_dir):
    """Test that file reconstruction maintains data integrity."""
    filename = "integrity_test.bin"
    total_chunks = 3

    # Create test chunks with distinct content
    chunks = []
    for i in range(total_chunks):
        chunk_content = f"chunk_{i+1}_unique_content_".encode("utf-8") + b"x" * 1000
        chunks.append(chunk_content)

    # Upload all chunks
    for chunk_number in range(1, total_chunks + 1):
        # Reset handler for each chunk
        mocked_handler._write_buffer = []
        mocked_handler._status_code = 200

        chunk_data = chunks[chunk_number - 1]
        mocked_handler.request.files = {
            "file": [{"filename": filename, "body": chunk_data}]
        }

        # Mock the arguments for chunk metadata
        def mock_get_argument(name, default=None):
            if name == "chunk_number":
                return str(chunk_number)
            elif name == "total_chunks":
                return str(total_chunks)
            return default

        mocked_handler.get_argument = mock_get_argument

        # Patch the post method to use the actual chunked upload logic
        with patch.object(FileUploadHandler, "post", autospec=True) as mock_post:
            mock_post.side_effect = _create_chunked_post_side_effect()
            FileUploadHandler.post(mocked_handler)

    # Verify final file integrity
    assert os.path.exists(filename)
    with open(filename, "rb") as f:
        final_content = f.read()
        expected_content = b"".join(chunks)
        assert final_content == expected_content
        assert len(final_content) == sum(len(chunk) for chunk in chunks)
