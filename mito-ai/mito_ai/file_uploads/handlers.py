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
