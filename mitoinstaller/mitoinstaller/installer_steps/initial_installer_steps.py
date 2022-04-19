import os
import sys

from mitoinstaller import __version__
from mitoinstaller.commands import upgrade_mito_installer
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import identify, log
from mitoinstaller.user_install import (USER_JSON_PATH, go_pro,
                                        try_create_user_json_file)


def initial_install_step_create_user():

    if not os.path.exists(USER_JSON_PATH):
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

INITIAL_INSTALLER_STEPS = [
    InstallerStep(
        'Create mito user',
        initial_install_step_create_user
    ),
    InstallerStep(
        'Upgrade mitoinstaller',
        upgrade_mito_installer,
        optional=True
    ),
]
