"""
We specify the installer as a list of steps that must run in order.

Currently, we just attempt to install the mitosheet package. 
"""

from mitoinstaller.commands import exit_after_error
from mitoinstaller.installer_steps import (FINAL_INSTALLER_STEPS,
                                           INITIAL_INSTALLER_STEPS,
                                           MITOSHEET_INSTALLER_STEPS,
                                           run_installer_steps)
from mitoinstaller.installer_steps.initial_installer_steps import \
    INITIAL_INSTALLER_STEPS_PRO
from mitoinstaller.log_utils import log, log_error


def do_install_or_upgrade(install_or_upgrade: str, is_pro: bool) -> None:
    """
    install_or_upgrade is the workhorse of actually installing mito. 
    It just attempts to install the `mitosheet` package, and then launch
    JLab with a starter file.

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

    # First, we try to install mitosheet
    installed_mitosheet = run_installer_steps(MITOSHEET_INSTALLER_STEPS)
    if installed_mitosheet:
        # If we installed mitosheet, log that we did
        log('install_finished_mitosheet')
        
        # Then run the final installer steps and exit
        run_installer_steps(FINAL_INSTALLER_STEPS)
        exit(0)
    else:
        # Otherwise, log the error (which prints to the user). Note that we don't give up here!
        log_error('install_failed_mitosheet', print_to_user=False)
        # TODO: we could make a clickable link to debugging instructions, or an email to send to Jake?
        # I think we should prompt users to do this, defaulting to Yes!
        exit_after_error(install_or_upgrade)