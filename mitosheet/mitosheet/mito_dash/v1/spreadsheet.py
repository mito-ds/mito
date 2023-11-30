from copy import deepcopy
import json
import time
from queue import Queue
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

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
{id}
{session_key}"""

ID_TYPE = 'spreadsheet'
         
try:
    from dash.development.base_component import Component
    from dash import Input, Output, callback, State


    class Spreadsheet(Component):
        
        # See documentation in the get_instance method
        instances: Dict[str, Tuple[Any, Dict[str, Any]]] = dict()

        _children_props: List[str] = []
        _base_nodes = ['children']
        _namespace = 'dash_spreadsheet_v1'
        _type = 'MitoDashWrapper'
        _prop_names = ['id', 'all_json', 'data', 'import_folder', 'spreadsheet_result', 'spreadsheet_selection', 'mito_id', 'session_key']
        _valid_wildcard_attributes: List[str] = []
        available_properties = ['id', 'all_json', 'data', 'import_folder']
        available_wildcard_properties: List[str] = []

        def __init__(
            self, 
            *args: Union[pd.DataFrame, str, None],
            id: Dict[str, str],
            import_folder: Optional[str]=None,
            code_options: Optional[CodeOptions]=None,
            df_names: Optional[List[str]]=None,
            sheet_functions: Optional[List[Callable]]=None, 
            importers: Optional[List[Callable]]=None,
            editors: Optional[List[Callable]]=None,
            theme: Optional[MitoTheme]=None,
            track_selection: bool=False,
            mito_frontend_key: Optional[str]=None
        ):    
            
            # First, we check that the user has passed an ID in the appropriate format
            # as this is required for the component to work. It must be a dict with the 
            # keys type and id, where type == ID_TYPE and id is a unique string
            if not isinstance(id, dict):
                raise Exception("You must pass an ID to the Spreadsheet component as a dict with the keys type and id")
            if 'type' not in id:
                raise Exception("You must pass an ID to the Spreadsheet component as a dict with the keys type and id")
            if 'id' not in id:
                raise Exception("You must pass an ID to the Spreadsheet component as a dict with the keys type and id")
            if id['type'] != ID_TYPE:
                raise Exception("You must pass an ID to the Spreadsheet component as a dict with the keys type and id")
            
            # Get the current Dash app, and check that Mito has been activated on it
            from dash import get_app
            try:
                current_app = get_app()
            except:
                raise Exception("You must create a Dash app before using the Spreadsheet component. See https://docs.trymito.io/mito-for-dash/api-reference#activate_mito")
            if len(current_app.callback_map) == 0:
                raise Exception("You must activate Mito on your Dash app before using the Spreadsheet component. See https://docs.trymito.io/mito-for-dash/api-reference#activate_mito")

            self.id = id
            self.mito_id = id['id'] # TODO: document this
            # Note: num_messages must be ever increasing, so that whenever we get a new message, the spreadsheet_result
            # and spreadsheet_selection error strings change. This way, we can correctly trigger callbacks that correspond
            # to these values in all cases
            self.num_messages=0
            self.args = args
            self._set_new_mito_backend(
                *args, 
                session_key='',
                import_folder=import_folder, 
                code_options=code_options,
                df_names=df_names,
                sheet_functions=sheet_functions,
                importers=importers,
                editors=editors,
                theme=theme,
                mito_frontend_key=mito_frontend_key
            )

            self.track_selection = track_selection

            super(Spreadsheet, self).__init__()

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

            self.all_json = self.get_all_json()

            # Save the instance, so we can look it up later
            if self.mito_id not in self.__class__.instances:
                self.__class__.instances[self.mito_id] = (self, dict())

        @classmethod
        def get_instance(cls, mito_id: str, session_key: str) -> Optional[Any]:
            """
            The Spreadsheet component stores a map from the mito_id of the spreadsheet to a tuple of the 
            original Spreadsheet instances, as well as a map from session key to the session instance.

            This is because Mito is not properly stateless yet. As a result, to work around limitaitons of Dash, 
            we have the frontend keep track of the session key of the Mito spreadsheet, and then we duplicate the
            spreadsheet for each session key.

            This way every user gets a new and unique Mito backend. When Mito is stateless, we can remove this, 
            but it will require larger refactors to the Mito app.
            """

            # First, lookup the instance by mito_id
            instance = cls.instances.get(mito_id, None)

            if instance is None:
                return None

            session_instance = instance[1].get(session_key, None)
            if session_instance is not None:
                return session_instance
            
            # If we don't have a session_instance, then we need to create one
            # We do this by copying the instance, and then saving it
            session_instance = instance[0].safe_copy()
            cls.instances[mito_id][1][session_key] = session_instance
            return session_instance
        
        def safe_copy(self):
            """
            Make a safe copy of this Spreadsheet component. Should be called 
            on the original instance of the Spreadsheet component, and not on
            the session instance -- so the user starts with the original starting
            values.
            """

            return self.__class__(
                *self.args,
                id=self.id,
                import_folder=self.import_folder,
                code_options=self.code_options,
                df_names=self.df_names,
                sheet_functions=self.sheet_functions, 
                importers=self.importers,
                editors=self.editors,
                theme=self.theme,
                track_selection=self.track_selection,
                mito_frontend_key=self.mito_frontend_key
            )

        def _set_new_mito_backend(
                self, 
                *args: Union[pd.DataFrame, str, None], 
                session_key:Optional[str]=None,
                import_folder: Optional[str]=None,
                code_options: Optional[CodeOptions]=None,
                df_names: Optional[List[str]]=None,
                sheet_functions: Optional[List[Callable]]=None, 
                importers: Optional[List[Callable]]=None,
                editors: Optional[List[Callable]]=None,
                theme: Optional[MitoTheme]=None,
                mito_frontend_key: Optional[str]=None
            ) -> None:
            """
            Called when the component is created, or when the input data is changed.
            """
            self.mito_frontend_key = get_new_id() if mito_frontend_key is None else mito_frontend_key
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
            self.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=self.num_messages, id=self.mito_id, session_key=session_key)
            self.spreadsheet_selection = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_selection', num_messages=self.num_messages, id=self.mito_id, session_key=session_key)

                
        def process_single_message(self, session_key: str) -> None:

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

            self.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=self.num_messages, id=self.mito_id, session_key=session_key)
            
            
        def get_all_json(self) -> str:
            return json.dumps({
                **self.mito_backend.get_shared_state_variables(),
                'responses_json': json.dumps(self.responses),
                'key': self.mito_frontend_key,
                'track_selection': self.track_selection
            })
        
        def get_result(self):
            return SpreadsheetResult(
                dfs=(df.copy() for df in self.mito_backend.steps_manager.dfs),
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