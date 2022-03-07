from mitoinstaller.installer_steps import (FINAL_INSTALLER_STEPS,
                                           INITIAL_INSTALLER_STEPS,
                                           MITOSHEET_INSTALLER_STEPS,
                                           run_installer_steps)


def do_install() -> None:
    """
    Runs the installer steps to install the `mitosheet` package.

    Notably, the process for installing Mito initially and upgrading Mito are
    identical. As such, we reuse this function to upgrade, just with different
    error and logging messages.
    """
    print("Starting install...")

    # Run the initiall installer steps
    run_installer_steps(INITIAL_INSTALLER_STEPS)

    # Then, we try to install mitosheet package
    run_installer_steps(MITOSHEET_INSTALLER_STEPS)

    # Then, we try and launch JLab
    run_installer_steps(FINAL_INSTALLER_STEPS)
