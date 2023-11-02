import gc
from io import StringIO
import json
import time
from queue import Queue
from typing import Any, Callable, Dict, List, Optional, Union, Tuple

from mitosheet.mito_dash.v1.spreadsheet import Spreadsheet, WRONG_CALLBACK_ERROR_MESSAGE, ID_TYPE

WRONG_CALLBACK_ERROR_MESSAGE_FIRST_LINE = WRONG_CALLBACK_ERROR_MESSAGE.split('\n')[0]

try:

    from dash import callback, Dash, Output, Input, MATCH, State
    from dash.exceptions import PreventUpdate
        
    def get_component_with_mito_id(id: str) -> Optional[Spreadsheet]:
        components = [
            obj for obj in gc.get_objects()
            if isinstance(obj, Spreadsheet) and getattr(obj, 'mito_id', None) == id
        ]

        if len(components) > 0:
            return components[0]
        else:
            return None        

    def mito_callback(*args, **kwargs):
        """
        This is a replacement for the @callback decorator that improves the developer experience
        with using the Mito Spreadsheet component. 

        When using the @mito_callback decorator to subscribe to changes in the `spreadsheet_result` or
        `spreadsheet_selection` properties of a Mito Spreadsheet, you get the actual SpreadsheetResult
        object - not some JSON string you need to parse and work with.

        To see the documentation for this decorator, see the @mito_callback decorator documentation:
        https://docs.trymito.io/mito-for-dash/api-reference#callback-props-and-types
        """
        def function_wrapper(original_function):
            # TODO: do we need an @wraps
            def new_function(*_args, **_kwargs):
                new_args = list(_args)

                # TODO: do we need to handle kwargs? Probably. But we will do that in the future...

                for index, arg in enumerate(new_args):

                    # We go through all the arguments passed to the function, and:
                    # 1) find those that are Mito spreadsheet_result/spreadsheet_selection error strings
                    # 2) Replace them with the the actual spreadsheet results
                    # As this is a dramatically better Spreadsheet experience

                    if isinstance(arg, str) and arg.startswith(WRONG_CALLBACK_ERROR_MESSAGE_FIRST_LINE):
                        # Get the ID from the final line 
                        mito_id = arg.split('\n')[-1].strip()

                        spreadsheet = get_component_with_mito_id(mito_id)
                        if spreadsheet is None:
                            # TODO: use a more dash exception?
                            raise Exception(f"Could not find spreadsheet with mito_id {mito_id}")
                        
                        if 'spreadsheet_result' in arg:
                            # If the user is getting the result, give them the result
                            new_args[index] = spreadsheet.get_result()
                        else:
                            # If they are just getting the selection, just get the current selection
                            new_args[index] = spreadsheet.get_result().selection()


                return original_function(*new_args, **_kwargs)
            
            return callback(*args, **kwargs)(new_function)
        
        return function_wrapper
    
    def activate_mito(
            app: Dash,
            track_selection=False
        ) -> None:
        """
        This function must be called right after instatiated your Dash application, so that it 
        can register the mito_callback decorator with Dash.

        TODO: make the Spreadsheet throw an error if the user has not called this function. I wonder
        if we can just edit a global variable.

        TODO: we could make this patch the callback function (but it might already be imported)...
        """

        @callback(
            Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_result', allow_duplicate=True), 
            Input({'type': ID_TYPE, 'id': MATCH}, 'message'),
            State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
            prevent_initial_call=True
        )
        def handle_message(msg, mito_id):
            mito_id = msg['mito_id']

            spreadsheet = get_component_with_mito_id(mito_id)
            if spreadsheet is None:
                print("No spreadsheet found for id", mito_id)
                # TODO: should we print some error here
                raise PreventUpdate
            
            spreadsheet.num_messages += 1

            spreadsheet.unprocessed_messages.put(msg)
            spreadsheet.process_single_message()
            
            spreadsheet.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=spreadsheet.num_messages, id=spreadsheet.mito_id)
            return spreadsheet.get_all_json(), spreadsheet.spreadsheet_result
        

        # Because this has a performance impact, we only register this callback if
        # the user actually uses the track_selection parameter
        # TODO: improve the selection error message in this case...
        if track_selection:
            @callback(
                Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
                Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_selection', allow_duplicate=True), 
                Input({'type': ID_TYPE, 'id': MATCH}, 'index_and_selections'),
                State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
                prevent_initial_call=True
            )
            def handle_selection_change(index_and_selections, mito_id):
                spreadsheet = get_component_with_mito_id(mito_id)
                if spreadsheet is None:
                    # TODO: should we print some error here
                    raise PreventUpdate

                spreadsheet.num_messages += 1

                spreadsheet.index_and_selections = index_and_selections
                
                spreadsheet.spreadsheet_selection = WRONG_CALLBACK_ERROR_MESSAGE.format(
                    prop_name='spreadsheet_selection', 
                    num_messages=spreadsheet.num_messages, 
                    id=spreadsheet.mito_id
                )
                return spreadsheet.get_all_json(), spreadsheet.spreadsheet_selection
            
    
        @callback(
            Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_result', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_selection', allow_duplicate=True), 
            Input({'type': ID_TYPE, 'id': MATCH}, 'data'),
            State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
            prevent_initial_call=True
        )
        def handle_data_change_data(data, mito_id):

            spreadsheet = get_component_with_mito_id(mito_id)
            if spreadsheet is None:
                print("No spreadsheet found for id", mito_id)
                # TODO: should we print some error here
                raise PreventUpdate
            
            spreadsheet._set_new_mito_backend(
                data, 
                import_folder=spreadsheet.import_folder, 
                code_options=spreadsheet.code_options,
                df_names=spreadsheet.df_names,
                sheet_functions=spreadsheet.sheet_functions,
                importers=spreadsheet.importers,
                editors=spreadsheet.editors,
                theme=spreadsheet.theme
            )

            
            return spreadsheet.get_all_json(), spreadsheet.spreadsheet_result, spreadsheet.spreadsheet_selection

        
except ImportError:

    def mito_callback(*args, **kwargs): # type: ignore
        raise Exception("You must install dash to use the @mito_callback decorator component")
    
    def activate_mito(*args, **kwargs): # type: ignore
        raise Exception("You must install dash to use the @mito_callback decorator component")