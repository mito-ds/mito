import json
import pprint
from queue import Queue
import time
from typing import Any, Optional

import requests

from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_STATIC_USER_ID


def preprocess_log_for_upload(log_event: str, log_params: dict[str, Any]) -> Optional[dict[str, Any]] :
    """
    Remove any log params that are not part of whitelisted log params for upload.

    timestampt
    event
    params
    version_python
    version_pandas
    version_mitosheet
    """
    
    whitelisted_events = [
        'edit_event',
        'error', 
        'mitosheet_rendered'
    ]

    whitelisted_params = [
        'version_python',
        'version_pandas',
        'version_mito',
        'error_traceback',
        'error_traceback_last_line',
    ]

    # Remove non-whitelisted events
    if log_event not in whitelisted_events:
        return None

    # Remove any log params that are not part of whitelisted params or start with "params", ie: params_sheet_index
    filtered_log_params = {k: v for k, v in log_params.items() if k in whitelisted_params or k.startswith('params_')}

    # Add the timestamp formatted as 2023-10-25T15:30:00Z
    filtered_log_params['timestamp_gmt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    # Create a useful top-level event field. 
    # If there is a params_log_event (which is defined for edit_events), use that. 
    # Otherwise, use the log_event
    if 'params_log_event' in filtered_log_params:
        filtered_log_params['event'] = filtered_log_params['params_log_event']
        del filtered_log_params['params_log_event']
    else:
        filtered_log_params['event'] = log_event

    return filtered_log_params


class MitoLogUploader:
    """
 
    """

    def __init__(
        self, 
        log_url: str,
        log_interval: int,
    ):
        self.log_url = log_url
        self.log_interval = log_interval
        self.last_upload_time = time.time()
        self.unprocessed_logs = []

    def log(self, log_event: str, log_params: dict[str, Any]):
        filtered_log_params = preprocess_log_for_upload(log_event, log_params)

        if filtered_log_params is not None:
            self.unprocessed_logs.append(filtered_log_params)

        current_time = time.time()
        if self.last_upload_time + self.log_interval < current_time:
            self.upload_log(current_time)

    def upload_log(self, last_processes_log_time: float):

        log_payload = json.dumps(self.unprocessed_logs)
        pprint.pprint(log_payload)
        self.unprocessed_logs = []
        self.last_upload_time = last_processes_log_time


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


        