"""
Utilities for figuring out where Mito is being run.
"""

import os

from mitosheet.utils import run_command


def is_in_google_colab() -> bool:
    # From: https://discourse.jupyter.org/t/find-out-if-my-code-runs-inside-a-notebook-or-jupyter-lab/6935/19
    try:
        from IPython.core.getipython import get_ipython
        return 'google.colab' in str(get_ipython()) # type: ignore
    except:
        return False

def is_in_vs_code() -> bool:
    # From: https://github.com/microsoft/vscode-jupyter/issues/3364
    return 'VSCODE_PID' in os.environ

def is_jupyter_lab_running() -> bool:
    """
    Format of command output: 

    Currently running servers:
    http://localhost:8888/?token=wenflwenflqnwdlkqmwldkm :: Path/to/launch
    """
    try:
        return '::' in run_command(['jupyter', 'lab', 'list'])[0]
    except:
        return False

def is_jupyter_notebook_running() -> bool:
    """
    Format of command output: 

    Currently running servers:
    http://localhost:8888/?token=wenflwenflqnwdlkqmwldkm :: Path/to/launch
    """
    try:
        return '::' in run_command(['jupyter', 'notebook', 'list'])[0]
    except:
        return False

def is_notebook() -> bool:
    """
    Returns true if this code is run in some sort of notebook
    Taken from: https://stackoverflow.com/questions/15411967/how-can-i-check-if-code-is-executed-in-the-ipython-notebook
    """
    try:
        from IPython.core.getipython import get_ipython
    except:
        return False
    try:
        shell = get_ipython().__class__.__name__ # type: ignore
        if shell == 'ZMQInteractiveShell':
            return True   # Jupyter notebook or qtconsole
        elif shell == 'TerminalInteractiveShell':
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except NameError:
        return False      # Probably standard Python interpreter

def get_location() -> str:
    notebook = is_notebook()
    lab_running = is_jupyter_lab_running()

    if is_in_google_colab():
        return 'location_google_colab'
    elif is_in_vs_code():
        return 'location_vs_code'
    elif is_streamlit():
        return 'location_streamlit'
    elif is_dash():
        return 'location_dash'
    elif is_jupyterlite():
        return 'location_jupyterlite'
    elif notebook and lab_running:
        # NOTE: Since Notebook 7 runs on jlab, we can't easily 
        # tell if the user is viewing the notebook interface or the lab,
        # so we just say that they are in jupyter.
        return 'location_jupyter'
    elif notebook:
        # NOTE: in this case, they are not using jlab so we don't 
        # know what notebook they are in. So we just say unknown
        return 'location_unknown_notebook'
    else:
        return 'location_unknown'


# https://stackoverflow.com/questions/43878953/how-does-one-detect-if-one-is-running-within-a-docker-container-within-python
def _is_docker() -> bool:
    path = '/proc/self/cgroup'
    return (
        os.path.exists('/.dockerenv') or
        os.path.isfile(path) and any('docker' in line for line in open(path))
    )
# We cache this so we don't have to take a performance impact
IS_DOCKER = _is_docker()
def is_docker() -> bool:
    return IS_DOCKER



def is_jupyterlite() -> bool:
    """
    We do our best to guess if you are in jupyterlite, if:
    1. You have pyodide installed
    2. You cannot start a thread
    """
    try:
        import pyodide
        
        try:
            import threading
            threading.Thread(target=lambda x: x).start()
        except RuntimeError:
            return True

    except ImportError:
        pass

    return False

def is_streamlit() -> bool:
    try:
        # TODO: have to handle versions of streamlit that don't have this
        # or it's in different places: https://discuss.streamlit.io/t/how-to-check-if-code-is-run-inside-streamlit-and-not-e-g-ipython/23439/8
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except ModuleNotFoundError:
        return False
    
_IS_DASH = False
    
def is_dash() -> bool:
    global _IS_DASH
    # If we are ever in dash, we always are, so we can avoid work. Notably, because the dash app starts after the Mito Backend is created
    # we do have to check multiple times. 
    if _IS_DASH:
        return True
    
    try:
        
        import dash
        from flask import current_app

        # If any of these routes are defined, then we are in a dash app
        dash_routes = [
            '/_dash-dependencies',
            '/_dash-component-suites',
            '/_dash-layout'
        ]

        for rule in current_app.url_map.iter_rules():
            for dash_route in dash_routes:
                if dash_route in str(rule):
                    return True

    except:
        pass
    return False