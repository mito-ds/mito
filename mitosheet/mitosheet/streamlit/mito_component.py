import json
import os
import pandas as pd
import streamlit.components.v1 as components

try:
    import streamlit as st

    from mitosheet.mito_backend import MitoBackend

    parent_dir = os.path.dirname(os.path.abspath(__file__))

    mito_build_dir = os.path.join(parent_dir, "mitoBuild")
    _mito_component_func = components.declare_component("my_component", path=mito_build_dir)

    message_passer_build_dr = os.path.join(parent_dir, "messagingBuild")
    _message_passer_component_func = components.declare_component("message-passer", path=message_passer_build_dr)

    @st.cache_resource
    def _get_mito_backend(*args, key=None): # So it caches on key
        mito_backend = MitoBackend(*args)

        # Make a send function that stores the responses in a list
        responses = []
        def send(response):
            responses.append(response)
        
        mito_backend.mito_send = send

        return mito_backend, responses

    def message_passer_component(key=None):
        """
        This component simply passes messages from the frontend to the backend,
        so that the backend can process them before it is rendered.
        """
        component_value = _message_passer_component_func(key=key)
        return component_value


    def mito_component(*args, key=None):
        """
        Renders a mitosheet with the given arguments.

        TODO: this should change the when the arguments change. The caching
        stuff is weird currently.
        """
        mito_backend, responses = _get_mito_backend(*args, key=key)
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
    def mito_component(*args, key=None):
        raise RuntimeError("Couldn't import streamlit. Install streamlit with `pip install streamlit` to use the mitosheet component.")