# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler


class ChartWizardHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        """Simple GET endpoint that returns hello world."""
        self.write({"message": "hello world"})
        self.finish()

    @tornado.web.authenticated
    def post(self) -> None:
        """POST endpoint that receives code from the frontend."""
        try:
            data = json.loads(self.request.body.decode('utf-8'))
            code = data.get('code', '')
            
            # TODO: Process the code here
            # For now, just return a success message
            self.write({"message": "Code received successfully", "code_length": len(code)})
            self.finish()
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
            self.finish()
