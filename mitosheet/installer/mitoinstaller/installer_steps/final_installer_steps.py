


import os
import sys

from mitoinstaller.commands import (check_running_jlab_3_processes,
                                    check_running_jlab_processes)
from mitoinstaller.create_startup_file import create_startup_file
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import log_error
from mitoinstaller.starter_notebook import (MITO_STARTER_NOTEBOOK_PATH,
                                            try_create_starter_notebook)
from mitoinstaller.user_install import is_running_test
from termcolor import colored # type: ignore


def replace_process_with_jupyter_lab():
    """
    Switch the currently running process with a running JupyterLab instance.

    If we are running tests, then we do not launch JLab. 
    # TODO: we don't want to launch this if we're inside a Docker script?
    """
    if is_running_test():
        return

    os.execl(sys.executable, 'python', '-m', 'jupyter', 'lab', MITO_STARTER_NOTEBOOK_PATH)


def get_success_message():
    """
    Note that not many users get to the success message!

    We show a different message depending on if this is an install or an upgrade,
    and we further tell the user different things if they have a currently running
    JLab instance (as they need to restart this)
    """
    running_jlab = check_running_jlab_3_processes()

    separator_line = '----------------------------------------------------------------------------'

    install_or_upgrade = 'install'
    install_start = 'Mito has finished installing'
    # NOTE: this is a bug that gives the wrong message, but it's fine, 
    # since most people are installing and not upgrading.
    upgrade_start = 'Mito has finished installing'

    launch_jlab = 'Launch JupyterLab with:\t' + colored('python -m jupyter lab', 'green')
    relaunch_jlab = colored('Please shut down the currently running JupyterLab and relaunch it to enable Mito', 'green')

    render_mitosheet = colored('Then render a mitosheet following the instructions here: https://docs.trymito.io/how-to/creating-a-mitosheet', 'green')

    if not running_jlab:
        if install_or_upgrade == 'install':
            return '\n{separator_line}\n{install_start}\n\n{launch_jlab}\n\n{render_mitosheet}\n{separator_line}'.format(
                separator_line=separator_line,
                install_start=install_start,
                launch_jlab=launch_jlab,
                render_mitosheet=render_mitosheet,
            )
        else:
            return '\n{separator_line}\n{upgrade_start}\n\n{launch_jlab}\n\n{render_mitosheet}\n{separator_line}'.format(
                separator_line=separator_line,
                upgrade_start=upgrade_start,
                launch_jlab=launch_jlab,
                render_mitosheet=render_mitosheet,
            )
    else:
        if install_or_upgrade == 'install':
            return '\n{separator_line}\n{install_start}\n\n{relaunch_jlab}\n\n{render_mitosheet}\n{separator_line}'.format(
                separator_line=separator_line,
                install_start=install_start,
                relaunch_jlab=relaunch_jlab,
                render_mitosheet=render_mitosheet,
            )
        else:
            return '\n{separator_line}\n{upgrade_start}\n\n{relaunch_jlab}\n\n{render_mitosheet}\n{separator_line}'.format(
                separator_line=separator_line,
                upgrade_start=upgrade_start,
                relaunch_jlab=relaunch_jlab,
                render_mitosheet=render_mitosheet,
            )

def print_success_message():
    """
    Prints a success message to the user, in the case that we cannot
    launch JupyterLab. Furthermore, logs that the jupyter lab instance
    could not be launched.
    """
    # If we get past this, then JLab must have not been able to replace the current process, so we 
    # log that, and then print the success message anyways
    log_error('failed_launch_jupyterlab', print_to_user=False)

    print(get_success_message())


FINAL_INSTALLER_STEPS = [
    InstallerStep(
        'Create import mito startup file',
        create_startup_file,
        True
    ),
    InstallerStep(
        'Creating a Mitosheet starter notebook',
        try_create_starter_notebook
    ),
    InstallerStep(
        'Start JupyterLab',
        replace_process_with_jupyter_lab,
        optional=True
    ),
    # We do out best to replace the running process with JupyterLab, but 
    # if this fails, then just print a success message to the user
    InstallerStep(
        'Finish Installation',
        print_success_message
    )
]
