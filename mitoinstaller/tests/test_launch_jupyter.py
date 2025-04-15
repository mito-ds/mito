# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from tests.conftest import VirtualEnvironment

def test_defaults_to_lab(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    out = venv.run_python_script('from mitoinstaller.jupyter_utils import get_prefered_jupyter_env_variable, set_prefered_jupyter_env_variable; set_prefered_jupyter_env_variable(); print(get_prefered_jupyter_env_variable())')
    assert out.strip() == 'lab'

def test_does_not_launch_jupyter(venv: VirtualEnvironment):
    # Note that this test only ensures that adding the param '--no-jupyter-launch' does not 
    # completely break the installation, but it does not test that it prevents jupyter from launching
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])    
    venv.run_python_module_command(['mitoinstaller', 'install', '--no-jupyter-launch'])

    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet_version is not None 
    assert jlab_version is not None



