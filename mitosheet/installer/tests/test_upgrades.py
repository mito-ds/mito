import json
import pytest
from tests.conftest import VirtualEnvironment
from mitoinstaller.user_install import USER_JSON_PATH, get_static_user_id

def test_upgrade_mitosheet3_installed_correctly_upgrades_stays_3(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['mitoinstaller', 'install'])
    static_user_id_one = get_static_user_id()

    venv.run_python_module_command(['mitoinstaller', 'upgrade'])
    static_user_id_two = get_static_user_id()

    assert static_user_id_one == static_user_id_two
    
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')

def test_upgrade_mitosheet_installed_correctly_upgrades_stays_2(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab<3.0'])
    venv.run_python_module_command(['pip', 'install', 'mitosheet'])
    venv.run_python_module_command(['jupyter', 'labextension', 'install', '@jupyter-widgets/jupyterlab-manager@2'])
    static_user_id_one = get_static_user_id()

    venv.run_python_module_command(['mitoinstaller', 'upgrade'])
    static_user_id_two = get_static_user_id()

    assert static_user_id_one == static_user_id_two

    jlab_version = venv.get_package_version('jupyterlab')
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    assert jlab_version.startswith('2')
    assert mitosheet3_version is None
    assert mitosheet_version is not None

def test_user_json_only_has_static_user_id():
    with open(USER_JSON_PATH, 'w+') as f:
        f.write(json.dumps({
            'static_user_id': 'github_action'
        }))
    from mitoinstaller.user_install import user_json_only_has_static_user_id
    
    assert user_json_only_has_static_user_id()

    with open(USER_JSON_PATH, 'w+') as f:
        f.write(json.dumps({
            'static_user_id': 'github_action',
            'other': 'nah'
        }))

    assert not user_json_only_has_static_user_id()

    
