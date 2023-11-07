from typing import Any, Callable
from mitosheet.mito_dash.v1.spreadsheet import (ID_TYPE,
                                                WRONG_CALLBACK_ERROR_MESSAGE,
                                                Spreadsheet)

WRONG_CALLBACK_ERROR_MESSAGE_FIRST_LINE = WRONG_CALLBACK_ERROR_MESSAGE.split('\n')[0]

try:

    from dash.exceptions import PreventUpdate

    from dash import MATCH, Dash, Input, Output, State, callback

    def mito_callback(*args: Any, **kwargs: Any) -> Callable:
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
                        mito_id = arg.split('\n')[-2].strip()
                        session_key = arg.split('\n')[-1].strip()

                        spreadsheet = Spreadsheet.get_instance(mito_id, session_key)

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
    
    def activate_mito(app: Dash) -> None:
        """
        This function must be called right after instatiated your Dash application, so that 
        Mito can correctly hook-up message handling for all Mito spreadsheet components.

        Correct usage
        ```
        from dash import Dash
        from mitosheet.mito_dash.v1 import activate_mito, Spreadsheet

        app = Dash(__name__)
        activate_mito(app)

        # Go on to create layout, register callbacks, etc
        ```

        If this function is not called, then the Mito Spreadsheet component will not work, and will throw
        an error if you try to use it.
        """

        @app.callback(
            Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_result', allow_duplicate=True), 
            Input({'type': ID_TYPE, 'id': MATCH}, 'message'),
            State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
            State({'type': ID_TYPE, 'id': MATCH}, 'session_key'),
            prevent_initial_call=True
        )
        def handle_message(msg, mito_id, session_key):
            spreadsheet = Spreadsheet.get_instance(mito_id, session_key)
            if spreadsheet is None:
                print("No spreadsheet found for id", mito_id)
                # TODO: should we print some error here
                raise PreventUpdate
            
            spreadsheet.num_messages += 1

            spreadsheet.unprocessed_messages.put(msg)
            spreadsheet.process_single_message(session_key)
            
            spreadsheet.spreadsheet_result = WRONG_CALLBACK_ERROR_MESSAGE.format(prop_name='spreadsheet_result', num_messages=spreadsheet.num_messages, id=spreadsheet.mito_id, session_key=session_key)
            return spreadsheet.get_all_json(), spreadsheet.spreadsheet_result
        

        @app.callback(
            Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_selection', allow_duplicate=True), 
            Input({'type': ID_TYPE, 'id': MATCH}, 'index_and_selections'),
            State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
            State({'type': ID_TYPE, 'id': MATCH}, 'session_key'),
            prevent_initial_call=True
        )
        def handle_selection_change(index_and_selections, mito_id, session_key):
            spreadsheet = Spreadsheet.get_instance(mito_id, session_key)
            if spreadsheet is None:
                # TODO: should we print some error here
                raise PreventUpdate

            spreadsheet.num_messages += 1

            spreadsheet.index_and_selections = index_and_selections
            
            spreadsheet.spreadsheet_selection = WRONG_CALLBACK_ERROR_MESSAGE.format(
                prop_name='spreadsheet_selection', 
                num_messages=spreadsheet.num_messages, 
                id=spreadsheet.mito_id,
                session_key=session_key
            )
            return spreadsheet.get_all_json(), spreadsheet.spreadsheet_selection
            
    
        @app.callback(
            Output({'type': ID_TYPE, 'id': MATCH}, 'all_json', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_result', allow_duplicate=True), 
            Output({'type': ID_TYPE, 'id': MATCH}, 'spreadsheet_selection', allow_duplicate=True), 
            Input({'type': ID_TYPE, 'id': MATCH}, 'data'),
            State({'type': ID_TYPE, 'id': MATCH}, 'mito_id'),
            State({'type': ID_TYPE, 'id': MATCH}, 'session_key'),
            prevent_initial_call=True
        )
        def handle_data_change_data(data, mito_id, session_key):
            spreadsheet = Spreadsheet.get_instance(mito_id, session_key)
            if spreadsheet is None:
                print("No spreadsheet found for id", mito_id)
                # TODO: should we print some error here
                raise PreventUpdate
                        
            spreadsheet._set_new_mito_backend(
                data,
                session_key=session_key,
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