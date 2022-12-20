


import os
import sys
import time

import analytics
from mitoinstaller.create_startup_file import create_startup_file
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.jupyter_utils import get_prefered_jupyter_env_variable
from mitoinstaller.starter_notebook import (MITO_STARTER_NOTEBOOK_PATH,
                                            try_create_starter_notebook)
from mitoinstaller.user_install import is_running_test
from termcolor import colored  # type: ignore

def replace_process_with_jupyter():
    """
    Switch the currently running process with a running lab or notebook
    instance, depending on which we think the user would prefer.

    If we are running tests, then we do not launch JLab. 
    # TODO: we don't want to launch this if we're inside a Docker script?
    """
    if is_running_test():
        return

    if ('--no-jupyter-launch' in sys.argv):
        print("Not starting Jupyter due to --no-jupyter-launch")
        return 

    # Get the prefered jupyter to launch, which we saved before
    prefered_jupyter = get_prefered_jupyter_env_variable()

    # Flush analytics before we terminate the process, as it's our last chance
    analytics.flush()

    os.execl(sys.executable, 'python', '-m', 'jupyter', prefered_jupyter, MITO_STARTER_NOTEBOOK_PATH)



def print_success_message():
    """
    Prints a success message to the user, in the case that we cannot
    launch JupyterLab. TODO: Furthermore, logs that the jupyter lab instance
    could not be launched.
    """
    # Finially, if we get here, we print to the user that they should launch
    # JLab and run it. Note that we only get here if the final install step of
    # launching JLab does not work
    print("\n\nThe mitosheet package has correctly been installed.")
    print("To see instructions to render a mitosheet, see docs: ", colored('https://docs.trymito.io/how-to/creating-a-mitosheet', 'green'))


FINAL_INSTALLER_STEPS = [
    InstallerStep(
        'Create import mito startup file',
        create_startup_file,
        optional=True
    ),
    InstallerStep(
        'Creating a Mitosheet starter notebook',
        try_create_starter_notebook
    ),
    InstallerStep(
        'Start Jupyter',
        replace_process_with_jupyter,
        optional=True,
        no_print_in_main_loop=True
    ),
    # We do out best to replace the running process with JupyterLab, but 
    # if this fails, then just print a success message to the user
    InstallerStep(
        'Finish Installation',
        print_success_message,
        optional=True
    )
]