# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import base64
import os
import tornado
from typing import Any
from jupyter_server.base.handlers import APIHandler


class FileUploadHandler(APIHandler):
    @tornado.web.authenticated
    def post(self) -> None:
        """Handle file upload with base64 content."""
        try:
            # Parse JSON request body
            data = json.loads(self.request.body.decode("utf-8"))
            filename = data.get("filename")
            content = data.get("content")

            if not filename or not content:
                self.set_status(400)
                self.write({"error": "Missing filename or content"})
                self.finish()
                return

            # Extract base64 content from data URL format
            # Remove data URL prefix (e.g., "data:text/plain;base64,")
            if "," in content:
                base64_content = content.split(",")[1]
            else:
                base64_content = content

            # Convert base64 to binary
            file_data = base64.b64decode(base64_content)

            # Create uploads directory if it doesn't exist
            upload_dir = "./uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)

            # Save file
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as f:
                f.write(file_data)

            # Return success response
            self.write({"success": True, "filename": filename, "path": file_path})
            self.finish()

        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": f"Failed to save file: {str(e)}"})
            self.finish()
