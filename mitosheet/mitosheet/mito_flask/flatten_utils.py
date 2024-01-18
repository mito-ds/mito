import pickle
import base64
from mitosheet.mito_backend import MitoBackend

def flatten_mito_backend_to_string(mito_backend: MitoBackend) -> str:
    s = pickle.dumps(mito_backend)
    return base64.b64encode(s).decode("utf-8")

def flatten_string_to_mito_backend(s: str) -> MitoBackend:
    return pickle.loads(base64.b64decode(s))