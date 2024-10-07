#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Main file containing the mito widget.
"""
import json
import os
import re
import time
from sysconfig import get_python_version
from typing import Any, Dict, List, Optional, Union, Callable

import numpy as np
import pandas as pd
from IPython import get_ipython
from IPython.display import HTML, display
from mitosheet.enterprise.telemetry.mito_log_uploader import MitoLogUploader

from mitosheet.kernel_utils import get_current_kernel_id, Comm
from mitosheet.api import API
from mitosheet.enterprise.mito_config import MitoConfig
from mitosheet.errors import (MitoError, get_recent_traceback,
                              make_execution_error)
from mitosheet.saved_analyses import write_save_analysis_file
from mitosheet.steps_manager import StepsManager
from mitosheet.telemetry.telemetry_utils import (log, log_event_processed,
                                                 telemetry_turned_on)
from mitosheet.types import CodeOptions, ColumnDefinintion, ColumnDefinitions, ConditionalFormat, DefaultEditingMode, MitoTheme, ParamMetadata
from mitosheet.updates.replay_analysis import REPLAY_ANALYSIS_UPDATE
from mitosheet.user.create import try_create_user_json_file
from mitosheet.user.db import USER_JSON_PATH, get_user_field
from mitosheet.user.location import is_dash, is_in_google_colab, is_in_vs_code, is_streamlit
from mitosheet.user.schemas import (UJ_MITOSHEET_LAST_FIFTY_USAGES, UJ_RECEIVED_TOURS,
                                    UJ_USER_EMAIL, UJ_AI_PRIVACY_POLICY)
from mitosheet.user.utils import get_pandas_version, is_enterprise, is_pro, is_running_test
from mitosheet.utils import get_new_id
from mitosheet.step_performers.utils.user_defined_function_utils import get_functions_from_path, get_non_validated_custom_sheet_functions
from mitosheet.api.get_validate_snowflake_credentials import get_cached_snowflake_credentials


class MitoBackend():
    """
        The Mito Backend holds all of the backend state for the Mito extension, and syncs
        the state with the frontend widget. 
    """
    
    def __init__(
            self, 
            *args: Union[pd.DataFrame, str, None], 
            analysis_to_replay: Optional[str]=None, 
            import_folder: Optional[str]=None,
            user_defined_functions: Optional[List[Callable]]=None,
            user_defined_importers: Optional[List[Callable]]=None,
            user_defined_editors: Optional[List[Callable]]=None,
            code_options: Optional[CodeOptions]=None,
            column_definitions: Optional[List[ColumnDefinitions]]=None,
            default_editing_mode: Optional[DefaultEditingMode]=None,
            theme: Optional[MitoTheme]=None,
            input_cell_execution_count: Optional[int]=None,
        ):
        """
        Takes a list of dataframes and strings that are paths to CSV files
        passed through *args.
        """
        # Call the DOMWidget constructor to set up the widget properly
        super(MitoBackend, self).__init__()

        # Setup the MitoConfig class
        self.mito_config = MitoConfig() # type: ignore

        # Set up the Mito Logger class
        log_server_url = self.mito_config.log_server_url
        log_server_batch_interval = self.mito_config.log_server_batch_interval
        self.mito_log_uploader = MitoLogUploader(log_server_url, log_server_batch_interval) if log_server_url is not None else None

        custom_sheet_functions_path = self.mito_config.custom_sheet_functions_path
        all_user_defined_functions = user_defined_functions if user_defined_functions is not None else []
        if custom_sheet_functions_path is not None:
            all_user_defined_functions.extend(get_non_validated_custom_sheet_functions(custom_sheet_functions_path))

        custom_importers_path = self.mito_config.custom_importers_path
        all_custom_importers = user_defined_importers if user_defined_importers is not None else []
        if custom_importers_path is not None:
            all_custom_importers.extend(get_functions_from_path(custom_importers_path))

        # Get the absolute path to the import_folder, in case it is relative. Also
        # check that this folder exists, and throw an error if it does not.
        if import_folder is not None:
            import_folder = os.path.expanduser(import_folder)
            import_folder = os.path.abspath(import_folder)

            if not os.path.exists(import_folder):
                raise ValueError(f"Import folder {import_folder} does not exist. Please change the file path or create the folder.")
                        
        # Set up the state container to hold private widget state
        self.steps_manager = StepsManager(
            args, 
            mito_config=self.mito_config, 
            mito_log_uploader=self.mito_log_uploader if hasattr(self, 'mito_log_uploader') else None,
            analysis_to_replay=analysis_to_replay, 
            import_folder=import_folder,
            user_defined_functions=all_user_defined_functions,
            user_defined_importers=all_custom_importers,
            user_defined_editors=user_defined_editors,
            code_options=code_options,
            column_definitions=column_definitions,
            theme=theme,
            default_editing_mode=default_editing_mode,
            input_cell_execution_count=input_cell_execution_count
        )

        # And the api
        self.api = API(self.steps_manager, self)

        # We store static variables to make writing the shared
        # state variables quicker; we store them so we don't 
        # have to recompute them on each update
        last_50_usages = get_user_field(UJ_MITOSHEET_LAST_FIFTY_USAGES)
        self.num_usages = len(last_50_usages if last_50_usages is not None else [])
        self.received_tours = get_user_field(UJ_RECEIVED_TOURS)

        self.mito_send: Callable = lambda x: None # type: ignore

        self.theme = theme

    @property
    def fully_parameterized_function(self) -> str:
        return self.steps_manager.fully_parameterized_function

    @property
    def param_metadata(self) -> List[ParamMetadata]:
        return self.steps_manager.param_metadata

    @property
    def analysis_name(self):
        return self.steps_manager.analysis_name

    def get_shared_state_variables(self) -> Dict[str, Any]:
        """
        Helper function for updating all the variables that are shared
        between the backend and the frontend through trailets.
        """
        return {
            'sheet_data_json': self.steps_manager.sheet_data_json,
            'analysis_data_json': self.steps_manager.analysis_data_json,
            'user_profile_json': self.get_user_profile_json()
        }

    def get_user_profile_json(self) -> str:
        return json.dumps({
            # Dynamic, update each time
            'userEmail': get_user_field(UJ_USER_EMAIL),
            'receivedTours': get_user_field(UJ_RECEIVED_TOURS),
            'isPro': is_pro(),
            'isEnterprise': is_enterprise(),
            'telemetryEnabled': telemetry_turned_on(),
            # Static over a single analysis
            'pythonVersion': get_python_version(),
            'pandasVersion': get_pandas_version(),
            'numUsages': self.num_usages,
            'mitoConfig': self.steps_manager.mito_config.mito_config_dict,
            'snowflakeCredentials': get_cached_snowflake_credentials(),
            'openAIAPIKey': os.environ.get('OPENAI_API_KEY', None),
            'aiPrivacyPolicy': get_user_field(UJ_AI_PRIVACY_POLICY),
        })


    def handle_edit_event(self, event: Dict[str, Any]) -> None:
        """
        Handles an edit_event. Per the spec, an edit_event
        updates both the sheet and the codeblock, and as such
        the sheet is re-evaluated and the code for the codeblock
        is re-transpiled.

        Useful for any event that changes the state of both the sheet
        and the codeblock!
        """

        # First, we send this new edit to the evaluator
        self.steps_manager.handle_edit_event(event)

        # Also, write the analysis to a file!
        write_save_analysis_file(self.steps_manager)

        # Tell the front-end to render the new sheet and new code with an empty
        # response. NOTE: in the future, we can actually send back some data
        # with the response (like an error), to get this response in-place!        
        self.mito_send({
            'event': 'response',
            'id': event['id'],
            'shared_variables': self.get_shared_state_variables()
        })


    def handle_update_event(self, event: Dict[str, Any]) -> None:
        """
        This event is not the user editing the sheet, but rather information
        that has been collected from the frontend (after render) that is being
        passed back.

        For example:
        - Names of the dataframes
        - Name of an existing analysis
        """

        try:
            self.steps_manager.handle_update_event(event)
        except Exception as e:
            # We handle the case of replaying the analysis specially, because we don't
            # want to display the error modal - we want to display something specific
            # in this case. Note that we include the updating of shared state variables
            # in the try catch, as this is sometimes where errors occur
            if event["type"] == REPLAY_ANALYSIS_UPDATE['event_type']:
                # Propagate the Mito error if we can. We never want a replay analysis to open
                # an error modal, so make sure to update the error if necessary
                if isinstance(e, MitoError):
                    e.error_modal = False
                    raise e
                raise make_execution_error(error_modal=False)
            raise
        # Also, write the analysis to a file!
        write_save_analysis_file(self.steps_manager)

        # Tell the front-end to render the new sheet and new code with an empty
        # response. 
        self.mito_send({
            'event': 'response',
            'id': event['id'],
            'shared_variables': self.get_shared_state_variables()
        })

    def receive_message(self, content: Dict[str, Any]) -> bool:
        """
        Handles all incoming messages from the JS widget. There are three main
        types of events:

        1. edit_event: any event that updates the state of the sheet and the
        code block at once. Leads to reevaluation, and a re-transpile.

        2. update_event: any event that isn't caused by an edit, but instead
        other types of new data coming from the frontend (e.g. the df names 
        or some existing steps).

        3. api_call: an event that is used to retrieve information from the backend without
        updating the backend state.

        4. A log_event is just an event that should get logged on the backend.
        """

        start_time: Optional[float] = time.perf_counter()
        event = content

        try:
            if event['event'] == 'edit_event':
                self.handle_edit_event(event)
            elif event['event'] == 'update_event':
                self.handle_update_event(event)
            elif event['event'] == 'api_call':
                self.api.process_new_api_call(event)
                # NOTE: since API calls are in a seperate thread, their start time and end
                # time are not valid, and so we don't even log the start time to not be confusing
                start_time = None

            if event['event'] != 'api_call':
                # NOTE: we don't need to case on log_event above because it always gets
                # passed to this function, and thus is logged. We also don't log in the
                # case of an API event as that is in a seperate thread and so takes care
                # of it's logging seperately
                log_event_processed(event, self.steps_manager, start_time=start_time)

            return True
        except MitoError as e:
            if is_running_test():
                print(get_recent_traceback())
                print(e)

            # Log processing this event failed
            log_event_processed(event, self.steps_manager, failed=True, error=e, start_time=start_time)

            # Report it to the user, and then return
            self.mito_send({
                'event': 'error',
                'id': event['id'],
                'error': e.to_fix,
                'errorShort': e.header,
                'traceback': e.traceback,
                'showErrorModal': e.error_modal
            })
        except:
            if is_running_test():
                print(get_recent_traceback())
            
            # We log that processing failed, but have no edit error
            log_event_processed(event, self.steps_manager, failed=True, start_time=start_time)
            # Report it to the user, and then return
            self.mito_send({
                'event': 'error',
                'id': event['id'],
                'error': 'Sorry, there was an error during executing this code.',
                'errorShort': 'Execution Error',
                'traceback': get_recent_traceback(),
                'showErrorModal': True
            })

        return False

with open(os.path.normpath(os.path.join(__file__, '..', 'mito_frontend.js'))) as f:
    js_code_from_file = f.read()
with open(os.path.normpath(os.path.join(__file__, '..', 'mito_frontend.css'))) as f:
    css_code_from_file = f.read()


def get_mito_backend(
        *args: Any,
        analysis_to_replay: Optional[str]=None, # This is the parameter that tracks the analysis that you want to replay (NOTE: requires a frontend to be replayed!)
        user_defined_functions: Optional[List[Callable]]=None,
        user_defined_importers: Optional[List[Callable]]=None,
        user_defined_editors: Optional[List[Callable]]=None,
        column_definitions: Optional[List[ColumnDefinitions]]=None,
        input_cell_execution_count: Optional[int]=None,
    ) -> MitoBackend:

    # We pass in the dataframes directly to the widget
    mito_backend = MitoBackend(
        *args, 
        analysis_to_replay=analysis_to_replay, 
        user_defined_functions=user_defined_functions, 
        user_defined_importers=user_defined_importers,
        user_defined_editors=user_defined_editors,
        column_definitions=column_definitions,
        input_cell_execution_count=input_cell_execution_count
    ) 

    return mito_backend


def register_comm_target_on_mito_backend(
        mito_backend: MitoBackend,
        comm_target_id: str=''
    ) -> MitoBackend:
    ipython = get_ipython() # type: ignore
    if not ipython:
        return mito_backend

    # We create a callback that runs when the comm is actually created on the frontend
    def on_comm_creation(comm: Comm, open_msg: Dict[str, Any]) -> None:
        @comm.on_msg
        def _recv(msg):
            # Register handler for any incoming messages
            mito_backend.receive_message(msg['content']['data'])
        
        # Save the comm in the mito widget, so we can use this .send function
        mito_backend.mito_send = comm.send

        # Send data to the frontend on creation, so the frontend knows that we have
        # actually registered the comm on the backend
        comm.send({'echo': open_msg['content']['data']}) # type: ignore

    # Register the comm target - so the callback gets called
    ipython.kernel.comm_manager.register_target(comm_target_id, on_comm_creation)

    return mito_backend

def get_mito_frontend_code(kernel_id: str, comm_target_id: str, div_id: str, mito_backend: MitoBackend) -> str:

    js_code = js_code_from_file.replace('REPLACE_THIS_WITH_DIV_ID', div_id)
    js_code = js_code.replace('REPLACE_THIS_WITH_KERNEL_ID', kernel_id)
    js_code = js_code.replace('REPLACE_THIS_WITH_COMM_TARGET_ID', comm_target_id)
    # NOTE: because the CSS has strings inside of it, we need to replace the " quotes (which get created during code minifying)
    # with ` quotes, which properly contain the CSS string
    js_code = js_code.replace('"REPLACE_THIS_WITH_CSS"', "`" + css_code_from_file + "`")
    js_code = js_code.replace('`REPLACE_THIS_WITH_CSS`', "`" + css_code_from_file + "`")
    # NOTE: we encode these as utf8 encoded byte arrays, so that we can avoid having to do complicated things with 
    # replacing \t, etc, which is required because JSON.parse limits what characters are valid in strings (bah humbug)
    def to_uint8_arr(string: str) -> List[int]:
        return np.frombuffer(string.encode("utf8"), dtype=np.uint8).tolist()

    js_code = js_code.replace('["REPLACE_THIS_WITH_SHEET_DATA_BYTES"]', f'{to_uint8_arr(mito_backend.steps_manager.sheet_data_json)}')
    js_code = js_code.replace('["REPLACE_THIS_WITH_ANALYSIS_DATA_BYTES"]', f'{to_uint8_arr(mito_backend.steps_manager.analysis_data_json)}')
    js_code = js_code.replace('["REPLACE_THIS_WITH_USER_PROFILE_BYTES"]', f'{to_uint8_arr(mito_backend.get_user_profile_json())}')

    return js_code

def sheet(
        *args: Any,
        analysis_to_replay: Optional[str]=None, # This is the parameter that tracks the analysis that you want to replay (NOTE: requires a frontend to be replayed!)
        # NOTE: if you add named variables to this function, make sure argument parsing on the front-end still
        # works by updating the getArgsFromCellContent function.
        sheet_functions: Optional[List[Callable]]=None,
        importers: Optional[List[Callable]]=None,
        editors: Optional[List[Callable]]=None,
        input_cell_execution_count: Optional[int]=None # If the sheet is a dataframe mime renderer, we pass the cell_id so we know where to generate the code. 
    ) -> None:
    """
    Renders a Mito sheet. If no arguments are passed, renders an empty sheet. Otherwise, renders
    any dataframes that are passed. Errors if any given arguments are not dataframes or paths to
    CSV files that can be read in as dataframes.

    If running this function just prints text that looks like `MitoWidget(...`, then you need to 
    install the JupyterLab extension manager by running:

    python -m pip install mitoinstaller
    python -m mitoinstaller install

    Run this command in the terminal where you installed Mito. It should take 1-2 minutes to complete.

    Then, restart your JupyterLab instance, and refresh your browser. Mito should now render.

    NOTE: if you have any issues with installation, please email jake@sagacollab.com
    """
    # We throw a custom error message if we're sure the user is in
    # vs code or google collab (these conditions are more secure than
    # the conditons for checking if we're in JLab or JNotebook).
    # Then, check if we're in Dash or in Streamlit. 
    # If so, tell user to use the correct component
    if is_in_vs_code() or is_in_google_colab():
        log('mitosheet_sheet_call_location_failed', failed=True)
        raise Exception("The mitosheet currently only works in JupyterLab.\n\nTo see instructions on getting Mitosheet running in JupyterLab, find install instructions here: https://docs.trymito.io/getting-started/installing-mito")
    elif is_dash():
        log('mitosheet_sheet_call_location_failed', failed=True)
        raise Exception("To create a Mito spreadsheet in Dash, please use the `Spreadsheet` component. See documentation here: https://docs.trymito.io/mito-for-dash/getting-started")
    elif is_streamlit():
        log('mitosheet_sheet_call_location_failed', failed=True)
        raise Exception("To create a Mito spreadsheet in Streamlit, please use the `spreadsheet` component. See documentation here: https://docs.trymito.io/mito-for-streamlit/getting-started")

    # If the user.json does not exist, we create it. This ensures if the file is deleted in between
    # when the package is imported and mitosheet.sheet is called, the user still gets a user.json. 
    # We don't need to upgrade as creating the file will automatically use the most recent version
    if not os.path.exists(USER_JSON_PATH):
        try_create_user_json_file()

    try:
        
        # Every Mitosheet has a different comm target, so they each create
        # a different channel to communicate over
        comm_target_id = get_new_id()

        # Create a new mito backend
        mito_backend = get_mito_backend(
            *args, 
            analysis_to_replay=analysis_to_replay, 
            user_defined_functions=sheet_functions,
            user_defined_importers=importers,
            user_defined_editors=editors,
            input_cell_execution_count=input_cell_execution_count
        )

        # Setup the comm target on this
        mito_backend = register_comm_target_on_mito_backend(
            mito_backend,
            comm_target_id
        )

    except:
        log('mitosheet_sheet_call_failed', failed=True)
        raise


    # Then, we log that the call was successful, along with all of it's params
    log(
        'mitosheet_sheet_call',
        {
            # NOTE: analysis name is the UUID that mito saves the analysis under
            'steps_manager_analysis_name': mito_backend.steps_manager.analysis_name,
            'num_args': len(args),
            'num_str_args': len([arg for arg in args if isinstance(arg, str)]),
            'num_df_args': len([arg for arg in args if isinstance(arg, pd.DataFrame)]),
            'df_index_type': [str(type(arg.index)) for arg in args if isinstance(arg, pd.DataFrame)],
        }
    )

    div_id = get_new_id()
    kernel_id = get_current_kernel_id()

    js_code = get_mito_frontend_code(kernel_id, comm_target_id, div_id, mito_backend)

    display(HTML(f"""<div id={div_id} class="mito-container-container">
        <script>
            {js_code}
        </script>
    </div>""")) # type: ignore


