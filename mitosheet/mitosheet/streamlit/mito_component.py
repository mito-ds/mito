import json
import os
from typing import Any, Dict, List, Callable, Optional, Tuple, Union

import pandas as pd

from mitosheet.mito_backend import MitoBackend
from mitosheet.utils import get_new_id


try:
    import streamlit.components.v1 as components
    import streamlit as st


    parent_dir = os.path.dirname(os.path.abspath(__file__))

    mito_build_dir = os.path.join(parent_dir, "mitoBuild")
    _mito_component_func = components.declare_component("my_component", path=mito_build_dir)

    message_passer_build_dr = os.path.join(parent_dir, "messagingBuild")
    _message_passer_component_func = components.declare_component("message-passer", path=message_passer_build_dr)

    @st.cache_resource
    def _get_mito_backend(
            *args: Union[pd.DataFrame, str, None], 
            _importers: Optional[List[Callable]]=None, 
            df_names: Optional[List[str]]=None,
            key: Optional[str]=None
        ) -> Tuple[MitoBackend, List[Any]]: # So it caches on key
        mito_backend = MitoBackend(*args, user_defined_importers=_importers)

        # Make a send function that stores the responses in a list
        responses = []
        def send(response):
            responses.append(response)
        
        mito_backend.mito_send = send

        if df_names is not None:
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


    def mito_component( # type: ignore
            *args: Union[pd.DataFrame, str, None], 
            importers: Optional[List[Callable]]=None, 
            df_names: Optional[List[str]]=None,
            key=None
        ) -> Tuple[Dict[str, pd.DataFrame], List[str]]:
        """
        Create a new instance of the Mito spreadsheet in a streamlit app.

        Parameters
        ----------
        args: pd.Dataframe or str or None
            The arguments to pass to the Mito spreadsheet. If a dataframe is
            passed, it will be displayed as a sheet tab. If a string is passed,
            it will be read in with a pd.read_csv call. If None is passed, it 
            will be skipped.
        importers: List[Callable]
            A list of functions that can be used to import dataframes. Each
            function should return a dataframe. 
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
        mito_backend, responses = _get_mito_backend(*args, _importers=importers, df_names=df_names, key=key)
        sheet_data_json = mito_backend.steps_manager.sheet_data_json,
        analysis_data_json = mito_backend.steps_manager.analysis_data_json,
        user_profile_json = mito_backend.get_user_profile_json()

        msg = message_passer_component(key=str(key) + 'message_passer')
        if msg is not None:
            mito_backend.receive_message(msg)
            
        responses_json = json.dumps(responses)

        _mito_component_func(
            key=key, 
            sheet_data_json=sheet_data_json, analysis_data_json=analysis_data_json, user_profile_json=user_profile_json, 
            responses_json=responses_json, id=id(mito_backend)
        )

        # We return a mapping from dataframe names to dataframes
        final_state = mito_backend.steps_manager.curr_step.final_defined_state
        code = mito_backend.steps_manager.code()
        return {
            df_name: df for df_name, df in 
            zip(final_state.df_names, final_state.dfs)
        }, code
    
except ImportError:
    def mito_component(*args, key=None): # type: ignore
        raise RuntimeError("Couldn't import streamlit. Install streamlit with `pip install streamlit` to use the mitosheet component.")