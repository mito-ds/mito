# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler


class ChartWizardHandler(APIHandler):
    """Handler for operations on the chart wizard"""

    @tornado.web.authenticated
    def get(self, key: str) -> None:
        """Get a specific setting by key"""
        print("ChartWizardHandler: get")