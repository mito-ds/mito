# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

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
