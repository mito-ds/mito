"""
Contains useful commands for interacting
with the command line directly
"""

import os
import sys
from subprocess import CompletedProcess
from typing import List, Tuple, Union

from termcolor import colored

# NOTE: Do not import subprocess here, we only want one
# function to have it
from mitoinstaller.user_install import is_running_test


def get_output(completed_process: CompletedProcess):
    output = ""
    if completed_process.stdout is not None:
        output += completed_process.stdout
    if completed_process.stderr is not None:
        output += completed_process.stderr

    return output


def run_command(command_array: List[str], fail_on_nonzero_exit_code=True):
    """
    An internal command that should be used to run all commands
    that run on the command line, so that output from failing
    commands can be captured.

    Can toggle if this raises an error with fail_on_nonzero_exit_code
    """
    import subprocess
    completed_process = subprocess.run(
        command_array, 
        # NOTE: we do not use the capture_output variable, as this doesn't work before
        # python 3.7, and we want users to be able to install before that
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT,
        # NOTE: we use universal_newlines to get the result back as text, 
        # but we don't use text=True, because we want to work before 3.7 when
        # text was introduced. See here: https://stackoverflow.com/questions/41171791/how-to-suppress-or-capture-the-output-of-subprocess-run
        universal_newlines=True
    )
    if fail_on_nonzero_exit_code and completed_process.returncode != 0:
        raise Exception(get_output(completed_process))

    # We default the stdout and stderr to empty strings if they are not strings, 
    # to make code that handles them have an easier time (they might be None)
    stdout = completed_process.stdout if isinstance(completed_process.stdout, str) else ''
    stderr = completed_process.stderr if isinstance(completed_process.stderr, str) else ''
    return stdout, stderr

def jupyter_labextension_list():
    """
    Returns the stdout, stderr pair for the currently
    installed jupyterlab extensions.

    This may error if the user does not have JLab installed.
    """

    sys_call = [sys.executable, "-m", "jupyter", "labextension", "list"]
    return run_command(sys_call)


def uninstall_labextension(extension: str):
    """
    Uninstall a labextension
    """

    sys_call = [sys.executable, "-m", "jupyter", "labextension", "uninstall", extension]
    run_command(sys_call)


def uninstall_pip_packages(*packages: List[str]):
    """
    This function uninstalls the given packages in a single pass
    using pip, through the command line.
    """

    sys_call = [sys.executable, "-m", "pip", "uninstall", "-y"]

    for package in packages:
        sys_call.append(package)
    
    run_command(sys_call)


def install_pip_packages(*packages: List[str]):
    """
    This function installs the given packages in a single pass
    using pip, through the command line.

    https://stackoverflow.com/questions/12332975/installing-python-module-within-code
    """

    sys_call = [sys.executable, "-m", "pip", "install"]

    for package in packages:
        sys_call.append(package)
    sys_call.append('--upgrade')

    run_command(sys_call)

def upgrade_mito_installer():
    """
    Upgrades the mito installer package itself
    """
    run_command([sys.executable, "-m", "pip", "install", 'mitoinstaller', '--upgrade', '--no-cache-dir'])


def check_running_jlab_3_processes(fail_on_nonzero_exit_code=False):
    """
    Returns true if there are running JLab 3 processes, 
    returns false if there are not.

    Useful for telling the user to refresh their servers
    if they install Mito
    """
    sys_call = [sys.executable, "-m", "jupyter", "server", "list"]
    stdout, stderr = run_command(sys_call, fail_on_nonzero_exit_code=fail_on_nonzero_exit_code)
    return len(stdout.strip().splitlines()) > 1

def check_running_jlab_not_3_processes(fail_on_nonzero_exit_code=False):
    """
    Returns true if there are running JLab processes, 
    returns false if there are not.

    Useful for telling the user to refresh their servers
    if they install Mito
    """
    sys_call = [sys.executable, "-m", "jupyter", "notebook", "list"]
    stdout, _ = run_command(sys_call, fail_on_nonzero_exit_code=fail_on_nonzero_exit_code)
    return len(stdout.strip().splitlines()) > 1


def check_running_jlab_processes(fail_on_nonzero_exit_code=False):
    """
    Returns true if there are running JLab processes from any version
    returns false if there are not.
    """
    return check_running_jlab_3_processes(fail_on_nonzero_exit_code=fail_on_nonzero_exit_code) \
        or check_running_jlab_not_3_processes(fail_on_nonzero_exit_code=fail_on_nonzero_exit_code)


def get_extension_names_from_labextension_list_output(stdout: str, stderr: str) -> List[str]:
    """
    Returns a list of the extension names installed from the stdout, stderr
    pair returned from the jupyter labextension list.

    If you run the command: `jupyter labextension list`, the output is: 
    ------
    JupyterLab v0.35.0
    Known labextensions:
    app dir: /Users/nate/saga-vcs/monorepo/mito/installer/venv/share/jupyter/lab
            @jupyter-widgets/jupyterlab-manager v0.38.1 enabled OK
    ------

    Note that part of this output prints to stdout, and other parts to stderr 
    (for some reason), so we append them with a newline so we make sure we 
    get all of the extensions correctly!
    """
    def is_extension_line(line):
        # Check that it has a version
        if len(line) == 0:
            return False

        if 'v' not in line:
            return False
        
        # Check that it is either enabled or disabled
        return 'enabled' in line or 'disabled' in line

    output = stdout + "\n" + stderr
    extension_lines = [line.strip() for line in output.splitlines() if is_extension_line(line)]
    extension_names = []
    for line in extension_lines:
        extension_names.append(line.split(" ")[0])

    return extension_names

def get_jupyterlab_metadata() -> Tuple[Union[str, None], Union[List[str], None]]:
    """
    Helper function that returns a tuple of: jupyterlab_version, installed_extensions

    If no JupyterLab is installed, returns (None, None)
    """
    try:
        from jupyterlab import __version__
    except Exception as e:
        # If this import fails, it must not be installed
        return None, None

    try:
        stdout, stderr = jupyter_labextension_list()
        extension_names = get_extension_names_from_labextension_list_output(stdout, stderr)
    except Exception as e:
        extension_names = []
    
    return __version__, extension_names


def exit_after_error(install_or_upgrade, error=None):
    full_error = '\n\nSorry, looks like we hit a problem during {install_or_upgrade}. '.format(install_or_upgrade=install_or_upgrade) + \
        '\nWe\'re happy to help you fix it ASAP. Just hop on our discord, and and post in the install-help channel. We\'ll get you sorted in a few minutes:\n\n\t https://discord.gg/AAeYm6YV7B\n'

    print(colored(full_error, 'red'))
    exit(1)
