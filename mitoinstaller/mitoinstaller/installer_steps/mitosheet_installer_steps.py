import sys
from time import perf_counter
from mitoinstaller.commands import (get_jupyterlab_metadata,
                                    install_pip_packages, run_command,
                                    uninstall_pip_packages)
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import get_recent_traceback, log


def install_step_mitosheet_check_dependencies():
    """
    This is the most complex step in the installation process. It's
    goal is to check if the users existing installation can safely
    be upgraded to JLab 3.0. 

    To do this, it checks a variety of conditions, mostly around what
    version of JLab they have installed, and if this version of JLab has
    any installed dependencies (that we cannot safely upgrade).
    """

    jupyterlab_version, extension_names = get_jupyterlab_metadata()

    # If no JupyterLab is installed, we can continue with install, as
    # there are no conflict dependencies
    if jupyterlab_version is None:
        return
    
    # If JupyterLab 3 is installed, then we are are also good to go
    if jupyterlab_version.startswith('3'):
        return

    # If the user has no extension, we can upgrade
    if len(extension_names) == 0:
        return
    
    else:
        raise Exception('Installed extensions {extension_names}'.format(extension_names=extension_names))

def remove_mitosheet_3_if_present():
    """
    Because of our changes to the package hierarchy, if the user
    currently has mitosheet3 installed, we need to uninstall it,
    as the user is moving to mitosheet instead. 

    Otherwise, if the user has mitosheet and mitosheet3 installed,
    they will get an error launching jlab because it will lead to 
    two different extensions getting registered with the same
    name.
    """
    uninstall_pip_packages('mitosheet3')
    

def install_step_mitosheet_install_mitosheet():
    try:
        print("This may take a few moments...")
        install_pip_packages('mitosheet', test_pypi='--test-pypi' in sys.argv, user_install='--user' in sys.argv)
    except:
        # If the user hits an install error because of permission issues, we ask them if 
        # they want to try a user install
        error_traceback_last_line = get_recent_traceback().strip().split('\n')[-1].strip()
        if error_traceback_last_line == 'Consider using the `--user` option or check the permissions.':
            raise PermissionError('Not enough permissions to install Mito. Try rerunning this command with the --user flag.')
        
        # Otherwise, if it is some other error, we just bubble it up
        raise


def install_step_mitosheet_activate_notebook_extension():
    try:
        run_command([sys.executable, "-m", 'jupyter', 'nbextension', 'install', '--py', '--user', 'mitosheet'])
        run_command([sys.executable, "-m", 'jupyter', 'nbextension', 'enable', '--py', '--user', 'mitosheet'])
    except:
        print("Unable to activate extension for Classic Notebook. Mito will still work in JupyterLab")

    
MITOSHEET_INSTALLER_STEPS = [
    InstallerStep(
        'Check dependencies',
        install_step_mitosheet_check_dependencies
    ),
    InstallerStep(
        'Remove mitosheet3 if present',
        remove_mitosheet_3_if_present
    ),
    InstallerStep(
        'Install mitosheet',
        install_step_mitosheet_install_mitosheet,
    ),
    InstallerStep(
        'Activate extension',
        install_step_mitosheet_activate_notebook_extension
    ),
]
