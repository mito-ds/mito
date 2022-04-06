#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Mito currently collects logs on basic user interactions with the app, 
so that we can improve the tool.

However, _we collect no logs that contain personal user data_. No private
data is taken from the users computer, as can be verified by this app.

Our general approach to logging can be understood as:
0. Log no information about the data users use in Mito. Not a drop!
1. Users are identified by a single random ID that we generate on the client-side, 
   here. We store this in the ~/.mito/user.json file, and we use it as the permanent
   ID for all users.
2. All logging is on the backend. This avoids us worrying about blockers or needing
   to associate with ad-tech at all.
3. We generate a single log event for a single action taken by the user. That means that if
   the user takes an action that causes an error, the error is logged _with_ that action.

   This appears to be good practice, as it allows us to associate what actions are taken
   with their result very effectively!
"""
import platform
import subprocess
import sys
import time
from typing import Any, Dict, List

from mitosheet.parser import parse_formula
from mitosheet.types import StepsManagerType
from mitosheet.user.schemas import UJ_MITOSHEET_TELEMETRY
from mitosheet.user.location import get_location, is_docker

try:
    from jupyterlab import __version__ as jupyterlab_version
except:
    jupyterlab_version = 'No JupyterLab'
try:
    from notebook import __version__ as notebook_version
except:
    notebook_version = 'No notebook'

import analytics

# Write key taken from segement.com
analytics.write_key = '6I7ptc5wcIGC4WZ0N1t0NXvvAbjRGUgX' 

from mitosheet._version import __version__, package_name
from mitosheet.errors import MitoError, get_recent_traceback_as_list
from mitosheet.user import (UJ_FEEDBACKS, UJ_INTENDED_BEHAVIOR,
                            UJ_STATIC_USER_ID, UJ_USER_EMAIL, UJ_USER_SALT,
                            get_user_field, is_local_deployment,
                            is_running_test)


def telemetry_turned_on() -> bool:
    """
    Helper function that tells if you if logging is turned on or
    turned off on the entire Mito instance
    """
    # If the current package is mitosheet-private, then we don't log anything,
    # ever, under any circumstances - this is a custom distribution for a client
    if package_name == 'mitosheet-private':
        return False

    telemetry = get_user_field(UJ_MITOSHEET_TELEMETRY) 
    return telemetry if telemetry is not None else False

# When we anonymize, we use some combination of these words
# to construct new private words
valid_words = ['cat', 'dog', 'hat', 'time', 'person', 'year', 'way', 'thing', 'man', 'world', 'life', 'born', 'part', 'child', 'eye', 'woman', 'place', 'work', 'fall', 'case', 'point', 'company', 'number', 'group', 'problem', 'fact']

# We use the same salt to anonymize_words, and we read
# this salt in once the function is called for the first
# time, to make sure it's initialized properly
salt = None
def anonymize_word(word: Any) -> str:
    """
    Helper function that turns a column header into
    a totally anonymous version of the column header,
    as to not leak _any_ user data
    """
    # We make sure that the salt is read in after the entire
    # app has been initalized, so that we don't have to read
    # from the file all the time
    global salt
    if salt is None:
        salt = get_user_field(UJ_USER_SALT)

    word = str(word)

    # We select three indexes from the valid_words list, and concatenate them
    index_one = int(hash(salt + word + '0')) % len(valid_words)
    index_two = int(hash(salt + word + '1')) % len(valid_words)
    index_three = int(hash(salt + word + '2')) % len(valid_words)

    return valid_words[index_one] + valid_words[index_two] + valid_words[index_three]


def anonymize_formula(formula: str, sheet_index: int, steps_manager: StepsManagerType=None) -> str:
    """
    Helper function that anonymizes formula to 
    make sure that no private data is included in it.
    """
    if steps_manager is None:
        return anonymize_word(formula)

    # We just input a random address, as we don't use it
    _, _, dependencies = parse_formula(
        formula, 
        'A', 
        steps_manager.dfs[sheet_index].columns,
        throw_errors=False
    )
    
    for dependency in dependencies:
        formula = formula.replace(str(dependency), anonymize_word(dependency))
    
    return formula

def get_jupyter_labextension_list():
    """
    This gets the current output from the command `jupyter labextension list`
    which is very helpful in debugging the users installation.

    Because this function can be _very_ expensive to run for some users, we should
    only use this sparingly and not during every log event!

    Further note: this function is non critical, so we do _not_ throw errors
    when this fails, and instead just log the error and continue.
    """
    try:
        completed_process_mitosheet3 = subprocess.run([sys.executable, '-m', 'jupyter', 'labextension', 'list'], capture_output=True)
        all_output = completed_process_mitosheet3.stdout.decode() + completed_process_mitosheet3.stderr.decode()
        return all_output.splitlines()
    except Exception as e:
        log_recent_error('get_jupyerlab_extension_list_failed')
        return []

def get_installed_mitosheets_pip_show():
    """
    This gets the version of mitosheet and mitosheet3 that are installed
    through pip, which allows us to see if the installed version of mitosheet
    is actually what is running. This allows us to determine if the user has
    failed to refresh their kernel!

    Because this function can be expensive to run for some users, we should
    only use this sparingly and not during every log event!

    Further note: this function is non critical, so we do _not_ throw errors
    when this fails, and instead just log the error and continue.
    """
    try:
        completed_process_mitosheet3 = subprocess.run([sys.executable, '-m', 'pip', 'show', 'mitosheet3'], capture_output=True)
        all_output = completed_process_mitosheet3.stdout.decode() + completed_process_mitosheet3.stderr.decode()
        
        completed_process_mitosheet = subprocess.run([sys.executable, '-m', 'pip', 'show', 'mitosheet'], capture_output=True)
        all_output += completed_process_mitosheet.stdout.decode() + completed_process_mitosheet.stderr.decode()
        return all_output.splitlines()
    except Exception as e:
        log_recent_error('get_installed_mitosheets_pip_show_failed')
        return []


# We only calculate the location once so that we don't cause performance issues
location = None

def log(log_event: str, params: Dict[Any, Any]=None, steps_manager: StepsManagerType=None) -> None:
    """
    Helper function that logs an event with the given parameters. However,
    this function is also responsible for making sure _zero_ private data
    leaves the users computer.

    To accomplish this, we anonymize all data. To do so, we hash this data
    with a private secret that only the user has, making it impossible
    for us to brute force it.
    """

    if params is None:
        params = {}

    global location
    if location is None:
        location = get_location()
    
    # Add the python properties to every log event we can
    python_properties = {
        'version_python': sys.version_info,
        'version_jupyterlab': jupyterlab_version,
        'version_notebook': notebook_version,
        'version_mito': __version__,
        'package_name': package_name,
        'location': location,
        'is_docker': is_docker()
    }

    # Add some data about where this is being run from, so we make sure we
    # support users systems
    
    params = dict(
        **params,
        **python_properties
    )

    # Private params are where we _make sure_ that no private
    # user data leaves the user's machine. We replace any potentially
    # non-private params with private versions of them.
    private_params: Dict[str, Any] = {}
    try:
        for key, value in params.items():
            # We take any of the items that contain private user data, and we anonymize them
            if ('rows' in key and 'skiprows' not in key) or 'columns' in key or 'selected_column_ids' in key:
                # We anonymize all of the column headers in any list
                private_params[key] = [anonymize_word(v) for v in value]
            elif ('column_header' in key \
                or 'column_id' in key \
                or 'df_name' in key \
                or 'dataframe_name' in key \
                or 'analysis_name' in key \
                or 'merge_key' in key ) \
                and 'index' not in key:
                private_params[key] = anonymize_word(value)
            elif 'formula' in key:
                # We make sure to remove any private references from a formula
                private_params[key] = anonymize_formula(value, params['params_sheet_index'], steps_manager)
            elif 'file_names' in key:
                # Just count the number of files, instead of keeping their names
                private_params[key] = len(value)
            elif 'values' in key:
                # For pivot params, we anonymize the column headers
                # and keep the agg functions.
                private_params[key] = {anonymize_word(k): v for k, v in value.items()}
            elif 'filters' in key:
                # For filters, we get rid of the values, but keep the conditions
                # as well as if a value was put in
                filter_log: List[Any] = []

                for filter_or_group in value:
                    if 'filters' in filter_or_group:
                        filter_log.append([{'condition': filter_['condition'],'value': len(str(filter_['value']))} for filter_ in filter_or_group['filters']])
                    else:
                        filter_log.append({'condition': filter_or_group['condition'],'value': len(str(filter_or_group['value']))})

                private_params[key] = filter_log
            elif 'old_value' in key:
                private_params[key] = anonymize_word(value)
            elif 'new_value' in key:
                private_params[key] = anonymize_word(value)
            elif 'import_summaries' in key:
                if value is not None:
                    private_params[key] = len(value)
                else:
                    private_params[key] = value
            elif 'graph_creation' in key:
                # Don't log the column ids in the graph, just log the number of series graphed
                private_params['params_x_axis_column_ids'] = len(value['x_axis_column_ids'])
                private_params['params_y_axis_column_ids'] = len(value['y_axis_column_ids'])
                private_params['params_color'] = True if 'color' in value.keys() else False
            elif 'graph_styling' in key:
                private_params['params_title'] = True if 'title' in value['title'] else False
                private_params['params_title_visible'] = value['title']['visible']
                private_params['params_xaxis_title'] = True if 'title' in value['xaxis'] else False
                private_params['params_xaxis_title_visible'] = value['xaxis']['visible']
                private_params['params_xaxis_rangeslider_visible'] = value['xaxis']['rangeslider']['visible']
                private_params['params_yaxis_title'] = True if 'title' in value['yaxis'] else False
                private_params['params_yaxis_title_visible'] = value['yaxis']['visible']
                private_params['params_showlegend'] = value['showlegend']
            elif 'sheet_index' in key:
                private_params[key] = value
                # Make sure the steps manager exists, and the source is in bounds
                if steps_manager and len(steps_manager.curr_step.df_sources) > value:
                    private_params[key + '_df_source'] = steps_manager.curr_step.df_sources[value]
            else:
                private_params[key] = value
    except:
        # We log if we fail to build the private logs, so that we 
        # know that we have some issues here
        private_params['failed_building'] = True
        try:
            # Try and log a bit more about the error so we know why it failed
            recent_traceback = get_recent_traceback_as_list()
            private_params['error_traceback'] = recent_traceback
            private_params['error_traceback_last_line'] = recent_traceback[-1] 
        except:
            pass
    

    # NOTE: we do not log anything when tests are running, or if telemetry
    # is turned off. NOTE: we do this check at the end to catch bugs that 
    # might exist in the above logging code
    if not is_running_test() and telemetry_turned_on():
        analytics.track(
            get_user_field(UJ_STATIC_USER_ID), 
            log_event, 
            private_params
        )


def identify() -> None:
    """
    Helper function for identifying a user. We just take
    their python version, mito version, and email.
    """
    if not telemetry_turned_on():
        return

    static_user_id = get_user_field(UJ_STATIC_USER_ID)
    user_email = get_user_field(UJ_USER_EMAIL)
    intended_behavior = get_user_field(UJ_INTENDED_BEHAVIOR)
    feedbacks = get_user_field(UJ_FEEDBACKS)
    local = is_local_deployment()
    operating_system = platform.system()

    
    if not is_running_test():
        # NOTE: we do not log anything when tests are running
        analytics.identify(static_user_id, {
            'version_python': sys.version_info,
            'version_sys': sys.version,
            'version_mito': __version__,
            'package_name': package_name, 
            'version_jupyterlab': jupyterlab_version,
            'version_notebook': notebook_version,
            'operating_system': operating_system,
            'email': user_email,
            'local': local,
            UJ_INTENDED_BEHAVIOR: intended_behavior,
            UJ_FEEDBACKS: feedbacks
        })


def log_recent_error(log_event: str=None) -> None:
    """
    A helper function for logging the most recent error that has occured.

    log_event defaults to an execution_error_log_event
    """
    if log_event is None:
        log_event = 'execution_error_log_event'

    # We get the error, see more here: https://wiki.python.org/moin/HandlingExceptions
    e = sys.exc_info()[0]

    # If we have some other error, we just report this as an execution error
    log(
        log_event, 
        {
            'header': 'Execution Error', 
            'to_fix': 'Sorry, there was an error during executing this code.',
            'error': str(e),
            'traceback': get_recent_traceback_as_list()
        }
    )


def log_event_processed(event: Dict[str, Any], steps_manager: StepsManagerType, failed: bool=False, mito_error: MitoError=None, start_time: float=None) -> None:
    """
    Helper function for logging when an event is processed
    by the widget state container. 

    Does it's best to fill in helpful meta-data for interpreting the event
    including the state of the steps_manager _after_ the step
    was applied.

    NOTE: if processing the event fails, then failed should be True. If there was an
    edit error that was thrown during the processing of the event, then edit_error
    should be set to that error.
    """
    try:
        # First, we get all the params of the event, and append them with _params_
        if 'params' in event:
            # If this is an edit event, then, we get the params from the params
            # key all at once
            event_properties = {
                'params_' + key: value for key, value in event['params'].items()
            }

            # Try to log execution data for this step as well 
            try:
                if steps_manager and steps_manager.curr_step.execution_data:
                    execution_data_properties = {
                        'execution_data_' + key: value for key, value in steps_manager.curr_step.execution_data.items()
                    }
                    event_properties = {**event_properties, **execution_data_properties}
            except:
                pass
        else:
            # Otherwise, we get the params from the highest level of the event 
            event_properties = {
                'params_' + key: value for key, value in event.items()
            }

        # We also get some metadata about the widget state container at this state
        # NOTE: we keep this as underscored with wsc for backwards compatibility with
        # our logs!
        steps_manager_properties = {
            'wsc_analysis_name': steps_manager.analysis_name,
            # NOTE: Change this when code fixing this logic is merged in
            'wsc_data_type_in_mito': str(steps_manager.data_type_in_mito),
            'wsc_local': is_local_deployment(),
            'wsc_curr_step_idx': steps_manager.curr_step_idx,
            'wsc_curr_step_type': steps_manager.curr_step.step_type,
        }

        # We also check there is an edit_error, and if there is, then we add the error logs
        if mito_error is not None:
            recent_traceback = get_recent_traceback_as_list()
            error_properties = {
                'error_type': mito_error.type_,
                'error_header': mito_error.header,
                'error_to_fix': mito_error.to_fix,
                'error_traceback': recent_traceback,
                # We get the last line of the error as it makes it much easier
                # to easily analyze on error messages 
                'error_traceback_last_line': recent_traceback[-1],
            }
        elif failed:
            # Otherwise, if there is no edit_error, and we still failed, then we must have
            # gotten an execution error
            recent_traceback = get_recent_traceback_as_list()
            error_properties = {
                'error_type': 'execution_error',
                'error_header': 'Execution Error',
                'error_traceback': recent_traceback,
                # We get the last line of the error as it makes it much easier
                # to easily analyze on error messages
                'error_traceback_last_line': recent_traceback[-1],
            }
        else:
            error_properties = {}

        # We also log some timing information - which we round to a single decimal place just
        # so that we can bucket these items easily. Note we include a variety of roundings of 
        # the time, so that we can make sure to aggregate in Mixpanel well (which will die if 
        # it is given to many values).
        if start_time is not None:
            processing_time = time.perf_counter() - start_time
            event_properties['processing_time'] = round(processing_time, 1)
            event_properties['processing_time_seconds'] = int(round(processing_time, 0))
            event_properties['processing_time_seconds_ten'] = int(round(processing_time, -1))
            event_properties['processing_time_seconds_hundred'] = int(round(processing_time, -2))

            # If we just did an update, and this update has a pandas processing time, then we can calculate the
            # time that we spent as mito overhead vs. just 
            if steps_manager and steps_manager.curr_step.execution_data and 'pandas_processing_time' in steps_manager.curr_step.execution_data:
                pandas_processing_time = steps_manager.curr_step.execution_data['pandas_processing_time']
                event_properties['processing_time_pandas'] = round(pandas_processing_time, 1)
                event_properties['processing_time_pandas_seconds'] = int(round(pandas_processing_time, 0))
                event_properties['processing_time_pandas_seconds_ten'] = int(round(pandas_processing_time, -1))
                event_properties['processing_time_pandas_seconds_hundred'] = int(round(pandas_processing_time, -2))

                # And we explicitly calculate the overhead
                overhead_processing_time = round(processing_time - pandas_processing_time, 1)
                event_properties['processing_time_overhead'] = overhead_processing_time
                event_properties['processing_time_overhead_seconds'] = int(round(overhead_processing_time, 0))
                event_properties['processing_time_overhead_seconds_ten'] = int(round(overhead_processing_time, -1))
                event_properties['processing_time_overhead_seconds_hundred'] = int(round(overhead_processing_time, -2))

        # We choose to log the event type, as it is the best high-level item for our logs
        # and we append a _failed if the event failed in doing this.
        log_event: str = event['type'] + ('_failed' if failed else '')

        log(
            log_event, 
            dict(
                **event_properties,
                **steps_manager_properties,
                **error_properties
            ),
            steps_manager=steps_manager
        )

        if failed:
            # We also generate a double log in the case of errors, whenever anything fails. This allows
            # us to easily track the number of users who are getting errors
            log(
                'error', 
                dict(
                    log_event=log_event,
                    **event_properties,
                    **steps_manager_properties,
                    **error_properties
                ),
                steps_manager=steps_manager
            )
        else:
            # We also generate a single aggregate log for each of the different
            # types of events the user sends to the backend. As with the above, 
            # this allows us to easily aggregate across different types of events
            # and track general trends (at the cost of making the logs look a bit
            # messier to human eyes)
            if event['event'] == 'edit_event':
                log(
                    'edit_event', 
                    dict(
                        log_event=log_event,
                        **event_properties,
                        **steps_manager_properties,
                        **error_properties
                    ),
                    steps_manager=steps_manager
                )
            elif event['event'] == 'update_event':
                log(
                    'update_event', 
                    dict(
                        log_event=log_event,
                        **event_properties,
                        **steps_manager_properties,
                        **error_properties
                    ),
                    steps_manager=steps_manager
                )
            elif event['event'] == 'api_call':
                log(
                    'api_call', 
                    dict(
                        log_event=log_event,
                        **event_properties,
                        **steps_manager_properties,
                        **error_properties
                    ),
                    steps_manager=steps_manager
                )
    except:
        # We don't want logging to ever brick the application, so if the logging fails
        # we just log simple information about the event. This should never occur, but it
        # is just a precaution - some defensive programming so to speak
        log(
            event['type'],
        )
