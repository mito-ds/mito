# AUTO GENERATED FILE - DO NOT EDIT
import gc
import json
import time
from queue import Queue


from dash.development.base_component import Component, _explicitize_args

from dash import Input, Output, callback
from mitosheet.mito_backend import MitoBackend


def get_random_id():
    import random
    return "".join(random.choice('abcdefghijklmnopqrstuvwxyz') for i in range(10))


class SpreadsheetResult():

    def __init__(self, dfs):
        self._dfs = dfs

    def dfs(self):
        return self._dfs
    

class Spreadsheet(Component):
    _children_props = []
    _base_nodes = ['children']
    _namespace = 'dash_spreadsheet_v1'
    _type = 'MitoDashWrapper'

    @_explicitize_args
    def __init__(
            self, 
            *args,
            **kwargs
    ):
        self.mito_id = kwargs['id']
        self.mito_backend = MitoBackend(*args)

        # Make a send function that stores the responses in a list
        self.responses = []
        def send(response):
            self.responses.append(response)
        
        self.mito_backend.mito_send = send

        self._prop_names = ['id', 'all_json']
        self._valid_wildcard_attributes = []
        self.available_properties = ['id', 'all_json']
        self.available_wildcard_properties = []
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


        @callback(Output(self.mito_id, 'all_json'), Input(self.mito_id, 'message'), prevent_initial_call=True)
        def handle_message(value):
            self.unprocessed_messages.put(value)
            self.process_single_message()
            return self.get_all_json()

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
        })
    
    def get_result(self):
        return SpreadsheetResult(self.mito_backend.steps_manager.code())
    

def spreadsheet_callback(
    *_args,
    input_id=None,
    background=False,
    interval=1000,
    progress=None,
    progress_default=None,
    running=None,
    cancel=None,
    manager=None,
    cache_args_to_ignore=None,
    **_kwargs,
):
    """
    When the 
    """
    if input_id is None:
        raise ValueError('input_id must be provided')
    
    # Find the MitoDashWrapper component with the given id - searching all objects
    callback_component = None
    components = [
        obj for obj in gc.get_objects()
        if isinstance(obj, Spreadsheet) and getattr(obj, 'mito_id', None) == input_id
    ]

    if len(components) > 0:
        callback_component = components[0]

    if callback_component is None:
        raise ValueError(f'Could not find MitoDashWrapper with id {input_id}')
    
    # Create a callback that will send the result to the MitoDashWrapper component
    # with the given id
    def callback_decorator(func):
        @callback(
            *_args,
            Input(callback_component.mito_id, 'all_json'),
            # TODO: do we need to register the output here? I think yes.
        )
        def callback_wrapper(*args, **kwargs):
            result = callback_component.get_result()

            return func(result)
        return callback_wrapper

    return callback_decorator