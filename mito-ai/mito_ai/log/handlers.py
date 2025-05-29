# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.telemetry_utils import log


class LogHandler(APIHandler):
    """Handler for logging"""
    
    @tornado.web.authenticated
    def put(self):
        """Log an event"""
        data = json.loads(self.request.body)
        
        if 'log_event' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Log event is required"}))
            return
        
        log_event = data['log_event']
        params = data.get('params', {})
        
        log(log_event, params)


