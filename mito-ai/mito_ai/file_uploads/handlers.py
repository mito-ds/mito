# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
import tornado
from typing import Dict, Any
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.telemetry_utils import (
    log_file_upload_attempt,
    log_file_upload_failure,
)

MAX_IMAGE_SIZE_MB = 3


def _is_image_file(filename: str) -> bool:
    image_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".tiff",
        ".tif",
        ".webp",
        ".svg",
    }
    file_extension = os.path.splitext(filename)[1].lower()
    return file_extension in image_extensions


def _check_image_size_limit(file_data: bytes, filename: str) -> None:
    if not _is_image_file(filename):
        return

    file_size_mb = len(file_data) / (1024 * 1024)  # Convert bytes to MB

    if file_size_mb > MAX_IMAGE_SIZE_MB:
        raise ValueError(f"Image exceeded {MAX_IMAGE_SIZE_MB}MB limit.")


class FileUploadHandler(APIHandler):
    # Class-level dictionary to store temporary directories for each file upload
    # This persists across handler instances since Tornado recreates handlers per request
    # Key: filename, Value: dict with temp_dir, total_chunks, received_chunks, logged_upload
    _temp_dirs: Dict[str, Dict[str, Any]] = {}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    @tornado.web.authenticated
    def post(self) -> None:
        """Handle file upload with multipart form data."""
        try:
            # Validate request has file
            if not self._validate_file_upload():
                return

            uploaded_file = self.request.files["file"][0]
            filename = uploaded_file["filename"]
            file_data = uploaded_file["body"]

            # Get notebook directory from request
            notebook_dir = self.get_argument("notebook_dir", ".")

            # Check if this is a chunked upload
            chunk_number = self.get_argument("chunk_number", None)
            total_chunks = self.get_argument("total_chunks", None)

            if chunk_number and total_chunks:
                self._handle_chunked_upload(
                    filename, file_data, chunk_number, total_chunks, notebook_dir
                )
            else:
                # Log the file upload attempt for regular (non-chunked) uploads
                file_extension = filename.split(".")[-1].lower()
                log_file_upload_attempt(filename, file_extension, False, 0)
                self._handle_regular_upload(filename, file_data, notebook_dir)

            self.finish()

        except Exception as e:
            self._handle_error(str(e))

    def _validate_file_upload(self) -> bool:
        """Validate that a file was uploaded in the request."""
        if "file" not in self.request.files:
            self._handle_error("No file uploaded", status_code=400)
            return False
        return True

    def _handle_chunked_upload(
        self,
        filename: str,
        file_data: bytes,
        chunk_number: str,
        total_chunks: str,
        notebook_dir: str,
    ) -> None:
        """Handle chunked file upload."""
        chunk_num = int(chunk_number)
        total_chunks_num = int(total_chunks)

        # Log the file upload attempt only for the first chunk
        if chunk_num == 1:
            file_extension = filename.split(".")[-1].lower()
            log_file_upload_attempt(filename, file_extension, True, total_chunks_num)

        # Save chunk to temporary file
        self._save_chunk(filename, file_data, chunk_num, total_chunks_num)

        # Check if all chunks are received and reconstruct if complete
        if self._are_all_chunks_received(filename, total_chunks_num):
            self._reconstruct_file(filename, total_chunks_num, notebook_dir)
            self._send_chunk_complete_response(filename, notebook_dir)
        else:
            self._send_chunk_received_response(chunk_num, total_chunks_num)

    def _handle_regular_upload(
        self, filename: str, file_data: bytes, notebook_dir: str
    ) -> None:
        """Handle regular (non-chunked) file upload."""
        # Check image file size limit before saving
        _check_image_size_limit(file_data, filename)

        file_path = os.path.join(notebook_dir, filename)
        with open(file_path, "wb") as f:
            f.write(file_data)

        self.write({"success": True, "filename": filename, "path": file_path})

    def _save_chunk(
        self, filename: str, file_data: bytes, chunk_number: int, total_chunks: int
    ) -> None:
        """Save a chunk to a temporary file."""
        # Initialize temporary directory for this file if it doesn't exist
        if filename not in self._temp_dirs:
            temp_dir = tempfile.mkdtemp(prefix=f"mito_upload_{filename}_")
            self._temp_dirs[filename] = {
                "temp_dir": temp_dir,
                "total_chunks": total_chunks,
                "received_chunks": set(),
            }

        # Save the chunk to the temporary directory
        chunk_filename = os.path.join(
            self._temp_dirs[filename]["temp_dir"], f"chunk_{chunk_number}"
        )
        with open(chunk_filename, "wb") as f:
            f.write(file_data)

        # Mark this chunk as received
        self._temp_dirs[filename]["received_chunks"].add(chunk_number)

    def _are_all_chunks_received(self, filename: str, total_chunks: int) -> bool:
        """Check if all chunks for a file have been received."""
        if filename not in self._temp_dirs:
            return False

        received_chunks = self._temp_dirs[filename]["received_chunks"]
        is_complete = len(received_chunks) == total_chunks
        return is_complete

    def _reconstruct_file(
        self, filename: str, total_chunks: int, notebook_dir: str
    ) -> None:
        """Reconstruct the final file from all chunks and clean up temporary directory."""

        if filename not in self._temp_dirs:
            raise ValueError(f"No temporary directory found for file: {filename}")

        temp_dir = self._temp_dirs[filename]["temp_dir"]
        file_path = os.path.join(notebook_dir, filename)

        try:
            # First, read all chunks to check total file size for images
            all_file_data = b""
            for i in range(1, total_chunks + 1):
                chunk_filename = os.path.join(temp_dir, f"chunk_{i}")
                with open(chunk_filename, "rb") as chunk_file:
                    chunk_data = chunk_file.read()
                    all_file_data += chunk_data

            # Check image file size limit before saving
            _check_image_size_limit(all_file_data, filename)

            # Write the complete file
            with open(file_path, "wb") as final_file:
                final_file.write(all_file_data)
        finally:
            # Clean up the temporary directory
            self._cleanup_temp_dir(filename)

    def _cleanup_temp_dir(self, filename: str) -> None:
        """Clean up the temporary directory for a file."""
        if filename in self._temp_dirs:
            temp_dir = self._temp_dirs[filename]["temp_dir"]
            try:
                import shutil

                shutil.rmtree(temp_dir)
            except Exception as e:
                # Log the error but don't fail the upload
                print(
                    f"Warning: Failed to clean up temporary directory {temp_dir}: {e}"
                )
            finally:
                # Remove from tracking dictionary
                del self._temp_dirs[filename]

    def _send_chunk_complete_response(self, filename: str, notebook_dir: str) -> None:
        """Send response indicating all chunks have been processed and file is complete."""
        file_path = os.path.join(notebook_dir, filename)
        self.write(
            {
                "success": True,
                "filename": filename,
                "path": file_path,
                "chunk_complete": True,
            }
        )

    def _send_chunk_received_response(
        self, chunk_number: int, total_chunks: int
    ) -> None:
        """Send response indicating a chunk was received but file is not yet complete."""
        self.write(
            {
                "success": True,
                "chunk_received": True,
                "chunk_number": chunk_number,
                "total_chunks": total_chunks,
            }
        )

    def _handle_error(self, error_message: str, status_code: int = 500) -> None:
        """Handle errors and send appropriate error response."""
        log_file_upload_failure(error_message)
        self.set_status(status_code)
        self.write({"error": error_message})
        self.finish()

    def on_finish(self) -> None:
        """Clean up any remaining temporary directories when the handler is finished."""
        super().on_finish()
        # Note: We don't clean up here anymore since we want to preserve state across requests
        # The cleanup happens when the file is fully reconstructed
