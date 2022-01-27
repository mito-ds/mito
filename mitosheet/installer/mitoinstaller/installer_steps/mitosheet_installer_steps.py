from mitoinstaller.commands import (get_jupyterlab_metadata,
                                    install_pip_packages)
from mitoinstaller.installer_steps.installer_step import InstallerStep


def install_step_mitosheet_check_dependencies():
    jupyterlab_version, extension_names = get_jupyterlab_metadata()

    # If no JupyterLab is installed, we can continue with install, as
    # there are no conflict dependencies
    if jupyterlab_version is None:
        return
    
    # If JupyterLab 2 is installed, then we are are also good to go
    if jupyterlab_version.startswith('2'):
        return
    
    raise Exception('Out of date JupyterLab version {jupyterlab_version}'.format(jupyterlab_version=jupyterlab_version))


def install_step_mitosheet_install_mitosheet():
    install_pip_packages('mitosheet')


def install_step_mitosheet_install_jupyter_widget_manager():
    from jupyterlab import commands
    commands.install_extension('@jupyter-widgets/jupyterlab-manager@2')


def install_step_mitosheet_rebuild_jupyterlab():
    from jupyterlab import commands
    commands.build()


MITOSHEET_INSTALLER_STEPS = [
    InstallerStep(
        'Checking dependencies',
        install_step_mitosheet_check_dependencies
    ),
    InstallerStep(
        'Installing mitosheet',
        install_step_mitosheet_install_mitosheet
    ),
    InstallerStep(
        'Installing @jupyter-widgets/jupyterlab-manager@2',
        install_step_mitosheet_install_jupyter_widget_manager
    ),
    InstallerStep(
        'Rebuilding JupyterLab',
        install_step_mitosheet_rebuild_jupyterlab
    ),
]
