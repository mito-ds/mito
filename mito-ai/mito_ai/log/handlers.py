# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import json
from typing import Any, Final, Literal
import tornado
import os
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.telemetry_utils import MITO_SERVER_KEY, USER_KEY, log


class LogHandler(APIHandler):
    """Handler for logging"""
    
    def initialize(self, key_type: Literal['mito_server_key', 'user_key']) -> None:
        """Initialize the log handler"""
        
        # The key_type is required so that we know if we can log pro users
        self.key_type = key_type
        
    @tornado.web.authenticated
    def put(self) -> None:
        """Log an event"""
        data = json.loads(self.request.body)
        
        if 'log_event' not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "Log event is required"}))
            return
        
        log_event = data['log_event']
        params = data.get('params', {})
        
        key_type = MITO_SERVER_KEY if self.key_type == "mito_server_key" else USER_KEY
        log(log_event, params, key_type=key_type)


