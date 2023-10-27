from collections import OrderedDict
from distutils.version import LooseVersion
import hashlib
import importlib
import inspect
import json
import os
import pickle
import re
from typing import Any, Dict, List, Callable, Optional, Tuple, Union

import pandas as pd

from mitosheet.mito_backend import MitoBackend
from mitosheet.selectionUtils import get_selected_element
from mitosheet.types import CodeOptions, ParamMetadata, ParamType
from mitosheet.utils import get_new_id

CURRENT_MITO_ANALYSIS_VERSION = 1

def _get_dataframe_hash(df: pd.DataFrame) -> bytes:
    """
    Returns a hash for a pandas dataframe that is consistent across runs, notably including:
    1. The column names
    2. The values of the dataframe
    3. The index of the dataframe
    4. The order of all of these

    This is necessary due to the issues described here: https://github.com/streamlit/streamlit/issues/7086
    where streamlit default hashing is not ideal for pandas dataframes, as it misses some column header and
    reordering changes. 
    """
    try:
        return hashlib.md5(
            bytes(str(pd.util.hash_pandas_object(df.columns)), 'utf-8') +
            bytes(str(pd.util.hash_pandas_object(df)), 'utf-8')
        ).digest()
    except TypeError as e:        
        # Use pickle if pandas cannot hash the object for example if
        # it contains unhashable objects.
        return b"%s" % pickle.dumps(df, pickle.HIGHEST_PROTOCOL)

def get_dataframe_hash(df: pd.DataFrame) -> bytes:
    _PANDAS_ROWS_LARGE = 100000
    _PANDAS_SAMPLE_SIZE = 10000
    
    if len(df) >= _PANDAS_ROWS_LARGE:
        df = df.sample(n=_PANDAS_SAMPLE_SIZE, random_state=0)
    
    return _get_dataframe_hash(df)

def do_dynamic_imports(code: str) -> None:
    """
    When you get back Mito code, and you want to execute it, it requires imports defined in the global scope
    of the executing process. 

    To do this, we dynamically read in the import lines, and execute them using the importlib, and then add 
    them to the global scope.
    """

    # Extract import lines from the code_str
    import_lines = [line.strip() for line in code.split("\n") if line.strip().startswith(("from ", "import "))]

    # Dynamically import modules and attributes in the global scope
    for import_line in import_lines:
        if import_line.startswith("from"):
            match = re.match(r"from (.+) import (.+)", import_line)
            module_name = match.group(1) #type: ignore
            imported_objects = match.group(2).split(",")  #type: ignore
            
            module = importlib.import_module(module_name)
            for obj in imported_objects:
                obj = obj.strip()
                if obj == "*":
                    for attr_name in dir(module):
                        if not attr_name.startswith("_"):
                            globals()[attr_name] = getattr(module, attr_name)
                else:
                    globals()[obj] = getattr(module, obj)
        else:
            split = import_line.split(' ')
            module_name = split[1]
            alias = split[3]
            
            module = importlib.import_module(module_name)
            globals()[alias if alias else module_name] = module



def get_function_from_code_unsafe(code: str) -> Optional[Callable]:
    """
    Given a string of code, returns the first function defined in the code. Notably, to do
    this, it executes the code, and then returns the first function defined in the code. 

    As it executes the full code string, you should only use this function if you trust the
    code string -- and in our case, if the function is not called.

    If no functions are defined, returns None
    """
    functions_before = [f for f in locals().values() if callable(f)]
    exec(code)
    functions = [f for f in locals().values() if callable(f) and f not in functions_before]

    # We then find the one function that was defined inside of this module -- as the above 
    # exec likely defines all the other mitosheet functions (none of which we actaully want)
    for f in functions:
        if inspect.getmodule(f) == inspect.getmodule(get_function_from_code_unsafe):
            do_dynamic_imports(code)
            return f
        
    raise ValueError(f'No functions defined in code: {code}')

# This is the class that is returned when the user sets return_type='analysis'
# It contains data that could be relevant to the streamlit developer, and is 
# used for replaying analyses. 
class RunnableAnalysis:
    def __init__(
            self,
            code: str,
            code_options: Optional[CodeOptions],
            fully_parameterized_function: str,
            param_metadata: List[ParamMetadata],
            mito_analysis_version: int=CURRENT_MITO_ANALYSIS_VERSION
        ):
        self.__code = code
        self.__code_options = code_options
        self.__fully_parameterized_function = fully_parameterized_function
        self.__param_metadata = param_metadata
        self.mito_analysis_version = mito_analysis_version
        
    def get_param_metadata(self, param_type: Optional[ParamType]=None) -> List[ParamMetadata]:
        if param_type is None:
            return self.__param_metadata
        if param_type not in ['import', 'export']:
            raise TypeError('Invalid args passed to get_param_metadata. Type must be "import" or "export"')
        return [param for param in self.__param_metadata if param['type'] == param_type]
    
    @property
    def fully_parameterized_function(self) -> str:
        return self.__fully_parameterized_function
    
    def to_json(self) -> str:
        return json.dumps({
            'code': self.__code,
            'code_options': self.__code_options,
            'fully_parameterized_function': self.__fully_parameterized_function,
            'param_metadata': self.__param_metadata,
            'mito_analysis_version': self.mito_analysis_version
        })
    
    @staticmethod
    def from_json(json_str: str) -> 'RunnableAnalysis':
        json_dict = json.loads(json_str)
        required_keys = ['code', 'code_options', 'fully_parameterized_function', 'param_metadata']
        for key in required_keys:
            if key not in json_dict:
                raise ValueError(f'Invalid json_str passed to RunnableAnalysis.from_json. Missing key {key}.')
        return RunnableAnalysis(
            json_dict['code'],
            json_dict['code_options'],
            json_dict['fully_parameterized_function'],
            json_dict['param_metadata'],
            mito_analysis_version=json_dict['mito_analysis_version']
        )
    
    def _check_correct_args_and_kwargs(self, *args: List[Any], **kwargs: Dict[str, Any]) -> None:
        """
        Checks that all the required arguments are passed, and that
        no unexpected arguments are passed, and that no arguments
        are passed multiple times.
        """
        # Error handling for required arguments
        required_args = [param['name'] for param in self.__param_metadata if param['required']]
        for index, required_arg in enumerate(required_args):
            is_kwarg = required_arg in kwargs.keys()

            # First, check if the arg was passed in as a positional argument
            if index < len(args):
                # Check if the arg was passed in as a keyword argument as well. 
                if is_kwarg:
                    raise TypeError(f'RunnableAnalysis.run() got multiple values for argument {required_arg}')

            # If it wasn't passed as a positional argument, check if it was passed as a keyword argument
            elif not is_kwarg:
                raise TypeError(f'RunnableAnalysis.run() missing required argument {required_arg}. You passed a dataframe to this analysis, but did not pass in a value for {required_arg}.')

        # Then, check the correct kwargs were passed
        for name in kwargs:
            # Raise an error if the user passes in an unexpected argument
            if not any(param for param in self.__param_metadata if param['name'] == name):
                raise TypeError(f'RunnableAnalysis.run() got an unexpected keyword argument {name}')


    
    def run(self, *args, **kwargs):
        params = {}

        # First, set the default values for all params.
        for param in self.__param_metadata:
            params[param['name']] = param['original_value']

        self._check_correct_args_and_kwargs(*args, **kwargs)

        # Then, overwrite the default values with the user provided values
        required_args = [param['name'] for param in self.__param_metadata if param['required']]

        for index, required_arg in enumerate(required_args):
            if index < len(args):
                params[required_arg] = args[index]

        # Then, overwrite the default values with the user provided values
        for name, value in kwargs.items():
            params[name] = value

        # Then, before we call the function, we make sure that the arguments are the correct types. 
        # Notably, we want to allow users to pass in dataframes for file paths (as this is often very
        # convenient), but we need to convert them to StringIO object before calling the function
        for param_name, param_value in params.items():
            param = next(param for param in self.__param_metadata if param['name'] == param_name)
            # If the user passed in a dataframe, and the param subtype starts with file, we convert it to a StringIO object
            if param['subtype'] == 'file_name_import_csv' and isinstance(param_value, pd.DataFrame):
                from io import StringIO
                params[param_name] = StringIO(param_value.to_csv(index=False))

        return get_function_from_code_unsafe(self.__fully_parameterized_function)(**params)

try:
    import streamlit.components.v1 as components
    import streamlit as st

    parent_dir = os.path.dirname(os.path.abspath(__file__))

    mito_build_dir = os.path.join(parent_dir, "mitoBuild")
    _mito_component_func = components.declare_component("my_component", path=mito_build_dir)

    message_passer_build_dr = os.path.join(parent_dir, "messagingBuild")
    _message_passer_component_func = components.declare_component("message-passer", path=message_passer_build_dr)


    def get_session_id() -> Optional[str]:
        """
        This returns the session id for the current script run. Notably, this is different
        when the user:
        1. Refreshes the page
        2. Closes the page and reopens it
        3. Is a different user
        4. Is a different browser

        It allows us to cache the Mito backend on the session id, so that it is not
        shared across users. Notably, it clearing when refreshed is the same behavior
        that streamlit caching has by default -- e.g. the button component will reset
        when the page is refreshed.

        From the streamlit docs:
        A context object that contains data for a "script run" - that is,
        data that's scoped to a single ScriptRunner execution (and therefore also
        scoped to a single connected "session").
        """
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        ctx = get_script_run_ctx()
        if ctx is None:
            return None
        return ctx.session_id

    @st.cache_resource(hash_funcs={pd.DataFrame: get_dataframe_hash})
    def _get_mito_backend(
            *args: Union[pd.DataFrame, str, None], 
            _importers: Optional[List[Callable]]=None, 
            _editors: Optional[List[Callable]]=None, 
            _sheet_functions: Optional[List[Callable]]=None, 
            _code_options: Optional[CodeOptions]=None,
            import_folder: Optional[str]=None,
            df_names: Optional[List[str]]=None,
            session_id: Optional[str]=None,
            key: Optional[str]=None # So it caches on key
        ) -> Tuple[MitoBackend, List[Any]]: 

        mito_backend = MitoBackend(
            *args, 
            import_folder=import_folder,
            user_defined_importers=_importers, user_defined_functions=_sheet_functions, user_defined_editors=_editors,
            code_options=_code_options,
        )

        # Make a send function that stores the responses in a list
        responses = []
        def send(response):
            responses.append(response)
        
        mito_backend.mito_send = send

        if df_names is not None and len(df_names) > 0:
            mito_backend.receive_message(
                {
                    'event': 'update_event',
                    'id': get_new_id(),
                    'type': 'args_update',
                    'params': {
                        'args': df_names
                    },
                }
            )

        return mito_backend, responses

    def message_passer_component(key: Optional[str]=None) -> Any:
        """
        This component simply passes messages from the frontend to the backend,
        so that the backend can process them before it is rendered.
        """
        component_value = _message_passer_component_func(key=key)
        return component_value


    def spreadsheet( # type: ignore
            *args: Union[pd.DataFrame, str, None], 
            sheet_functions: Optional[List[Callable]]=None, 
            importers: Optional[List[Callable]]=None, 
            editors: Optional[List[Callable]]=None, 
            df_names: Optional[List[str]]=None,
            import_folder: Optional[str]=None,
            code_options: Optional[CodeOptions]=None,
            return_type: str='default',
            key=None
        ) -> Any:
        """
        Create a new instance of the Mito spreadsheet in a streamlit app.

        Parameters
        ----------
        args: pd.Dataframe or str or None
            The arguments to pass to the Mito spreadsheet. If a dataframe is
            passed, it will be displayed as a sheet tab. If a string is passed,
            it will be read in with a pd.read_csv call. If None is passed, it 
            will be skipped.
        sheet_functions: List[Callable]
            A list of functions that can be used in the spreadsheet. Functions
            should be capitalized.
        importers: List[Callable]
            A list of functions that can be used to import dataframes. Each
            function should return a dataframe. 
        editors: List[Callable]
            A list of functions that can be used to edit dataframes. Each function
            should have `df` as the first parameter, and then should return
            a dataframe as a result.
        df_names: List[str]
            A list of names for the dataframes passed in. If None, the dataframes
            will be named df0, df1, etc.
        key: str or None
            An key that uniquely identifies this component. This must be passed
            for now, or the component will not work. Not sure why.

        Returns
        -------
        Tuple[Dict[str, pd.DataFrame], List[str]]
            A tuple. The first element is a mapping from dataframe names to the
            final dataframes. The second element is a list of lines of code
            that were executed in the Mito spreadsheet.
        """
        session_id = get_session_id()

        mito_backend, responses = _get_mito_backend(
            *args, 
            _sheet_functions=sheet_functions,
            _importers=importers, 
            _editors=editors,
            _code_options=code_options,
            import_folder=import_folder,
            session_id=session_id,
            df_names=df_names, 
            key=key
        )

        # Mito widgets need new ids every time a new one is displayed. As such, if
        # the key is None, we generate a new one. Notably, we do this after getting the
        # mito_backend, so that we can cache the mito_backend on the user provided key.
        if key is None:
            key = mito_backend.analysis_name

        sheet_data_json = mito_backend.steps_manager.sheet_data_json,
        analysis_data_json = mito_backend.steps_manager.analysis_data_json,
        user_profile_json = mito_backend.get_user_profile_json()

        msg = message_passer_component(key=str(key) + 'message_passer')
        if (
            msg is not None \
            and msg['id'] not in [response['id'] for response in responses] \
            and msg['analysis_name'] == mito_backend.analysis_name
        ):
            # We receive a message if:
            # 1. It is not None
            # 2. We have not already received it on this backend
            # 3. It is for this analysis. 
            # Note that the final two conditions are to prevent messages that have been sent
            # by the message passer component from being received again. This happens because
            # when a component value is set, it is always returned by the message_passer_component
            # until a new component value is set            
            mito_backend.receive_message(msg)
            
        responses_json = json.dumps(responses)

        # NOTE: selection is Optional -- as if the user has not set the return type as selected, we don't
        # waste a component value update setting the value
        selection = _mito_component_func(
            key=key, 
            sheet_data_json=sheet_data_json, analysis_data_json=analysis_data_json, user_profile_json=user_profile_json, 
            responses_json=responses_json, id=id(mito_backend),
            return_type=return_type
        )

        # We return a mapping from dataframe names to dataframes
        final_state = mito_backend.steps_manager.curr_step.final_defined_state
        code = "\n".join(mito_backend.steps_manager.code())

        ordered_dict = OrderedDict()
        for df_name, df in zip(final_state.df_names, final_state.dfs):
            ordered_dict[df_name] = df

        if return_type == 'default':
            return ordered_dict, code
        elif return_type == 'selection':
            return get_selected_element(final_state.dfs, selection)
        elif return_type == 'default_list':
            return final_state.dfs, code
        elif return_type == 'dfs_dict':
            return ordered_dict
        elif return_type == 'code':
            return code
        elif return_type == 'dfs_list':
            return final_state.dfs
        elif return_type == 'function':
            if code_options is None or not code_options['as_function'] or code_options['call_function']:
                raise ValueError(f"""You must set code_options with `as_function=True` and `call_function=False` in order to return a function.""")
            
            return get_function_from_code_unsafe(code)
        elif return_type == 'analysis':
            return RunnableAnalysis(code, code_options, mito_backend.fully_parameterized_function, mito_backend.param_metadata)
        else:
            raise ValueError(f'Invalid value for return_type={return_type}. Must be "default", "default_list", "dfs", "code", "dfs_list", or "function".')

    
except ImportError:
    def spreadsheet(*args, key=None): # type: ignore
        raise RuntimeError("Couldn't import streamlit. Install streamlit with `pip install streamlit` to use the mitosheet component.")