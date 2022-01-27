"""
We specify the installer as a list of steps that 
must run in order, for the installer.

Currently, we take the following steps:
1. First, try and install mitosheet3. Because mitosheet3 uses 
   JLab 3, we first check if the user has any conflicting
   JLab 2 dependencies installed. If they do, we abort. If they 
   don't, we update them to JLab 3.
2. Then, if the above installation of mitosheet3 fails for 
   any reason, we try to install mitosheet on JLab 2. 
3. If neither of them work, we give up, sadly. 
"""

from mitoinstaller.commands import exit_after_error
from mitoinstaller.installer_steps import (FINAL_INSTALLER_STEPS,
                                           INITIAL_INSTALLER_STEPS,
                                           MITOSHEET3_INSTALLER_STEPS,
                                           MITOSHEET_INSTALLER_STEPS,
                                           run_installer_steps)
from mitoinstaller.installer_steps.initial_installer_steps import INITIAL_INSTALLER_STEPS_PRO
from mitoinstaller.log_utils import log, log_error


def do_install_or_upgrade(install_or_upgrade, is_pro: bool):
    """
    install_or_upgrade is the workhorse of actually installing mito. 
    It first attempts mitosheet3, and if that fails, then mitosheet.

    install_or_upgrade should be 'install' or 'upgrade'.

    Notably, the process for installing Mito initially and upgrading Mito are
    identical. As such, we reuse this function to upgrade, just with different
    error and logging messages.
    """
    print("Starting {install_or_upgrade}...".format(install_or_upgrade=install_or_upgrade))

    # Change the installation depending if the user is a pro user or not
    if not is_pro:
        run_installer_steps(INITIAL_INSTALLER_STEPS)
    else:
        run_installer_steps(INITIAL_INSTALLER_STEPS_PRO)

    # First, we try to install mitosheet3
    installed_mitosheet_3 = run_installer_steps(MITOSHEET3_INSTALLER_STEPS)
    if installed_mitosheet_3:
        # If we installed mitoshet3, log that we did
        log('install_finished_mitosheet3')
        
        # Then run the final installer steps and exit
        run_installer_steps(FINAL_INSTALLER_STEPS)
        exit(0)
    else:
        # Otherwise, log the error (which prints to the user). Note that we don't give up here!
        log_error('install_failed_mitosheet3', print_to_user=False)

    # Then, try to install mitosheet
    installed_mitosheet = run_installer_steps(MITOSHEET_INSTALLER_STEPS)
    if installed_mitosheet:
        log('install_finished_mitosheet')
    else:
        # Log the error and give up if both our installations failed
        log_error('install_failed_mitosheet', print_to_user=False)
        # TODO: we could make a clickable link to debugging instructions, or an email to send to Jake?
        # I think we should prompt users to do this, defaulting to Yes!
        exit_after_error(install_or_upgrade)

    # Then, run the final installer steps
    run_installer_steps(FINAL_INSTALLER_STEPS)

    
