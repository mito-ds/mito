import json
from mitoinstaller.user_install import USER_JSON_PATH
import sys
import pytest
import subprocess
from typing import List
from mitoinstaller.commands import uninstall_pip_packages
import os

@pytest.fixture
def clear_user_json():
    """
    This fixture reads in the original user.json file that exists before these tests are
    run, deletes it, and then recreates it at the end. This allows us to test what happens 
    when the user.json file is in various states of out of date and disrepair.

    It also turns off the sending of logging to make sure we don't generate a huge number
    of new accounts on the frontend.
    """
    saved = False
    if os.path.exists(USER_JSON_PATH):
        saved = True
        with open(USER_JSON_PATH, 'r') as f:
            user_json = json.loads(f.read())

        os.remove(USER_JSON_PATH)

    # Turn off logging
    from mitoinstaller.log_utils import analytics
    analytics.send = False

    yield # All tests in this user module run right here

    if saved:
        with open(USER_JSON_PATH, 'w+') as f:
            f.write(json.dumps(user_json))

@pytest.fixture
def venv(tmpdir):
    """
    A fixture that you can use to test
    various parts of the mitoinstaller package
    in an isolated enviornment.
    """
    # Before running tests, we uninstall all packages from the main virtual enviornment
    # that could mess with the running of the tests
    print("Removing packages from venv")
    try:
        uninstall_pip_packages('jupyterlab')
    except:
        pass
    try:
        uninstall_pip_packages('mitosheet2')
    except:
        pass
    try:
        uninstall_pip_packages('mitosheet')
    except:
        pass
    try:
        uninstall_pip_packages('mitosheet3')
    except:
        pass

    venv = VirtualEnvironment(tmpdir.strpath)
    yield venv

WINDOWS = os.name == 'nt'

class VirtualEnvironment(object):
    def __init__(self, path):
        self.path = path
        subprocess.check_call([sys.executable, '-m', 'venv', self.path])
        
        self.bin = os.path.join(
            self.path,
            'bin' if not WINDOWS else 'Scripts',
        )
        if not WINDOWS:
            self.python = os.path.join(
                self.path,
                'bin',
                'python3'
            )
        else:
            self.python = os.path.join(
                self.path,
                'Scripts',
                'python.exe'
            )

    def run_python_module_command(self, command: List[str]):
        completed_process = subprocess.run(
            [self.python, '-m'] + command, 
            # NOTE: we do not use the capture_output variable, as this doesn't work before
            # python 3.7, and we want users to be able to install before that
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            # NOTE: we use universal_newlines to get the result back as text, 
            # but we don't use text=True, because we want to work before 3.7 when
            # text was introduced. See here: https://stackoverflow.com/questions/41171791/how-to-suppress-or-capture-the-output-of-subprocess-run
            universal_newlines=True
        )
        stdout = completed_process.stdout if isinstance(completed_process.stdout, str) else ''
        stderr = completed_process.stderr if isinstance(completed_process.stderr, str) else ''
        return stdout, stderr

    def run_python_script(self, script):
        output = subprocess.check_output([self.python, '-c', script]).decode('utf-8')
        return output

    def get_package_version(self, package):
        script = """
import pkg_resources
try:
    print(pkg_resources.get_distribution("{package}").version)
except:
    print('')
        """.format(package=package)
        version = self.run_python_script(script).strip()
        if version == '':
            return None
        return version

    def get_jupyterlab_extension_names(self):
        """
        Helper function that returns a list of installed extensions
        """
        from mitoinstaller.commands import get_extension_names_from_labextension_list_output
        stdout, stderr = self.run_python_module_command(['jupyter', 'labextension', 'list'])
        return get_extension_names_from_labextension_list_output(stdout, stderr)