import json
from mitosheet.mito_backend import MitoBackend
from mitosheet.saved_analyses import get_saved_analysis_string


def flatten_mito_backend_to_json(mito_backend: MitoBackend) -> str:
    dfs = mito_backend.steps_manager.curr_step.dfs
    s = pickle.dumps(dfs)
    mb_state = base64.b64encode(s).decode("utf-8")
    return json.dumps({
        'backend_state': mb_state,
        'shared_state_variables': mito_backend.get_shared_state_variables()
    })

def read_backend_state_string_to_mito_backend(backend_state_string: str) -> MitoBackend:
    dfs = pickle.loads(base64.b64decode(backend_state_string))
    mb = MitoBackend(*dfs)
    return mb
