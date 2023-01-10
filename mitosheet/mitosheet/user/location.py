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
    notebook_running = is_jupyter_notebook_running()

    if is_in_google_colab():
        return 'location_google_colab'
    elif is_in_vs_code():
        return 'location_vs_code'
    elif notebook and (lab_running and not notebook_running):
        return 'location_jupyter_lab'
    elif notebook and (not lab_running and notebook_running):
        return 'location_jupyter_notebook'
    elif notebook:
        # NOTE: in this case, both jlab and jnotebook are running, and
        # we cannot tell where we are. So we just say unknown
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
