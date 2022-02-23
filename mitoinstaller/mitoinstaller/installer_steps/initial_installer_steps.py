from mitoinstaller import __version__
from mitoinstaller.commands import upgrade_mito_installer
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import identify, log
from mitoinstaller.user_install import (get_static_user_id,
                                        try_create_user_json_file)


def initial_install_step_create_user():
    static_user_id = get_static_user_id()

    # If the user has no static install ID, create one
    if static_user_id is None:
        try_create_user_json_file(is_pro=False)
    
    identify()
    log('install_started', {
        'mitoinstaller_version': __version__
    })


def initial_install_step_create_pro_user():
    # Try and create the user.json file, or at least
    # update mitosheet_telemetry if it is not already true
    try_create_user_json_file(is_pro=True)


INITIAL_INSTALLER_STEPS = [
    InstallerStep(
        'Create mito user',
        initial_install_step_create_user
    ),
    InstallerStep(
        'Upgrading mitoinstaller',
        upgrade_mito_installer
    ),
]

INITIAL_INSTALLER_STEPS_PRO = [
    InstallerStep(
        'Create pro mito user',
        initial_install_step_create_pro_user
    ),
    InstallerStep(
        'Upgrading mitoinstaller',
        upgrade_mito_installer
    ),
]
