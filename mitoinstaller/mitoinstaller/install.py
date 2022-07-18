from mitoinstaller.installer_steps import (ALL_INSTALLER_STEPS,
                                           run_installer_steps)


def do_install() -> None:
    """
    Runs the installer steps to install the `mitosheet` package.

    Notably, the process for installing Mito initially and upgrading Mito are
    identical. As such, we reuse this function to upgrade, just with different
    error and logging messages.
    """
    # Run the installer steps
    run_installer_steps(ALL_INSTALLER_STEPS)
