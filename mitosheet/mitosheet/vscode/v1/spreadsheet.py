# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from typing import Any, Callable, Dict, List, Optional, Union

import numpy as np
import pandas as pd
from IPython.display import HTML, display

from mitosheet.mito_backend import MitoBackend
from mitosheet.types import CodeOptions, ColumnDefinitions, DefaultEditingMode, MitoTheme
from mitosheet.utils import get_new_id

# Max delay is the longest we'll wait for the backend to respond
# Set to 5 minutes
_MAX_DELAY = 5 * 60
_RETRY_DELAY = 0.025  # 25ms

_parent_dir = os.path.dirname(os.path.abspath(__file__))
_mito_build_dir = os.path.join(_parent_dir, "mitoBuild")

# Read the CSS from the main mito_frontend.css (shared across all providers)
_mito_package_dir = os.path.normpath(os.path.join(_parent_dir, '..', '..'))
_css_file_path = os.path.join(_mito_package_dir, 'mito_frontend.css')

with open(_css_file_path) as f:
    _css_code = f.read()


class _ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle each request in a separate thread so concurrent fetches don't block each other."""
    daemon_threads = True


class _MitoVSCodeHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the VS Code Mito backend."""

    def do_OPTIONS(self) -> None:
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self) -> None:
        """Return the current generated code and version for the VS Code extension to poll."""
        if self.path != '/code':
            self.send_error(404)
            return
        code_lines = self.server.mito_backend.steps_manager.code()  # type: ignore
        self._send_json({
            'code': '\n'.join(code_lines),
            'version': self.server.code_version_ref[0],  # type: ignore
        })

    def do_POST(self) -> None:
        """Handle a message from the frontend."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            msg = json.loads(body.decode('utf-8'))
        except Exception as e:
            self._send_json({'event': 'error', 'id': '', 'error': f'Invalid JSON: {e}', 'errorShort': 'JSON Error', 'showErrorModal': False})
            return

        msg_id = msg.get('id', '')

        # Process the message on the backend
        self.server.mito_backend.receive_message(msg)  # type: ignore

        # Poll for the response
        start = time.time()
        while time.time() - start < _MAX_DELAY:
            responses = self.server.responses  # type: ignore
            for response in responses:
                if response.get('id') == msg_id:
                    self._send_json(response)
                    return
            time.sleep(_RETRY_DELAY)

        # Timeout
        self._send_json({
            'event': 'error',
            'id': msg_id,
            'error': f'No response received for message id: {msg_id}',
            'errorShort': 'Timeout',
            'showErrorModal': False,
        })

    def _send_json(self, data: Dict[str, Any]) -> None:
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response_bytes)

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress logging output
        pass


def _get_vscode_frontend_code(port: int, div_id: str, mito_backend: MitoBackend) -> str:
    js_file_path = os.path.join(_mito_build_dir, 'component.js')
    with open(js_file_path) as f:
        js_code = f.read()

    js_code = js_code.replace("'REPLACE_THIS_WITH_PORT'", str(port))
    js_code = js_code.replace('"REPLACE_THIS_WITH_PORT"', str(port))
    js_code = js_code.replace('REPLACE_THIS_WITH_DIV_ID', div_id)

    # NOTE: because the CSS has strings inside of it, we need to replace the " quotes
    # with ` quotes, which properly contain the CSS string
    js_code = js_code.replace('"REPLACE_THIS_WITH_CSS"', "`" + _css_code + "`")
    js_code = js_code.replace('`REPLACE_THIS_WITH_CSS`', "`" + _css_code + "`")

    # Encode initial data as Uint8Arrays to avoid JSON string escaping issues
    def to_uint8_arr(string: str) -> List[int]:
        return np.frombuffer(string.encode("utf8"), dtype=np.uint8).tolist()  # type: ignore

    js_code = js_code.replace('["REPLACE_THIS_WITH_SHEET_DATA_BYTES"]', f'{to_uint8_arr(mito_backend.steps_manager.sheet_data_json)}')
    js_code = js_code.replace('["REPLACE_THIS_WITH_ANALYSIS_DATA_BYTES"]', f'{to_uint8_arr(mito_backend.steps_manager.analysis_data_json)}')
    js_code = js_code.replace('["REPLACE_THIS_WITH_USER_PROFILE_BYTES"]', f'{to_uint8_arr(mito_backend.get_user_profile_json())}')

    return js_code


def spreadsheet(
        *args: Union[pd.DataFrame, str, None],
        sheet_functions: Optional[List[Callable]] = None,
        importers: Optional[List[Callable]] = None,
        editors: Optional[List[Callable]] = None,
        df_names: Optional[List[str]] = None,
        import_folder: Optional[str] = None,
        code_options: Optional[CodeOptions] = None,
        column_definitions: Optional[List[ColumnDefinitions]] = None,
        default_editing_mode: Optional[DefaultEditingMode] = None,
        theme: Optional[MitoTheme] = None,
        height: Optional[str] = None,
        key: Optional[str] = None,
) -> MitoBackend:
    """
    Create a new instance of the Mito spreadsheet in a VS Code Jupyter notebook.

    Parameters
    ----------
    args: pd.DataFrame or str or None
        The arguments to pass to the Mito spreadsheet. If a dataframe is
        passed, it will be displayed as a sheet tab. If a string is passed,
        it will be read in with a pd.read_csv call.
    sheet_functions: List[Callable]
        A list of functions that can be used in the spreadsheet.
    importers: List[Callable]
        A list of functions that can be used to import dataframes.
    editors: List[Callable]
        A list of functions that can be used to edit dataframes.
    df_names: List[str]
        A list of names for the dataframes passed in.
    import_folder: str
        The folder to use for importing files.
    code_options: CodeOptions
        Options for code generation.
    column_definitions: List[ColumnDefinitions]
        Column definitions for the spreadsheet.
    default_editing_mode: DefaultEditingMode
        The default editing mode for the spreadsheet.
    theme: MitoTheme
        The theme to use for the spreadsheet.
    height: str
        The height of the spreadsheet.
    key: str
        A unique key for this spreadsheet instance.

    Returns
    -------
    MitoBackend
        The Mito backend instance. Callers can inspect state via
        backend.steps_manager.
    """
    # Create the backend
    mito_backend = MitoBackend(
        *args,
        import_folder=import_folder,
        user_defined_functions=sheet_functions,
        user_defined_importers=importers,
        user_defined_editors=editors,
        code_options=code_options,
        column_definitions=column_definitions,
        default_editing_mode=default_editing_mode,
        theme=theme,
    )

    # Attach a send function that collects responses and tracks the code version
    responses: List[Dict[str, Any]] = []
    code_version: List[int] = [0]  # mutable container so the closure can increment it

    def mito_send(response: Dict[str, Any]) -> None:
        responses.append(response)
        if response.get('shared_variables') is not None:
            code_version[0] += 1

    mito_backend.mito_send = mito_send

    # Handle df_names via args_update
    if df_names is not None and len(df_names) > 0:
        mito_backend.receive_message({
            'event': 'update_event',
            'id': get_new_id(),
            'type': 'args_update',
            'params': {
                'args': df_names
            },
        })

    # Bind the HTTP server on a random port
    server = _ThreadedHTTPServer(('127.0.0.1', 0), _MitoVSCodeHandler)
    server.mito_backend = mito_backend  # type: ignore
    server.responses = responses  # type: ignore
    server.code_version_ref = code_version  # type: ignore  (list used as mutable int ref)

    port = server.server_address[1]

    # Start the server in a daemon thread so it doesn't block shutdown
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    # Generate a unique div id
    div_id = get_new_id()

    # Build the JS code
    js_code = _get_vscode_frontend_code(port, div_id, mito_backend)

    # Render the spreadsheet
    height_style = f'height: {height};' if height else 'height: 500px;'
    display(HTML(f'''<div id="{div_id}" style="{height_style}"></div><script>{js_code}</script>'''))

    # Emit the custom MIME type so the mito-vscode extension can discover this session's
    # port and start polling /code to write generated code into the cell below.
    display(  # type: ignore
        {'application/x-mito': {'port': port, 'session_id': div_id}},
        raw=True,
    )

    return mito_backend
