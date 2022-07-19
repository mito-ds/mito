import importlib
import os
import sys

from mitoinstaller import __version__
from mitoinstaller.commands import upgrade_mito_installer
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.jupyter_utils import set_prefered_jupyter_env_variable
from mitoinstaller.log_utils import identify, log
from mitoinstaller.user_install import (USER_JSON_PATH, go_pro,
                                        try_create_user_json_file)


def initial_install_step_create_user() -> None:

    try_create_user_json_file(is_pro=('--pro' in sys.argv))

    if not ('--pro' in sys.argv):
        # Only try and log if we're not pro
        identify()
        log('install_started', {
            'mitoinstaller_version': __version__
        })
    else:
        # If the user is going pro, make sure they are set to pro
        go_pro()

def initial_install_step_add_env_for_which_jupyter():
    """
    This install steps checks, up front, which very of jupyter we should
    launch: lab or notebook. It then stores this as an environment variable
    so that the final installer steps can launch it. 

    We do this up front, so that we can see which packages that user has 
    installed before installing Mito.
    """
    set_prefered_jupyter_env_variable()


INITIAL_INSTALLER_STEPS = [
    InstallerStep(
        'Upgrade mitoinstaller',
        upgrade_mito_installer,
        optional=True
    ),
    InstallerStep(
        'Setting up environment',
        initial_install_step_add_env_for_which_jupyter,
    ),
]
