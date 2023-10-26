import gc
from io import StringIO
import json
import time
from queue import Queue
from typing import Any, Callable, Dict, List, Optional, Union, Tuple
from unittest.mock import patch

import pandas as pd
from mitosheet.mito_backend import MitoBackend
from mitosheet.selectionUtils import get_selected_element
from mitosheet.utils import get_new_id, get_new_id
from mitosheet.types import CodeOptions, MitoTheme, MitoFrontendIndexAndSelections, ParamMetadata
from mitosheet.streamlit.v1 import RunnableAnalysis


class SpreadsheetResult():

    def __init__(
        self, 
        dfs: List[pd.DataFrame],
        code: List[str],
        fully_parameterized_function: str,
        param_metadata: List[ParamMetadata],
        code_options: CodeOptions,
        index_and_selections: Optional[MitoFrontendIndexAndSelections]=None
    ):
        self.__dfs = dfs
        self.__code = code
        self.__index_and_selections = index_and_selections
        self.__fully_parameterized_function = fully_parameterized_function
        self.__param_metadata = param_metadata
        self.__code_options = code_options

    def dfs(self) -> List[pd.DataFrame]:
        return self.__dfs
    
    def code(self) -> str:
        return "\n".join(self.__code)
    
    def selection(self) -> Optional[Union[pd.DataFrame, pd.Series]]:
        return get_selected_element(self.__dfs, self.__index_and_selections)
    
    def analysis(self) -> RunnableAnalysis:
        return RunnableAnalysis(self.code(), self.__code_options, self.__fully_parameterized_function, self.__param_metadata)
    
WRONG_CALLBACK_ERROR_MESSAGE = """Error: Registering a callback with an Input or State referencing a Mito Spreadsheet requires using the @mito_callback decorator, rather than the @callback decorator.

To get the proper value from the {prop_name}, change your callback to use the @mito_callback decorator instead of the @callback decorator.

See more: https://docs.trymito.io/mito-for-dash/api-reference#callback-props-and-types

{num_messages}
{prop_name}
{id}"""
         
try:
    from dash.development.base_component import Component
    from dash import Input, Output, callback, State


    class Spreadsheet(Component):

        _children_props: List[str] = []
        _base_nodes = ['children']
        _namespace = 'dash_spreadsheet_v1'
        _type = 'MitoDashWrapper'
        _prop_names = ['id', 'all_json', 'data', 'import_folder', 'spreadsheet_result', 'spreadsheet_selection']
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
                importers: Optional[List[Callable]]=None,
                editors: Optional[List[Callable]]=None,
                theme: Optional[MitoTheme]=None,
                track_selection: bool=False,
                
        ):     
            self.mito_id = id
            # Note: num_messages must be ever increasing, so that whenever we get a new message, the spreadsheet_result
            # and spreadsheet_selection error strings change. This way, we can correctly trigger callbacks that correspond
            # to these values in all cases
            self.num_messages=0
            self._set_new_mito_backend(
                *args, 
                import_folder=import_folder, 
                code_options=code_options,
                df_names=df_names,
                sheet_functions=sheet_functions,
                importers=importers,
                editors=editors,
                theme=theme
            )

            self.track_selection = track_selection

            super(Spreadsheet, self).__init__(
                id=id,
                all_json=self.get_all_json(),
            )

            # We save the unprocessed messages in a list -- so that we can process them
            # in the callback in the order that they were received -- without them interrupting
            # eachother and having to deal with race conditions
            self.unprocessed_messages: Any = Queue()
            self.processing_messages = False

            self.index_and_selections: Optional[MitoFrontendIndexAndSelections] = None

            # Make sure to save import-folder and code-options as attributes, so if we need
            # to recreate the backend, we can do so
            self.import_folder = import_folder
            self.code_options = code_options
            self.df_names = df_names
            self.sheet_functions = sheet_functions
            self.importers = importers
            self.editors = editors
            self.theme = theme

            @callback(
                Output(self.mito_id, 'all_json', allow_duplicate=True), 
                Output(self.mito_id, 'spreadsheet_result', allow_duplicate=True), 
                Input(self.mito_id, 'message'), prevent_initial_call=True
            )
            def handle_message(msg):
                self.num_messages += 1

                self.unprocessed_messages.put(msg)
                self.process_single_message()
                
                self.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=self.num_messages, id=self.mito_id)
                return self.get_all_json(), self.spreadsheet_result
            
            # Because this has a performance impact, we only register this callback if
            # the user actually uses the track_selection parameter
            # TODO: improve the selection error message in this case...
            if track_selection:
                @callback(
                    Output(self.mito_id, 'all_json', allow_duplicate=True), 
                    Output(self.mito_id, 'spreadsheet_selection', allow_duplicate=True), 
                    Input(self.mito_id, 'index_and_selections'), prevent_initial_call=True
                )
                def handle_selection_change(index_and_selections):
                    self.num_messages += 1

                    self.index_and_selections = index_and_selections
                    
                    self.spreadsheet_selection = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_selection', num_messages=self.num_messages, id=self.mito_id)
                    return self.get_all_json(), self.spreadsheet_selection

            @callback(
                Output(self.mito_id, 'all_json', allow_duplicate=True), 
                Output(self.mito_id, 'spreadsheet_result', allow_duplicate=True), 
                Output(self.mito_id, 'spreadsheet_selection', allow_duplicate=True), 
                Input(self.mito_id, 'data'), 
                prevent_initial_call=True
            )
            def handle_data_change_data(data):
                
                self._set_new_mito_backend(
                    data, 
                    import_folder=self.import_folder, 
                    code_options=self.code_options,
                    df_names=self.df_names,
                    sheet_functions=self.sheet_functions,
                    importers=self.importers,
                    editors=self.editors,
                    theme=self.theme
                )

                
                return self.get_all_json(), self.spreadsheet_result, self.spreadsheet_selection
            
        def _set_new_mito_backend(
                self, 
                *args: Union[pd.DataFrame, str, None], 
                import_folder: Optional[str]=None,
                code_options: Optional[CodeOptions]=None,
                df_names: Optional[List[str]]=None,
                sheet_functions: Optional[List[Callable]]=None, 
                importers: Optional[List[Callable]]=None,
                editors: Optional[List[Callable]]=None,
                theme: Optional[MitoTheme]=None
            ) -> None:
            """
            Called when the component is created, or when the input data is changed.
            """
            self.mito_frontend_key = get_new_id()
            self.mito_backend = MitoBackend(
                *args, 
                import_folder=import_folder, 
                code_options=code_options,
                user_defined_functions=sheet_functions,
                user_defined_importers=importers,
                user_defined_editors=editors,
                theme=theme
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

            # If you use the @callback decorator with spreadsheet_result or spreadsheet_selection, users will get these helpful error messages that 
            # will tell them what is wrong with their approach - namely, that they need to use `@mito_callback` instead. Note that this includes:
            # 1.    The num_messages so it triggers callbacks correct in the all cases
            # 2.    The prop name and the id of the spreadsheet so the `@mito_callback` function can inspect this string and replace this arg with the
            #       actual value the user really wants
            self.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=self.num_messages, id=self.mito_id)
            self.spreadsheet_selection = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_selection', num_messages=self.num_messages, id=self.mito_id)

                
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

            self.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=self.num_messages, id=self.mito_id)
            
            
        def get_all_json(self) -> str:
            return json.dumps({
                **self.mito_backend.get_shared_state_variables(),
                'responses_json': json.dumps(self.responses),
                'key': self.mito_frontend_key,
                'track_selection': self.track_selection
            })
        
        def get_result(self):
            return SpreadsheetResult(
                dfs=self.mito_backend.steps_manager.dfs,
                code=self.mito_backend.steps_manager.code(),
                index_and_selections=self.index_and_selections,
                fully_parameterized_function=self.mito_backend.fully_parameterized_function,
                param_metadata=self.mito_backend.param_metadata,
                code_options=self.code_options
            )
        
except ImportError:

    class Spreadsheet(): # type: ignore
        def __init__(self, *args, **kwargs):
            raise Exception("You must install dash to use the Spreadsheet component")