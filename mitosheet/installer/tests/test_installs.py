import pytest
from tests.conftest import VirtualEnvironment
import os

def test_install_mitosheet_no_dependencies(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet_version is not None 
    assert jlab_version.startswith('3')


def test_installs_mitosheet_jlab_3(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==3.0'])
    
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])
    
    mitosheet_version = venv.get_package_version('mitosheet')

    assert mitosheet_version is not None 
    assert 'mitosheet' in venv.get_jupyterlab_extension_names()


def test_installs_mitosheet_jlab_2_no_extensions(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==2.2.5'])
    
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet_version is not None 
    assert jlab_version.startswith('3')


def test_create_startup_file(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==3.0'])
    
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])

    IMPORT_MITOSHEET_FILE_PATH = os.path.join(os.path.expanduser("~"), '.ipython', 'profile_default', 'startup', 'import_mitosheet.py')
    
    assert os.path.exists(IMPORT_MITOSHEET_FILE_PATH) 

def test_installs_from_test_pypi(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])    
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])
    
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet_version is not None 
    assert jlab_version is not None
