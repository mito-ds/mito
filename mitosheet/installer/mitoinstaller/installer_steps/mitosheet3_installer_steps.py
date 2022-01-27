from mitoinstaller.commands import (get_jupyterlab_metadata,
                                    install_pip_packages,
                                    uninstall_pip_packages)
from mitoinstaller.installer_steps.installer_step import InstallerStep
from mitoinstaller.log_utils import log


def install_step_mitosheet3_check_dependencies():
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
    
    if len(extension_names) == 0:
        return
    elif len(extension_names) == 1 and extension_names[0] == 'mitosheet':
        uninstall_pip_packages('mitosheet')
        log('uninstalled_mitosheet_labextension',
            {
                'jupyterlab_version': jupyterlab_version,
                'extension_names': extension_names
            }
        )
        return
    
    else:
        raise Exception('Installed extensions {extension_names}'.format(extension_names=extension_names))


def install_step_mitosheet3_install_mitosheet3():
    install_pip_packages('mitosheet3')


MITOSHEET3_INSTALLER_STEPS = [
    InstallerStep(
        'Checking dependencies',
        install_step_mitosheet3_check_dependencies
    ),
    InstallerStep(
        'Installing mitosheet3',
        install_step_mitosheet3_install_mitosheet3
    ),
]
