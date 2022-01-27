


from mitoinstaller.commands import (get_jupyterlab_metadata,
                                    install_pip_packages,
                                    uninstall_pip_packages)
from mitoinstaller.log_utils import log, log_error


def do_upgrade_to_jupyterlab_3():
    """
    Checks that a user has mitosheet installed on JLab 2.0, and
    if so attempts to upgrade them to JLab 3.0 and mitosheet3.

    This is useful for migrating users from JLab 3.0 to JLab 2.0. 

    It does so by:
    1.  Checking we are in the correct state (e.g. 2.0, with mitosheet
        installed.)
    2.  Uninstalling the dependencies of mitosheet and the widget manager
        to not mess with the next step
    3.  Installing mitosheet as normal.

    NOTE: We expect the user to have a user.json if they are going to 
    run this command, as we expect they have used the tool.
    """
    print("Upgrading to JupyterLab 3.0... this may take a moment")
    # First, check that JLab 2.0 is installed, and mitosheet is an extension
    jupyterlab_version, labextensions = get_jupyterlab_metadata()
    if jupyterlab_version is None or not jupyterlab_version.startswith('2'):
        log_error('upgrade_to_jupyterlab_3_failed', {
            'reason': 'Installed jupyterlab version is: {jupyterlab_version}'.format(jupyterlab_version=jupyterlab_version)
        })
        exit(1)
    if (labextensions is not None and len(labextensions) > 2) or ('mitosheet' not in labextensions):
        log_error('upgrade_to_jupyterlab_3_failed', {
            'reason': 'Installed labextensions are: {labextensions}'.format(labextensions=labextensions)
        })
        exit(1)
    
    # First, uninstall mitosheet, jlab
    try:
        uninstall_pip_packages('mitosheet', 'jupyterlab')
    except:
        log_error('upgrade_to_jupyterlab_3_failed', {
            'reason': 'Failed to uninstall mitosheet, jupyterlab'
        })
    # Then install JLab 3.0
    try:
        install_pip_packages('mitosheet3')
    except:
        log_error('upgrade_to_jupyterlab_3_failed', {
            'reason': 'Failed to install mitosheet3'
        })    

    # Log that we finished the upgrade
    log('upgrade_to_jupyterlab_3')