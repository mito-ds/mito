from mitoinstaller.log_utils import log_error
import traceback
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep


def run_installer_steps(installer_steps: List[InstallerStep]):
    """
    A helper function that runs the installer steps, returning
    True if they all terminate without error, and False if any
    of them return with an error.
    """

    for installer_step in installer_steps:
        try:
            # Print the step name, so the user knows what's going on
            print(installer_step.installer_step_name)
            installer_step.execute()
        except:
            # Log the error. Print if it's not an optional step
            log_error(installer_step.installer_step_name, print_to_user=(not installer_step.optional))

            # If we error on a non optional step, then return False
            # and continue if it was an optional step
            if installer_step.optional:
                continue
            else:
                return False
    
    return True


    