# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler


class ChartWizardHandler(APIHandler):
    """Handler for operations on the chart wizard"""

    @tornado.web.authenticated
    def post(self) -> None:
        """Process chart wizard request with cell source code"""
        try:
            body = self.get_json_body()
            source_code = body.get("source_code", "")
            
            print(f"ChartWizardHandler: post - received source code ({len(source_code)} characters)")
            print(f"Source code preview: {source_code[:200]}...")
            
            # TODO: Process the source code here
            
            self.finish(json.dumps({
                "status": "success", 
                "message": "Chart wizard data processed",
                "source_code_length": len(source_code)
            }))
        except Exception as e:
            self.set_status(500)
            self.finish(json.dumps({"error": str(e)}))