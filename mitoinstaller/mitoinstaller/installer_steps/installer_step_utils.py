
from typing import List

from mitoinstaller.commands import exit_after_error
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import log_error
from mitoinstaller.print_utils import get_installer_start_message


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

    print(get_installer_start_message())

    try:
        for installer_step in installer_steps:
            print(installer_step.installer_step_name)
            installer_step.execute()
    except:
        # Do one major log if we fail, so that we can easily tell what happened
        log_error('install_failed')
        exit_after_error()


        

    