import json

from mitoinstaller.user_install import (USER_JSON_PATH, get_static_user_id,
                                        user_json_is_installer_default)

from tests.conftest import VirtualEnvironment


def test_upgrade_with_mitosheet3_moves_to_mitosheet(venv: VirtualEnvironment):
    # Setup what most of our old users used to have
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'mitosheet3'])
    assert venv.get_package_version('mitosheet3') is not None

    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])

    assert venv.get_package_version('mitosheet3') is None 
    assert venv.get_package_version('mitosheet') is not None 
    assert venv.get_package_version('jupyterlab').startswith('3')


def test_upgrade_mitosheet_installed_correctly_upgrades_stays_3(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['mitoinstaller', 'install', '--test-pypi'])
    static_user_id_one = get_static_user_id()

    venv.run_python_module_command(['mitoinstaller', 'upgrade', '--test-pypi'])
    static_user_id_two = get_static_user_id()

    assert static_user_id_one == static_user_id_two
    
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet_version is not None 
    assert jlab_version.startswith('3')


def test_user_json_only_has_static_user_id():
    with open(USER_JSON_PATH, 'w+') as f:
        f.write(json.dumps({
            'static_user_id': 'github_action'
        }))
    
    assert user_json_is_installer_default()

    with open(USER_JSON_PATH, 'w+') as f:
        f.write(json.dumps({
            'static_user_id': 'github_action',
            'other': 'nah',
            'other1': 'nah',
            'other2': 'nah',
            'other3': 'nah',
            'other4': 'nah',
            'other5': 'nah',
        }))

    assert not user_json_is_installer_default()
