# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.model_utils import get_available_models


class AvailableModelsHandler(APIHandler):
    """REST handler for returning available models to the frontend."""
    
    @tornado.web.authenticated
    async def get(self) -> None:
        """GET endpoint that returns the list of available models."""
        try:
            available_models = get_available_models()
            
            self.write({
                "models": available_models
            })
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
            self.finish()
