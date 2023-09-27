import gc
from io import StringIO
import json
import time
from queue import Queue
from typing import Any, Dict, List, Optional, Union, Tuple
from unittest.mock import patch

import pandas as pd
from dash.development.base_component import Component, _explicitize_args

from dash import Input, Output, callback, State
from mitosheet.mito_backend import MitoBackend
from mitosheet.selectionUtils import get_selected_element
from mitosheet.utils import get_random_id


class SpreadsheetResult():

    def __init__(
        self, 
        dfs: List[pd.DataFrame],
        code: List[str],
        index_and_selections: Optional[Any]=None
    ):
        self.__dfs = dfs
        self.__code = code
        self.__index_and_selections = index_and_selections

    def dfs(self) -> List[pd.DataFrame]:
        return self.__dfs
    
    def code(self) -> str:
        return "\n".join(self.__code)
    
    def selection(self) -> Optional[Union[pd.DataFrame, pd.Series]]:
        return get_selected_element(self.__dfs, self.__index_and_selections)
     

class Spreadsheet(Component):

    _children_props: List[str] = []
    _base_nodes = ['children']
    _namespace = 'dash_spreadsheet_v1'
    _type = 'MitoDashWrapper'
    _prop_names = ['id', 'all_json', 'data', 'import_folder']
    _valid_wildcard_attributes: List[str] = []
    available_properties = ['id', 'all_json', 'data', 'import_folder']
    available_wildcard_properties: List[str] = []

    @_explicitize_args
    def __init__(
            self, 
            *args,
            **kwargs
    ):     
        self.mito_id = kwargs['id']
        self._set_new_mito_backend(*args, kwargs.get('import_folder'))

        _explicit_args = kwargs.pop('_explicit_args')

        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}
        args = {
            'id': self.mito_id, 
            'all_json': self.get_all_json()
        }

        super(Spreadsheet, self).__init__(**args)

        # We save the unprocessed messages in a list -- so that we can process them
        # in the callback in the order that they were received -- without them interrupting
        # eachother and having to deal with race conditions
        self.unprocessed_messages = Queue()
        self.processing_messages = False

        self.index_and_selections: Optional[pd.DataFrame] = None


        @callback(Output(self.mito_id, 'all_json', allow_duplicate=True), Input(self.mito_id, 'message'), prevent_initial_call=True)
        def handle_message(msg):

            if msg['type'] == 'selection_event':
                self.index_and_selections = msg['indexAndSelections']
            else:
                self.unprocessed_messages.put(msg)
                self.process_single_message()
            
            return self.get_all_json()

        @callback(Output(self.mito_id, 'all_json', allow_duplicate=True), Input(self.mito_id, 'data'), prevent_initial_call=True)
        def handle_data_change_data(df_in_json):
            
            # TODO: we should handle more data types. Namely, those that dash_table does
            if isinstance(df_in_json, str):
                df = pd.read_json(StringIO(df_in_json))
            elif isinstance(df_in_json, list):
                df = pd.DataFrame(df_in_json)

            self._set_new_mito_backend(df)
            return self.get_all_json()
        
    def _set_new_mito_backend(self, *args: Union[pd.DataFrame, str, None], import_folder: Optional[str]=None) -> None:
        """
        Called when the component is created, or when the input data is changed.
        """
        self.mito_frontend_key = get_random_id()
        self.mito_backend = MitoBackend(*args, import_folder=import_folder)
        self.responses: List[Dict[str, Any]] = []
        def send(response):
            self.responses.append(response)
        self.mito_backend.mito_send = send
        
            
    def process_single_message(self):

        # If we are already processing messages -- then wait until it is
        if self.processing_messages:
            while self.processing_messages:
                time.sleep(0.1)
            
        # Otherwise, set the processing flag to true
        self.processing_messages = True

        # Process all the messages in the queue
        try:
            if not self.unprocessed_messages.empty():
                value = self.unprocessed_messages.get()
                self.mito_backend.receive_message(value)
        except:
            # Make sure we always set the processing flag to false
            pass
            
        # Set the processing flag to false
        self.processing_messages = False
        
        
    def get_all_json(self):
        return json.dumps({
            **self.mito_backend.get_shared_state_variables(),
            'responses_json': json.dumps(self.responses),
            'key': self.mito_frontend_key
        })
    
    def get_result(self):
        return SpreadsheetResult(
            dfs=self.mito_backend.steps_manager.dfs,
            code=self.mito_backend.steps_manager.code(),
            index_and_selections=self.index_and_selections
        )
    
def get_component_with_id(id: str) -> Optional[Spreadsheet]:
    components = [
        obj for obj in gc.get_objects()
        if isinstance(obj, Spreadsheet) and getattr(obj, 'mito_id', None) == id
    ]

    if len(components) > 0:
        return components[0]
    else:
        return None
    
def get_spreadsheets_and_index_in_callback_args(*args) -> List[Tuple[int, int, Spreadsheet]]:
    """
    Returns a list of all the Input components that are Spreadsheet components, and their indexes
    """
    result = []
    callback_index = 0
    for index, arg in enumerate(args):


        if (isinstance(arg, Input) or isinstance(arg, State)) and arg.component_id is not None:
            spreadsheet = get_component_with_id(arg.component_id)
            if spreadsheet is not None and isinstance(spreadsheet, Spreadsheet):
                result.append((index, callback_index, spreadsheet))

        if (isinstance(arg, Input) or isinstance(arg, State)):
            callback_index += 1
            
    return result


def mito_callback(*args, **kwargs):
    # First, check if there are any args that are Inputs that contain a mito_id
    spreadsheet_components = get_spreadsheets_and_index_in_callback_args(*args)

    # If there are no spreadsheet input components, then we just call the regular callback
    if len(spreadsheet_components) == 0:
        return callback(*args, **kwargs)
    
    else:

        def function_wrapper(original_function):
            def new_function(*_args, **_kwargs):
                new_args = list(_args)
                for _, callback_index, spreadsheet in spreadsheet_components:
                    new_args[callback_index] = spreadsheet.get_result()

                return original_function(*new_args, **_kwargs)
            
            new_args = list(args)
                
            for index, _, spreadsheet in spreadsheet_components:
                if isinstance(new_args[index], Input):
                    new_args[index] = Input(spreadsheet.mito_id, 'all_json')
                else:
                    new_args[index] = State(spreadsheet.mito_id, 'all_json')

            return callback(*new_args, **kwargs)(new_function)
        
        return function_wrapper