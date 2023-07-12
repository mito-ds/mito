import json
import os
import streamlit.components.v1 as components
import streamlit as st

from mitosheet.mito_backend import MitoBackend

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

if not _RELEASE:
    _mito_component_func = components.declare_component(
        # We give the component a simple, descriptive name ("my_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "my_component",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    mito_build_dir = os.path.join(parent_dir, "mitoBuild")
    _mito_component_func = components.declare_component("my_component", path=mito_build_dir)

    message_passer_build_dr = os.path.join(parent_dir, "messagingBuild")
    _message_passer_component_func = components.declare_component("message-passer", path=message_passer_build_dr)



@st.cache_resource
def get_mito_backend(_args, key): # So it caches on key
    mito_backend = MitoBackend(*_args)

    # Make a send function that stores the responses in a list
    responses = []
    def send(response):
        responses.append(response)
    
    mito_backend.mito_send = send

    return mito_backend, responses

def message_passer_component(key=None):
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
    #
    # "default" is a special argument that specifies the initial return
    # value of the component before the user has interacted with it.
    component_value = _message_passer_component_func(key=key)
    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def mito_component(*args, key=None):
    """
    
    When you set a component value, the entire script rexecutes from
    the top, and the new return value of the component is used as the
    set value. 

    Notably, the return value of a function is only accessible _after_
    the function has been executed. 

    So, if we set a msg as the component value, then the script will run,
    render the component, get the new message back, and then process it. 
    
    But the props (which need to have the response) can only be set
    _before_ the component is rendered. So we cant have a response
    in the props, as we haven't received the message yet.
    """


    mito_backend, responses = get_mito_backend(args, key)
    sheet_data_json = mito_backend.steps_manager.sheet_data_json,
    analysis_data_json = mito_backend.steps_manager.analysis_data_json,
    user_profile_json = mito_backend.get_user_profile_json()

    msg = message_passer_component(key=key + 'message_passer')
    print(msg)
    if msg is not None:
        print("\n\n\n MESSAGE")
        print(msg)
        mito_backend.receive_message(msg)
        print("RESPONSES", responses)
        
    responses_json = json.dumps(responses)

    _mito_component_func(key=key, sheet_data_json=sheet_data_json, analysis_data_json=analysis_data_json, user_profile_json=user_profile_json, responses_json=responses_json)

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return mito_backend.steps_manager.curr_step.final_defined_state.dfs


# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run my_component/__init__.py`
import streamlit as st

st.subheader("Mito Component Test Page")

# We use the special "key" argument to assign a fixed identity to this
# component instance. By default, when a component's arguments change,
# it is considered a new instance and will be re-mounted on the frontend
# and lose its current state. In this case, we want to vary the component's
# "name" argument without having it get recreated.
name_input = st.text_input("Enter a name", value="Streamlit")
import pandas as pd
df = pd.DataFrame({'A': [name_input]})
num_clicks = mito_component(df, key="foo")