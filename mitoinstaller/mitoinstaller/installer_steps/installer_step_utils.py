from mitoinstaller.commands import exit_after_error
from mitoinstaller.log_utils import log_error
import traceback
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep


def run_installer_steps(installer_steps: List[InstallerStep]) -> None:
    """
    A helper function that runs a list of InstallerSteps. This function
    handles running the steps, and:
    1. Logs if they succed
    2. Logs if they fail
    3. If a non-optional step fails, then terminates the program
    """

    for installer_step in installer_steps:
        try:
            # Print the step name, so the user knows what's going on
            print(installer_step.installer_step_name)

            # Execute the step
            installer_step.execute()
        except:
            # Log that we failed on this step
            installer_step.log_failure()

            # If the install step is not optional, log that the install failed and exit
            # with an error message for the user
            if not installer_step.optional:
                # Do one major log if we fail, so that we can easily tell what happened
                log_error('installer_failed')
                # I think we should prompt users to do this, defaulting to Yes!
                exit_after_error()

    