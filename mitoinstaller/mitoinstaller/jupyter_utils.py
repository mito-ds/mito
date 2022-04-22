

import importlib
import os
import sys
from mitoinstaller.commands import run_command

from mitoinstaller.log_utils import log

# The name of the env variable we set
PREFERED_JUPYTER_ENV_VARIABLE_NAME = 'MITO_PREFFERED_JUPYTER'

# The names of which jupyter is prefered
JUPYTER_LAB = 'lab'
JUPYTER_NOTEBOOK = 'notebook'

def is_jupyter_notebook_running() -> bool:
    """
    Format of command output: 

    Currently running servers:
    http://localhost:8888/?token=wenflwenflqnwdlkqmwldkm :: Path/to/launch
    """
    try:
        return '::' in run_command([sys.executable, "-m", 'jupyter', 'notebook', 'list'])[0]
    except:
        return False

def set_prefered_jupyter_env_variable():
    notebook = importlib.util.find_spec('notebook')
    jupyterlab = importlib.util.find_spec('jupyterlab')

    reason = 'default'

    if notebook is None and jupyterlab is None:
        # If the user has nothing installed, we default to lab
        # TODO: in the future, we can randomize here - we just have to log it
        prefered_jupyter = JUPYTER_LAB
        reason = 'neither notebook or lab installed'

    if notebook is not None and jupyterlab is None:
        prefered_jupyter = JUPYTER_NOTEBOOK
        reason = 'only notebook installed'

    elif notebook is None and jupyterlab is not None:
        prefered_jupyter = JUPYTER_LAB
        reason = 'only lab installed'

    else:
        # In the case that the user has both notebook and lab installed, we
        # check if the user has any notebooks running. If they do, we use
        # notebooks. Otherwise, we default to lab
        if is_jupyter_notebook_running():
            prefered_jupyter = JUPYTER_NOTEBOOK
            reason = 'both notebook and lab installed and notebook running'
        else:
            prefered_jupyter = JUPYTER_LAB
            reason = 'both notebook and lab installed and notebook not running'

    os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME] = prefered_jupyter
    
    log('setting_prefered_jupyterlab', {
        'prefered_jupyter': prefered_jupyter,
        'prefered_jupyter_reason': reason
    })

def get_prefered_jupyter_env_variable() -> str:
    if PREFERED_JUPYTER_ENV_VARIABLE_NAME not in os.environ or os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME] is None:
        # If for some reason the variable is not set, then default to lab
        return JUPYTER_LAB

    return os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME]