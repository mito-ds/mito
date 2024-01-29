import json
from mitosheet.mito_backend import MitoBackend
from mitosheet.saved_analyses import get_saved_analysis_string


def flatten_mito_backend_to_json(mito_backend: MitoBackend) -> str:
<<<<<<< Updated upstream
    # TODO: we do have to save the initial args, but we ignore that for now
    # as we're just testing sizing. In Flask, we can make it so there is no
    # such thing as initial args
=======
    dfs = mito_backend.steps_manager.curr_step.dfs
    s = pickle.dumps(dfs)
    mb_state = base64.b64encode(s).decode("utf-8")
>>>>>>> Stashed changes
    return json.dumps({
        'backend_state': get_saved_analysis_string(mito_backend.steps_manager),
        'shared_state_variables': mito_backend.get_shared_state_variables()
    })

def read_backend_state_string_to_mito_backend(backend_state_string: str) -> MitoBackend:
<<<<<<< Updated upstream
    mito_backend = MitoBackend()
    steps_manager = mito_backend.steps_manager

    previous_public_interface_version = steps_manager.public_interface_version
    previous_code_options = steps_manager.code_options

    analysis = json.loads(backend_state_string)

    try:
        # Before we execute the steps, update to the public interface version of the saved analysis
        steps_manager.public_interface_version = analysis['public_interface_version']
        steps_manager.code_options = analysis['code_options']

        steps_manager.execute_steps_data(new_steps_data=analysis['steps_data'])

    except:
        # If we error, reset the public interface version, and code options
        steps_manager.public_interface_version = previous_public_interface_version
        steps_manager.code_options = previous_code_options
        raise
    
    return mito_backend
=======
    dfs = pickle.loads(base64.b64decode(backend_state_string))
    mb = MitoBackend(*dfs)
    return mb
>>>>>>> Stashed changes
