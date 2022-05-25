#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains handlers for the Mito API
"""
from queue import Queue
from threading import Thread
from typing import Any, Callable, Dict, List, NoReturn, Union
from mitosheet.api.get_params import get_params
from mitosheet.api.get_column_describe import get_column_describe
from mitosheet.api.get_datafiles import get_datafiles
from mitosheet.api.get_dataframe_as_csv import get_dataframe_as_csv
from mitosheet.api.get_dataframe_as_excel import get_dataframe_as_excel
from mitosheet.api.get_excel_file_metadata import get_excel_file_metadata
from mitosheet.api.get_path_contents import get_path_contents
from mitosheet.api.get_path_join import get_path_join
from mitosheet.api.get_search_matches import get_search_matches
from mitosheet.api.get_unique_value_counts import get_unique_value_counts
from mitosheet.api.get_column_summary_graph import get_column_summary_graph
from mitosheet.telemetry.telemetry_utils import log_event_processed
from mitosheet.steps_manager import StepsManager

# As the column summary statistics tab does three calls, we defaulted to this max
MAX_QUEUED_API_CALLS = 3

# NOTE: BE CAREFUL WITH THIS. When in development mode, you can set it to False
# so the API calls are handled in the main thread, to make printing easy
THREADED = True


class API:
    """
    The API provides a wrapper around a thread that responds to API calls.

    Some notes:
    -   We allow at most MAX_QUEUED_API_CALLS API calls to be in the queue, which practically
        Stops a backlog of calls from building up.
    -   All API calls should only be reads. This stops us from having to worry
        about most concurrency issues
    -   Note that printing inside of a thread does not work properly! Use sys.stdout.flush() after the print statement.
        See here: https://stackoverflow.com/questions/18234469/python-multithreaded-print-statements-delayed-until-all-threads-complete-executi
    """

    def __init__(self, steps_manager: StepsManager, send: Callable):
        self.api_queue: Queue = Queue(MAX_QUEUED_API_CALLS)
        # Note that we make the thread a daemon thread, which practically means that when
        # The process that starts this thread terminate, our API will terminate as well.
        self.thread = Thread(
            target=handle_api_event_thread,
            args=(self.api_queue, steps_manager, send),
            daemon=True,
        )
        self.thread.start()

        # Save some variables for ease
        self.steps_manager = steps_manager
        self.send = send

    def process_new_api_call(self, event: Dict[str, Any]) -> None:
        """
        We privilege new API calls over old calls, and evict the old ones
        if the API queue is full.

        Because we are using a queue, only events that have not been started
        being processed will get removed.

        If the key 'priority' is in the event, then we handle it in the main
        thread, as we don't want to drop the event. For example, lazy loading
        data has priority!
        """
        if THREADED and "priority" not in event:
            if self.api_queue.full():
                self.api_queue.get()
            self.api_queue.put(event)
        else:
            handle_api_event(self.send, event, self.steps_manager)


def handle_api_event_thread(
    queue: Queue, steps_manager: StepsManager, send: Callable
) -> NoReturn:
    """
    This is the worker thread function, that actually is
    responsible for handling at the API call events.

    It lives forever, and just handles events as it
    receives them from the queue
    """
    while True:
        # Note that this blocks when there is nothing in the queue,
        # and waits till there is something there - so no infinite
        # loop as it is waiting!
        event = queue.get()
        # We place the API handling inside of a try catch,
        # because otherwise if an error is thrown, then the entire thread crashes,
        # and then the API never works again
        try:
            handle_api_event(send, event, steps_manager)
        except:
            # Log in error if it occurs
            log_event_processed(event, steps_manager, failed=True)


def handle_api_event(
    send: Callable, event: Dict[str, Any], steps_manager: StepsManager
) -> None:
    """
    Handler for all API calls. Note that any response to the
    API must return the same ID that the incoming message contains,
    so that the frontend knows how to match the responses.
    """
    result: Union[str, List[str]]
    params = event['params']
    if event["type"] == "datafiles":
        result = get_datafiles(params)
    elif event["type"] == "get_path_contents":
        result = get_path_contents(params)
    elif event["type"] == "get_path_join":
        result = get_path_join(params)
    elif event["type"] == "get_dataframe_as_csv":
        result = get_dataframe_as_csv(params, steps_manager)
    elif event["type"] == "get_column_summary_graph":
        result = get_column_summary_graph(params, steps_manager)
    elif event["type"] == "get_column_describe":
        result = get_column_describe(params, steps_manager)
    elif event["type"] == "get_params":
        result = get_params(params, steps_manager)
    elif event["type"] == "get_excel_file_metadata":
        result = get_excel_file_metadata(params, steps_manager)
    elif event["type"] == "get_unique_value_counts":
        result = get_unique_value_counts(params, steps_manager)
    elif event["type"] == "get_search_matches":
        result = get_search_matches(params, steps_manager)
    elif event["type"] == "get_dataframe_as_excel":
        result = get_dataframe_as_excel(params, steps_manager)
    else:
        raise Exception(f"Event: {event} is not a valid API call")

    send({"event": "api_response", "id": event["id"], "data": result})
