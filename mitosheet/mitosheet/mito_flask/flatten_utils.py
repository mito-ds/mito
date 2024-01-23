import json
import pickle
import base64
from mitosheet.mito_backend import MitoBackend

def flatten_mito_backend_to_json(mito_backend: MitoBackend) -> str:
    s = pickle.dumps(mito_backend)
    mb_state = base64.b64encode(s).decode("utf-8")
    return json.dumps({
        "backend_state": mb_state,
        "shared_state_variables": mito_backend.get_shared_state_variables(),
    })

def read_backend_state_string_to_mito_backend(backend_state_string: str) -> MitoBackend:
    mb = pickle.loads(base64.b64decode(backend_state_string))
    return mb
