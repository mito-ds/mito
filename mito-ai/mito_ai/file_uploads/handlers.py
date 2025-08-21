# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tornado
from jupyter_server.base.handlers import APIHandler


class FileUploadHandler(APIHandler):
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
                self._handle_regular_upload(filename, file_data, notebook_dir)

            self.finish()

        except Exception as e:
            self._handle_error(f"Failed to save file: {str(e)}")

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

        # Save chunk to temporary file
        self._save_chunk(filename, file_data, chunk_num, notebook_dir)

        # Check if all chunks are received and reconstruct if complete
        if self._are_all_chunks_received(filename, total_chunks_num, notebook_dir):
            self._reconstruct_file(filename, total_chunks_num, notebook_dir)
            self._send_chunk_complete_response(filename, notebook_dir)
        else:
            self._send_chunk_received_response(chunk_num, total_chunks_num)

    def _handle_regular_upload(
        self, filename: str, file_data: bytes, notebook_dir: str
    ) -> None:
        """Handle regular (non-chunked) file upload."""
        file_path = os.path.join(notebook_dir, filename)
        with open(file_path, "wb") as f:
            f.write(file_data)

        self.write({"success": True, "filename": filename, "path": file_path})

    def _save_chunk(
        self, filename: str, file_data: bytes, chunk_number: int, notebook_dir: str
    ) -> None:
        """Save a chunk to a temporary file."""
        chunk_filename = os.path.join(notebook_dir, f"{filename}.part{chunk_number}")
        with open(chunk_filename, "wb") as f:
            f.write(file_data)

    def _are_all_chunks_received(
        self, filename: str, total_chunks: int, notebook_dir: str
    ) -> bool:
        """Check if all chunks for a file have been received."""
        for i in range(1, total_chunks + 1):
            chunk_filename = os.path.join(notebook_dir, f"{filename}.part{i}")
            if not os.path.exists(chunk_filename):
                return False
        return True

    def _reconstruct_file(
        self, filename: str, total_chunks: int, notebook_dir: str
    ) -> None:
        """Reconstruct the final file from all chunks and clean up temporary files."""
        file_path = os.path.join(notebook_dir, filename)
        with open(file_path, "wb") as final_file:
            for i in range(1, total_chunks + 1):
                chunk_filename = os.path.join(notebook_dir, f"{filename}.part{i}")
                with open(chunk_filename, "rb") as chunk_file:
                    final_file.write(chunk_file.read())
                # Clean up chunk file
                os.remove(chunk_filename)

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
        self.set_status(status_code)
        self.write({"error": error_message})
        self.finish()
