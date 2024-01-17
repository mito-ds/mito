import json
import pprint
from queue import Queue
import time
from typing import Any

import requests

from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_STATIC_USER_ID


class MitoLogUploader:
    """
 
    """

    def __init__(
        self, 
        log_url: str,
        log_interval: int,
    ):
        print("MitoLogUploader init")
        self.log_url = log_url
        self.log_interval = log_interval
        self.last_upload_time = time.time()
        self.unprocessed_logs = []

    def log(self, log_event: str, final_params:  dict[str, Any]):
        self.unprocessed_logs.append(final_params)

        if self.last_upload_time + self.log_interval < time.time():
            self.upload_log()

    def upload_log(self):

        log_payload = json.dumps(self.unprocessed_logs)
        print(log_payload)
        self.unprocessed_logs = []


        """
        response = requests.post(
            self.log_url,
            json={
                'user_id': get_user_field(UJ_STATIC_USER_ID),
                'log_event': self.unprocessed_logs
            }
        )

        response = response.json()
        response = response['response']

        # Check if the request was successful
        if response['status'] != 'success':
            print(response)
            raise Exception('Log upload failed')
        else:
            print('Log upload successful')
            # Clear the logs
            self.unprocessed_logs = []

        """


        