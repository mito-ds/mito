import threading
from time import perf_counter
import time
from mitoinstaller.commands import exit_after_error
from mitoinstaller.log_utils import log_error
import traceback
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep


def run_installer_steps(installer_steps: List[InstallerStep]) -> None:
    """
    A helper function for running a list of InstallerStep. This function
    handles the running, communication and logging of the steps. 

    ## On Reporting to the User

    This function runs installer steps in a seperate thread, so that it can 
    provide continual progress updates to the user about long-running operations.

    ## On Logging

    Our logging strategy meets the following form:
    1. If the user is a pro user, we log nothing. Duh. 
    2. Otherwise, if the user is not a pro user:
        -   When the installer is started, we always generate `install_started` log
        -   On the "Install mitosheet package" step, we log success, generating a
            'install_mitosheet_package_success' log.
        -   If the installer fails, we generate a log specific to the log step that
            failed, as well as a `install_failed` log. 
    
    Thus, if there is an `install_stared` log, and `install_mitosheet_package_success` log, we can
    conclude that install finished correctly. 
    
    If there is an `install_started` log, and and `install_failed` log, then we can conclude
    that the install failed. 
    
    Otherwise, if there is an `install_started` log and no `install_mitosheet_package_success`, 
    then the install never finished!

    Notably, we cannot log if the entire install process finishes correctly 
    because we attempt to replace the installer process with  JupyterLab, 
    which means we can no longer log.

    This cleanup and consistency in logging is primarily meant to make debugging
    installer issues easier!
    """

    print("Starting install...")

    for index, installer_step in enumerate(installer_steps):

        # Create a thread to execute the step in, and start it
        th = threading.Thread(target=installer_step.execute)
        th.start()

        # Then, we wait for the execution to finish, checking every second if it has
        while th.is_alive():

            # TODO: catch KeyboardInterrupt and exit gracefully
            print(f"Index:\nIndex, {index}", end="\r")
            print('\r')
        
            # We want to print the progress every second, so we the user knows what is going on
            time.sleep(1)


        

    