from typing import Any, Dict, Optional
from mitosheet.mito_backend import MitoBackend
from mitosheet.mito_flask.v1.flatten_utils import (flatten_mito_backend_to_json, read_backend_state_string_to_mito_backend)

def process_mito_event(backend_state: Optional[str], mito_event: Optional[Dict[str, Any]]) -> Any:

    if backend_state is None:
        mito_backend = MitoBackend()
        from flask import jsonify
        return jsonify({
            "state": flatten_mito_backend_to_json(mito_backend),
            "response": None,
        })

    mito_backend = read_backend_state_string_to_mito_backend(backend_state)

    response = None
    def mito_send(message):
        nonlocal response
        response = message
        
    mito_backend.mito_send = mito_send
    if mito_event:
        mito_backend.receive_message(mito_event)

    from flask import jsonify
    return jsonify({
        "state": flatten_mito_backend_to_json(mito_backend),
        "response": response,
    })