#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Main file containing the mito widget.
"""
import json
import time
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import traitlets as t
from ipywidgets import DOMWidget

from mitosheet._frontend import module_name, module_version
from mitosheet.api import API
from mitosheet.data_in_mito import DataTypeInMito
from mitosheet.errors import (MitoError, get_recent_traceback,
                              make_execution_error)
from mitosheet.saved_analyses import write_analysis
from mitosheet.steps_manager import StepsManager
from mitosheet.telemetry.telemetry_utils import (log, log_event_processed,
                                                 telemetry_turned_on)
from mitosheet.updates.replay_analysis import REPLAY_ANALYSIS_UPDATE
from mitosheet.user import is_local_deployment, should_upgrade_mitosheet
from mitosheet.user.db import get_user_field
from mitosheet.user.location import is_in_google_colab, is_in_vs_code
from mitosheet.user.schemas import (UJ_MITOSHEET_LAST_FIFTY_USAGES,
                                    UJ_RECEIVED_TOURS, UJ_USER_EMAIL)
from mitosheet.user.utils import is_excel_import_enabled, is_pro


class MitoWidget(DOMWidget):
    """
        The MitoWidget holds all of the backend state for the Mito extension, and syncs
        the state with the frontend widget. 
    """
    _model_name = t.Unicode('ExampleModel').tag(sync=True) # type: ignore
    _model_module = t.Unicode(module_name).tag(sync=True) # type: ignore
    _model_module_version = t.Unicode(module_version).tag(sync=True) # type: ignore
    _view_name = t.Unicode('ExampleView').tag(sync=True) # type: ignore
    _view_module = t.Unicode(module_name).tag(sync=True) # type: ignore
    _view_module_version = t.Unicode(module_version).tag(sync=True) # type: ignore

    sheet_data_json = t.Unicode('').tag(sync=True) # type: ignore
    analysis_data_json = t.Unicode('').tag(sync=True) # type: ignore
    user_profile_json = t.Unicode('').tag(sync=True) # type: ignore
    
    def __init__(self, *args: List[Union[pd.DataFrame, str]], analysis_to_replay: str=None):
        """
        Takes a list of dataframes and strings that are paths to CSV files
        passed through *args.
        """
        # Call the DOMWidget constructor to set up the widget properly
        super(MitoWidget, self).__init__()
            
        # Set up the state container to hold private widget state
        self.steps_manager = StepsManager(args, analysis_to_replay=analysis_to_replay)

        # Set up message handler
        self.on_msg(self.receive_message)

        # And the api
        self.api = API(self.steps_manager, self.send)

        # We store static variables to make writing the shared
        # state variables quicker; we store them so we don't 
        # have to recompute them on each update
        last_50_usages = get_user_field(UJ_MITOSHEET_LAST_FIFTY_USAGES)
        self.num_usages = len(last_50_usages if last_50_usages is not None else [])
        self.is_local_deployment = is_local_deployment()
        self.should_upgrade_mitosheet = should_upgrade_mitosheet()
        self.received_tours = get_user_field(UJ_RECEIVED_TOURS)

        # Set up starting shared state variables
        self.update_shared_state_variables()

    @property
    def analysis_name(self):
        return self.steps_manager.analysis_name


    def update_shared_state_variables(self) -> None:
        """
        Helper function for updating all the variables that are shared
        between the backend and the frontend through trailets.
        """
        self.sheet_data_json = self.steps_manager.sheet_data_json
        self.analysis_data_json = self.steps_manager.analysis_data_json
        self.user_profile_json = json.dumps({
            # Dynamic, update each time
            'userEmail': get_user_field(UJ_USER_EMAIL),
            'receivedTours': get_user_field(UJ_RECEIVED_TOURS),
            'isPro': is_pro(),
            'telemetryEnabled': telemetry_turned_on(),
            # Static over a single analysis
            'excelImportEnabled': is_excel_import_enabled(),
            'isLocalDeployment': self.is_local_deployment,
            'shouldUpgradeMitosheet': self.should_upgrade_mitosheet,
            'numUsages': self.num_usages,
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

        # We update the state variables 
        self.update_shared_state_variables()

        # Also, write the analysis to a file!
        write_analysis(self.steps_manager)

        # Tell the front-end to render the new sheet and new code with an empty
        # response. NOTE: in the future, we can actually send back some data
        # with the response (like an error), to get this response in-place!        
        self.send({
            'event': 'response',
            'id': event['id']
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

            # Update all state variables
            self.update_shared_state_variables()
        except:
            # We handle the case of replaying the analysis specially, because we don't
            # want to display the error modal - we want to display something specific
            # in this case. Note that we include the updating of shared state variables
            # in the try catch, as this is sometimes where errors occur
            if event["type"] == REPLAY_ANALYSIS_UPDATE['event_type']:
                raise make_execution_error(error_modal=False)
            raise
        # Also, write the analysis to a file!
        write_analysis(self.steps_manager)

        # Tell the front-end to render the new sheet and new code with an empty
        # response. NOTE: in the future, we can actually send back some data
        # with the response (like an error), to get this response in-place!
        self.send({
            'event': 'response',
            'id': event['id'],
        })

    def receive_message(self, widget: Any, content: Dict[str, Any], buffers: Any=None) -> bool:
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
            
            # NOTE: we don't need to case on log_event above because it always gets
            # passed to this function, and thus is logged.
            log_event_processed(event, self.steps_manager, start_time=start_time)

            return True
        except MitoError as e:
            
            # Log processing this event failed
            log_event_processed(event, self.steps_manager, failed=True, mito_error=e, start_time=start_time)

            # If the error says to ignore the error modal, then we
            # send some data with the response so that the frontend
            # knows to ignore the error moda 
            response = {
                'event': 'edit_error',
                'id': event['id'],
                'type': e.type_,
                'header': e.header,
                'to_fix': e.to_fix,
                'traceback': e.traceback,
            }
            if not e.error_modal:
                response['data'] = {
                    'event': 'edit_error',
                    'type': e.type_,
                    'header': e.header,
                    'to_fix': e.to_fix,
                    'traceback': e.traceback,
                }

            # Report it to the user, and then return
            self.send(response)
        except:
            # We log that processing failed, but have no edit error
            log_event_processed(event, self.steps_manager, failed=True, start_time=start_time)
            # Report it to the user, and then return
            self.send({
                'event': 'edit_error',
                'id': event['id'],
                'type': 'execution_error',
                'header': 'Execution Error',
                'to_fix': 'Sorry, there was an error during executing this code.',
                'traceback': get_recent_traceback()
            })

        return False

def sheet(
        *args: Any,
        analysis_to_replay: str=None, # This is the parameter that tracks the analysis that you want to replay (NOTE: requires a frontend to be replayed!)
        view_df: bool=False, # We use this param to log if the mitosheet.sheet call is created from the df output button,
        # NOTE: if you add named variables to this function, make sure argument parsing on the front-end still
        # works by updating the getArgsFromCellContent function.
    ) -> MitoWidget:
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
    if is_in_vs_code() or is_in_google_colab():
        log('mitosheet_sheet_call_location_failed', failed=True)
        raise Exception("The mitosheet currently only works in JupyterLab.\n\nTo see instructions on getting Mitosheet running in JupyterLab, find install instructions here: https://docs.trymito.io/getting-started/installing-mito")

    try:
        # We pass in the dataframes directly to the widget
        widget = MitoWidget(*args, analysis_to_replay=analysis_to_replay) 

        # Log they have personal data in the tool if they passed a dataframe
        # that is not tutorial data or sample data from import docs
        if widget.steps_manager.data_type_in_mito == DataTypeInMito.PERSONAL:
            log('used_personal_data') 

    except:
        log('mitosheet_sheet_call_failed', failed=True)
        raise

    # Then, we log that the call was successful, along with all of it's params
    log(
        'mitosheet_sheet_call',
        {
            # NOTE: analysis name is the UUID that mito saves the analysis under
            'steps_manager_analysis_name': widget.steps_manager.analysis_name,
            'num_args': len(args),
            'num_str_args': len([arg for arg in args if isinstance(arg, str)]),
            'num_df_args': len([arg for arg in args if isinstance(arg, pd.DataFrame)]),
            'df_index_type': [str(type(arg.index)) for arg in args if isinstance(arg, pd.DataFrame)],
            'view_df': view_df
        }
    )

    return widget
