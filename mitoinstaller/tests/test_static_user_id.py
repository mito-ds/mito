import pytest
import json
import os

from tests.conftest import VirtualEnvironment, clear_user_json

from mitoinstaller.user_install import get_static_user_id, try_create_user_json_file
from mitoinstaller.user_install import USER_JSON_PATH


def get_mitosheet_version_in_user_json():
    try:
        return json.loads(open(USER_JSON_PATH, 'r').read())['mitosheet_current_version']
    except:
        return None


def test_import_mitosheet_keeps_same_user_id(venv: VirtualEnvironment, clear_user_json):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])    
    # First, check there is no user.json
    static_user_id_installer = get_static_user_id()
    assert static_user_id_installer is None
    venv.run_python_module_command(['mitoinstaller', 'install'])

    # We get the user id created by the installer
    static_user_id_installer = get_static_user_id()
    assert static_user_id_installer is not None
    mitosheet_version = get_mitosheet_version_in_user_json()
    assert mitosheet_version is None
    
    # Then, we import Mito
    venv.run_python_script('import mitosheet')
    
    # And check that the static id has not changed, but the rest
    # of the user.json file has 
    static_user_id_new = get_static_user_id()
    assert static_user_id_installer == static_user_id_new
    mitosheet_version = get_mitosheet_version_in_user_json()
    assert mitosheet_version is not None

def test_installer_does_not_overwrite_static_user_id(venv: VirtualEnvironment, clear_user_json):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])    
    # First, check there is no user.json
    static_user_id_installer = get_static_user_id()
    assert static_user_id_installer is None

    # Then, create an id
    try_create_user_json_file()
    static_user_id_before_installer = get_static_user_id()

    # Then, run the installer
    venv.run_python_module_command(['mitoinstaller', 'install'])

    # We get the user id created by the installer
    static_user_id_installer = get_static_user_id()
    assert static_user_id_installer is not None
    mitosheet_version = get_mitosheet_version_in_user_json()
    assert mitosheet_version is None
    
    # Then, we import Mito
    venv.run_python_script('import mitosheet')
    
    # And check that the static id has not changed, but the rest
    # of the user.json file has 
    static_user_id_new = get_static_user_id()
    assert static_user_id_before_installer == static_user_id_installer
    assert static_user_id_installer == static_user_id_new
    mitosheet_version = get_mitosheet_version_in_user_json()
    assert mitosheet_version is not None


def test_running_installer_twice_does_not_overwrite_static_user_id(venv: VirtualEnvironment, clear_user_json):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])    
    # First, check there is no user.json
    static_user_id_installer = get_static_user_id()
    assert static_user_id_installer is None

    # Then, run the installer
    venv.run_python_module_command(['mitoinstaller', 'install'])
    static_user_id_one = get_static_user_id()

    venv.run_python_module_command(['mitoinstaller', 'install'])
    static_user_id_two = get_static_user_id()

    assert static_user_id_one == static_user_id_two