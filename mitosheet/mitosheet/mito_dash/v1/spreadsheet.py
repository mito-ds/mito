import gc
from io import StringIO
import json
import time
from queue import Queue
from typing import Any, Callable, Dict, List, Optional, Union, Tuple
from unittest.mock import patch

import pandas as pd
from dash.development.base_component import Component

from dash import Input, Output, callback, State
from mitosheet.mito_backend import MitoBackend
from mitosheet.selectionUtils import get_selected_element
from mitosheet.utils import get_new_id, get_random_id
from mitosheet.types import CodeOptions



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

    def __init__(
            self, 
            *args: Union[pd.DataFrame, str, None],
            id: str,
            import_folder: Optional[str]=None,
            code_options: Optional[CodeOptions]=None,
            df_names: Optional[List[str]]=None,
            sheet_functions: Optional[List[Callable]]=None, 
            importers: Optional[List[Callable]]=None
    ):     
        self.mito_id = id
        self._set_new_mito_backend(
            *args, 
            import_folder=import_folder, 
            code_options=code_options,
            df_names=df_names,
            sheet_functions=sheet_functions,
            importers=importers
        )

        super(Spreadsheet, self).__init__(
            id=id,
            all_json=self.get_all_json(),
        )

        # We save the unprocessed messages in a list -- so that we can process them
        # in the callback in the order that they were received -- without them interrupting
        # eachother and having to deal with race conditions
        self.unprocessed_messages: Any = Queue()
        self.processing_messages = False

        self.index_and_selections: Optional[pd.DataFrame] = None

        # Make sure to save import-folder and code-options as attributes, so if we need
        # to recreate the backend, we can do so
        self.import_folder = import_folder
        self.code_options = code_options
        self.df_names = df_names
        self.sheet_functions = sheet_functions
        self.importers = importers


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
            else:
                raise Exception(f"Unsupported data type {type(df_in_json)}")

            self._set_new_mito_backend(
                df, 
                import_folder=self.import_folder, 
                code_options=self.code_options,
                df_names=self.df_names,
                sheet_functions=self.sheet_functions,
                importers=self.importers
            )
            return self.get_all_json()
        
    def _set_new_mito_backend(
            self, 
            *args: Union[pd.DataFrame, str, None], 
            import_folder: Optional[str]=None,
            code_options: Optional[CodeOptions]=None,
            df_names: Optional[List[str]]=None,
            sheet_functions: Optional[List[Callable]]=None, 
            importers: Optional[List[Callable]]=None
        ) -> None:
        """
        Called when the component is created, or when the input data is changed.
        """
        self.mito_frontend_key = get_random_id()
        self.mito_backend = MitoBackend(
            *args, 
            import_folder=import_folder, 
            code_options=code_options,
            user_defined_functions=sheet_functions,
            user_defined_importers=importers,
        )
        self.responses: List[Dict[str, Any]] = []
        def send(response):
            self.responses.append(response)
        self.mito_backend.mito_send = send

        # If there are any df_names, then we send them to the backend as well. 
        # TODO: we should be able to pass this directly to the backend
        if df_names is not None and len(df_names) > 0:
            self.mito_backend.receive_message(
                {
                    'event': 'update_event',
                    'id': get_new_id(),
                    'type': 'args_update',
                    'params': {
                        'args': df_names
                    },
                }
            )
        
            
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
        
        
    def get_all_json(self) -> str:
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
    
# TODO: I think we have to support lists of Inputs and Outputs and States
# and we might also have to support named Inputs and Outputs and States (e.g. keyword args)
def get_spreadsheet_id_and_indexes_in_callback_args(*args: Union[Output, Input, State]) -> List[Tuple[str, int, int]]:
    """
    Returns a list of all the Input components that are Spreadsheet components, and their indexes

    TODO: maybe need to handle lists of Outputs and Inputs and States
    """
    result = []
    callback_index = 0
    for index, arg in enumerate(args):


        if (isinstance(arg, Input) or isinstance(arg, State)) and arg.component_id is not None:
            component_id = arg.component_id
            component_property = arg.component_property

            # Mito currently supports the following properities:
            # - mito_spreadsheet_result

            if component_property == 'mito_spreadsheet_result':
                result.append((component_id, index, callback_index))

            # If they try and access other properties of the Spreadsheet component, we raise an error
            if component_property in ['all_json', ]:
                raise Exception(f"Cannot access property {component_property} of Spreadsheet component with id {component_id}. Please only access the mito_spreadsheet_result property.")

        if (isinstance(arg, Input) or isinstance(arg, State)):
            callback_index += 1
            
    return result


def mito_callback(*args, **kwargs):
    # First, check if there are any args that are Inputs that contain a mito_id
    indexes = get_spreadsheet_id_and_indexes_in_callback_args(*args)

    # If there are no spreadsheet input components, then we just call the regular callback
    if len(indexes) == 0:
        return callback(*args, **kwargs)
    
    else:

        def function_wrapper(original_function):
            def new_function(*_args, **_kwargs):
                new_args = list(_args)
                for id, index, callback_index in indexes:
                    spreadsheet = get_component_with_id(id)
                    if spreadsheet is None:
                        # TODO: use a more dash exception  
                        raise Exception(f"Could not find spreadsheet with id {id}")
                    new_args[callback_index] = spreadsheet.get_result()

                return original_function(*new_args, **_kwargs)
            
            new_args = list(args)
                
            for id, index, _ in indexes:
                if isinstance(new_args[index], Input):
                    new_args[index] = Input(id, 'all_json')
                else:
                    new_args[index] = State(id, 'all_json')

            return callback(*new_args, **kwargs)(new_function)
        
        return function_wrapper