from time import perf_counter
from mitoinstaller.commands import exit_after_error
from mitoinstaller.log_utils import log_error
import traceback
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep


def run_installer_steps(installer_steps: List[InstallerStep]) -> None:
    """
    A helper function for running a list of InstallerStep. This function
    handles the running and logging of the steps. 

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

    for installer_step in installer_steps:
        try:
            # Print the step name, so the user knows what's going on
            print(installer_step.installer_step_name)

            # Measure the start time so we can see how long this took
            start_time = perf_counter()
            
            # Execute the step
            installer_step.execute()

            # If we should log success, then log it
            if installer_step.should_log_success:
                installer_step.log_success(start_time)
            
        except:
            # Log that we failed on this step
            installer_step.log_failure()

            # If the install step is not optional, log that the install failed and exit
            # with an error message for the user
            if not installer_step.optional:
                # Do one major log if we fail, so that we can easily tell what happened
                log_error('install_failed', {'installer_step_name': installer_step.installer_step_name})
                # I think we should prompt users to do this, defaulting to Yes!
                exit_after_error()

    