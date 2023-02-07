import json

import streamlit.components.v1 as components

import streamlit as st
from mitosheet.mito_backend import MitoBackend

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

# Initialization
if 'mito' not in st.session_state:
    st.session_state['mito'] = MitoBackend()
if 'mito_message_count' not in st.session_state:
    st.session_state['mito_message_count'] = 0

# When we're distributing a production version of the component, we'll
# replace the `url` param with `path`, and point it to to the component's
# build directory:
_component_func = components.declare_component("my_component", path='mitosheet/streamlit')


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def my_component(name, key=None):
    """Create a new instance of "my_component".

    Parameters
    ----------
    name: str
        The name of the thing we're saying hello to. The component will display
        the text "Hello, {name}!"
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    int
        The number of times the component's "Click Me" button has been clicked.
        (This is the value passed to `Streamlit.setComponentValue` on the
        frontend.)

    """
    # Call through to our private component function. Arguments we pass here
    # will be sent to the frontend, where they'll be available in an "args"
    # dictionary.
    print("RERUNING!")
    # "default" is a special argument that specifies the initial return
    # value of the component before the user has interacted with it.
    component_value = _component_func(
        userProfile=json.loads(st.session_state['mito'].get_user_profile_json()),
        analysisData=json.loads(st.session_state['mito'].steps_manager.analysis_data_json), 
        receivedMessages=st.session_state['mito'].saved_messages,
        key=key, 
        default=[]
    )

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value


st.subheader("Component with constant args")

# Create an instance of our component with a constant `name` arg, and
# print its output value.
msgs = my_component("World", key='123')
for msg in msgs[st.session_state['mito_message_count']:]:
    st.session_state['mito'].receive_message(msg)

if st.session_state['mito_message_count'] != len(msgs):
    st.session_state['mito_message_count'] = len(msgs)
