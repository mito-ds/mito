import json
from mitosheet.mito_backend import MitoBackend
from mitosheet.saved_analyses import get_saved_analysis_string


def flatten_mito_backend_to_json(mito_backend: MitoBackend) -> str:
    saved_analysis_string = get_saved_analysis_string(mito_backend.steps_manager)
    return json.dumps({
        'backend_state': saved_analysis_string,
        'shared_state_variables': mito_backend.get_shared_state_variables()
    })

def read_backend_state_string_to_mito_backend(backend_state_string: str) -> MitoBackend:

    mb = MitoBackend()
    steps_manager = mb.steps_manager
    analysis = json.loads(backend_state_string)

    previous_public_interface_version = steps_manager.public_interface_version
    previous_code_options = steps_manager.code_options

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

    return mb
