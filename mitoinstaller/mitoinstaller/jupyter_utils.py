

import importlib
import os

from mitoinstaller.log_utils import log

# The name of the env variable we set
PREFERED_JUPYTER_ENV_VARIABLE_NAME = 'MITO_PREFFERED_JUPYTER'

# The names of which jupyter is prefered
JUPYTER_LAB = 'lab'
JUPYTER_NOTEBOOK = 'notebook'

def set_prefered_jupyter_env_variable():
    notebook = importlib.util.find_spec('notebook')
    jupyterlab = importlib.util.find_spec('jupyterlab')

    if notebook is None and jupyterlab is None:
        # If the user has nothing installed, we default to lab
        # TODO: in the future, we can randomize here - we just have to log it
        prefered_jupyter = JUPYTER_LAB

    if notebook is not None and jupyterlab is None:
        prefered_jupyter = JUPYTER_NOTEBOOK

    elif notebook is None and jupyterlab is not None:
        prefered_jupyter = JUPYTER_LAB

    else:
        # In the case that the user has both notebook and lab installed, we 
        # just default to lab. In the future, we can try and figure out if 
        # one is running, or we can randomize
        prefered_jupyter = JUPYTER_LAB

    os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME] = prefered_jupyter
    
    log('setting_prefered_jupyterlab', {
        'prefered_jupyter': prefered_jupyter
    })

def get_prefered_jupyter_env_variable() -> str:
    if PREFERED_JUPYTER_ENV_VARIABLE_NAME not in os.environ or os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME] is None:
        # If for some reason the variable is not set, then default to lab
        return JUPYTER_LAB

    return os.environ[PREFERED_JUPYTER_ENV_VARIABLE_NAME]