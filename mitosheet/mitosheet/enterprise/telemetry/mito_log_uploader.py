import json
import logging
import time
from typing import Any, Dict, List, Optional
import threading

import requests

"""
Error Severity Codes are used to help enterprise admins triage errors. 
When managing the Python environment of 1000's of users, error severity codes 
are useful for understanding the impact of errors and prioritizing fixes.

The error severity codes use the following schema:

Likely just a warning		        0
Likely user error		            10
Likely inconsequential error		11
Likely Mito Bug		                20
Unable to import data		        21
Unable to replay analysis		    22	
Mito Crashed		                50	
Misc.		                        -1
"""

error_severity_codes = {
    'ai_transformation_edit_failed': '10',
    'append_user_field_update_failed': '11',
    'args_update_failed': '20',
    'args_update_remains_failed': '20',
    'change_column_dtype_edit_failed': '10',
    'check_dependencies_failed': '-1',
    'dataframe_delete_edit_failed': '11',
    'dataframe_import_edit_failed': '21',
    'dataframe_rename_edit_failed': '11',
    'delete_column_edit_failed': '11',
    'delete_row_edit_failed': '11',
    'excel_import_edit_failed': '21',
    'filter_column_edit_failed': '10',
    'frontend_render_failed': '50',
    'get_column_summary_graph_failed': '11',
    'get_dataframe_as_excel_failed': '21',
    'get_defined_df_names_failed': '21',
    'get_excel_file_metadata_failed': '21',
    'get_unique_value_counts_failed': '20',
    'graph_edit_failed': '10',
    'graph_rename_edit_failed': '11',
    'install_failed': '-1',
    'install_mitosheet_failed': '-1',
    'melt_edit_failed': '11',
    'merge_edi_failed':' 0',
    'mitosheet_sheet_call_failed': '50',
    'mitosheet_sheet_call_location_failed': '10',
    'one_hot_encoding_edit_failed': '11',
    'overwrite_analysis_to_replay_to_mitosheet_call_failed': '22',
    'pivot_edit_failed': '20',
    'plotly_define_failed': '20',
    'rename_column_edit_failed': '10',
    'render_count_update_failed': '11',
    'replace_edit_failed': '10',
    'replay_analysis_update_failed': '22',
    'replayed_nonexistant_analysis_failed': '22',
    'set_column_formula_edit_failed': '10',
    'simple_import_edit_failed': '21',
    'sort_edit_failed': '20',
    'write_analysis_to_replay_to_mitosheet_call_failed': '20'
}


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
        'error_severity_code': '10'
	}
    """
    
    whitelisted_log_events = [
        'edit_event',
        'error', 
        'mitosheet_rendered',
        'frontend_render_failed',
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

    # Add the severity code to the log and default to -1 if not found
    if log_event == 'error':
        filtered_log_params['error_severity_code'] = error_severity_codes.get(filtered_log_params['params_failed_log_event'], '-1')
    if log_event == 'frontend_render_failed':
        filtered_log_params['error_severity_code'] = error_severity_codes.get(log_event, '-1')

    return filtered_log_params

# Set to True if you want to run the log uploader in a threaded environment
# NOTE: because the log uploader only works in JupyterLab, we do not need
# to ever handle the case where LOG_UPLOADER_IS_THREADED is False for now
# but we may need it in the future if we expand to other environments
LOG_UPLOADER_IS_THREADED = True

class MitoLogUploader:
    """
    The MitoLogUploader is responsible for uploading logs to a 
    custom analytics url set in the MITO_CONFIG.

    It only uploads the most useful logs and log params in order 
    to make the logs maximally useful and minimally confusing. 
     
    It also uploads logs in batches every log_interval seconds so that 
    enterprises collecting logs from thousands of users do not 
    break their logging server. 

    Note that we use an exponential backoff strategy to prevent overloading
    the logging server in the case of a temporary failure.
    """
    def __init__(self, log_url: str, log_interval: Optional[int]):
        self.log_url = log_url
        self.base_log_interval = log_interval if log_interval is not None else 10
        self.current_log_interval = self.base_log_interval
        self.last_upload_time = time.time()
        self.unprocessed_logs: List[Dict[str, Any]] = []
        self.lock = threading.Lock()  # Lock for thread-safe operations
        
        if LOG_UPLOADER_IS_THREADED:
            self.upload_thread = threading.Thread(target=self.__run_periodic_upload, daemon=True)
            self.upload_thread.start()

    def log(self, log_event: str, log_params: Dict[str, Any]) -> None:
        """
        Converts log into the correct format, adds it to the queue of logs to be uploaded,
        and checks if it is time to upload the logs.
        """
        with self.lock:  # Ensure thread-safe access to shared resources
            filtered_log_params = preprocess_log_for_upload(log_event, log_params)
            if filtered_log_params is not None:
                self.unprocessed_logs.append(filtered_log_params)

        # We only upload logs if we are not running in a threaded environment
        # In a threaded environment, we upload logs every log_interval seconds
        # in the run_periodic_upload function
        if not LOG_UPLOADER_IS_THREADED:
            current_time = time.time()
            if self.last_upload_time + self.current_log_interval < current_time and len(self.unprocessed_logs) > 0:
                self.__try_upload_logs()

    def __try_upload_logs(self) -> None:
        """
        Uploads the unprocessed logs to the log_url and clears the unprocessed logs.

        If the logs are not being uploaded successfully, then double the log interval
        This is an exponential backoff strategy to prevent overloading the logging server.
        """
        with self.lock:  # Protect access to shared resources
            self.last_upload_time = time.time()
            
            if len(self.unprocessed_logs) == 0:
                return  # No logs to upload

            log_payload = json.dumps(self.unprocessed_logs)

            try:
                result = requests.post(
                    self.log_url,
                    data=log_payload,
                    headers={'Content-Type': 'application/json'}
                )
                # Throw an error if the request was not successful
                result.raise_for_status()

                self.unprocessed_logs = []
                
                # Per the exponential backoff strategy, if the logs are being uploaded successfully,
                # then reset the log interval to the base interval
                self.current_log_interval = self.base_log_interval

            except Exception as e:
                print(f"Log upload failed with error:", e, flush=True)

                # If the logs are not being uploaded successfully, then double the log interval
                # This is an exponential backoff strategy to prevent overloading the logging server
                # in the case of a temporary failure
                self.current_log_interval *= 2

    def __run_periodic_upload(self):
        while LOG_UPLOADER_IS_THREADED:
            time.sleep(self.current_log_interval)
            self.__try_upload_logs()