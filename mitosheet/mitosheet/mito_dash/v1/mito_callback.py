import gc
from io import StringIO
import json
import time
from queue import Queue
from typing import Any, Callable, Dict, List, Optional, Union, Tuple

from mitosheet.mito_dash.v1.spreadsheet import Spreadsheet, WRONG_CALLBACK_ERROR_MESSAGE

WRONG_CALLBACK_ERROR_MESSAGE_FIRST_LINE = WRONG_CALLBACK_ERROR_MESSAGE.split('\n')[0]

try:

    from dash import callback
        
    def get_component_with_id(id: str) -> Optional[Spreadsheet]:
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
                        id = arg.split('\n')[-1].strip()

                        spreadsheet = get_component_with_id(id)
                        if spreadsheet is None:
                            # TODO: use a more dash exception?
                            raise Exception(f"Could not find spreadsheet with id {id}")
                        
                        if 'spreadsheet_result' in arg:
                            # If the user is getting the result, give them the result
                            new_args[index] = spreadsheet.get_result()
                        else:
                            # If they are just getting the selection, just get the current selection
                            new_args[index] = spreadsheet.get_result().selection()


                return original_function(*new_args, **_kwargs)
            
            return callback(*args, **kwargs)(new_function)
        
        return function_wrapper
        
except ImportError:

    def mito_callback(*args, **kwargs): # type: ignore
        raise Exception("You must install dash to use the @mito_callback decorator component")