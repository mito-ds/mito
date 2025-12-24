# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.chart_wizard.utils import process_chart_code


class ChartWizardHandler(APIHandler):
    """Handler for operations on the chart wizard"""

    @tornado.web.authenticated
    async def post(self) -> None:
        """Process chart wizard request with cell source code"""
        try:
            body = self.get_json_body()
            source_code = body.get("source_code", "")
            
            if not source_code:
                self.set_status(400)
                self.finish(json.dumps({"error": "source_code is required"}))
                return
            
            print(f"ChartWizardHandler: post - received source code ({len(source_code)} characters)")
            
            # Get structured response from LLM
            chart_response = await process_chart_code(source_code)
            
            self.finish(json.dumps({
                "status": "success", 
                "parameters": [param.model_dump() for param in chart_response.parameters],
            }))
        except Exception as e:
            print(f"Error in ChartWizardHandler: {e}")
            self.set_status(500)
            self.finish(json.dumps({"error": str(e)}))