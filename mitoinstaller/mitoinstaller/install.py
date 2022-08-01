from mitoinstaller.installer_steps import (ALL_INSTALLER_STEPS,
                                           run_installer_steps)
from mitoinstaller.installer_steps.initial_installer_steps import initial_install_step_create_user
from mitoinstaller.log_utils import log_error


def do_install() -> None:
    """
    Runs the installer steps to install the `mitosheet` package.

    Notably, the process for installing Mito initially and upgrading Mito are
    identical. As such, we reuse this function to upgrade, just with different
    error and logging messages.
    """
    # We need to create the user json file before we can run anything,
    # as this creates the experiment variant we use throughout the rest of the
    # installer.
    try:
        initial_install_step_create_user()
    except:
        log_error('install_failed', {'installer_step_name': 'create_user'})
        log_error('create_user_failed')
        exit(1)

    # Run the installer steps
    run_installer_steps(ALL_INSTALLER_STEPS)
