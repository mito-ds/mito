import json
import pprint
import time
from typing import Any, Optional, List, Dict
import requests

def preprocess_log_for_upload(log_event: str, log_params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Convert logs into the correct format and remove any log events that are not part of the whitelisted schema.

	{
	    'timestamp': '2023-10-25T15:30:00Z',
	    'event': 'set_column_formula',
	    'params': {
		'sheet_index': 1,
		'column_id': 'column id',
		'new_formula': '=10 + 11'
	     },
	     'version_python': '3.9',
	     'version_pandas': '2.0',
	     'version_mitosheet': '0.1.522',
	}
    """
    
    whitelisted_log_events = [
        'edit_event',
        'error', 
        'mitosheet_rendered'
    ]

    whitelisted_log_params = [
        'version_python',
        'version_pandas',
        'version_mito',
        'error_traceback',
        'error_traceback_last_line',
    ]

    # Remove non-whitelisted events
    if log_event not in whitelisted_log_events:
        return None

    # Remove any log params that are not part of whitelisted params or start with "params", ie: params_sheet_index
    filtered_log_params = {k: v for k, v in log_params.items() if k in whitelisted_log_params or k.startswith('params_')}

    # Add the gmt timestamp formatted as 2023-10-25T15:30:00Z
    filtered_log_params['timestamp_gmt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    # Create a useful top-level event field. Use the params_log_event if it exists (edit_events)
    # Otherwise, use the log_event.
    if 'params_log_event' in filtered_log_params:
        filtered_log_params['event'] = filtered_log_params['params_log_event']
        del filtered_log_params['params_log_event']
    else:
        filtered_log_params['event'] = log_event

    return filtered_log_params


class MitoLogUploader:
    """
    The MitoLogUploader is responsible for uploading logs to a 
    custom analytics url set in the MITO_CONFIG.

    It only uploads the most useful logs and log params in order 
    to make the logs maximally useful and minimally confusing. 
     
    It also uploads logs in batches every log_interval seconds so that 
    enterprises collecting logs from thousands of users do not 
    break their logging server. 
    """
    def __init__(
        self, 
        log_url: str,
        log_interval: Optional[int]
    ):
        self.log_url = log_url
        self.log_interval = log_interval if log_interval is not None else 10
        self.last_upload_time = time.time()
        self.unprocessed_logs: List[Dict[str, Any]] = []

    def log(self, log_event: str, log_params: Dict[str, Any]) -> None:
        """
        Converts log into the correct format, adds it to the queue of logs to be uploaded,
        and checks if it is time to upload the logs.
        """
        filtered_log_params = preprocess_log_for_upload(log_event, log_params)

        if filtered_log_params is not None:
            self.unprocessed_logs.append(filtered_log_params)

        current_time = time.time()
        if self.last_upload_time + self.log_interval < current_time and len(self.unprocessed_logs) > 0:
            self.upload_log(current_time)

    def upload_log(self, last_processed_log_time: float) -> None:
        """
        Uploads the unprocessed logs to the log_url and clears the unprocessed logs.
        """
        log_payload = json.dumps(self.unprocessed_logs)
        self.last_upload_time = last_processed_log_time

        try:
            requests.post(
                self.log_url,
                data=log_payload,
                headers={'Content-Type': 'application/json'}
            )

            self.unprocessed_logs = []

        except Exception as e:
            print("Log upload failed with error: ", e)

