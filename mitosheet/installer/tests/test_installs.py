import pytest
from tests.conftest import VirtualEnvironment
import os


def test_install_mitosheet3_no_dependencies(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['mitoinstaller', 'install'])
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')


@pytest.mark.parametrize("jupterlab_with_version", ['jupyterlab<1.0', 'jupyterlab<2.0', 'jupyterlab<3.0'])
def test_upgrade_jlab_no_dependencies(venv: VirtualEnvironment, jupterlab_with_version):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', '\"{jupterlab_with_version}\"'.format(jupterlab_with_version=jupterlab_with_version)])
    venv.run_python_module_command(['mitoinstaller', 'install'])
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')


@pytest.mark.parametrize("jupterlab_with_version", ['jupyterlab<1.0', 'jupyterlab<2.0', 'jupyterlab<3.0'])
def test_upgrade_jlab_with_mitosheet_dependency(venv: VirtualEnvironment, jupterlab_with_version):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', jupterlab_with_version])
    venv.run_python_module_command(['pip', 'install', 'mitosheet'])
    jlab_version = venv.get_package_version('jupyterlab')
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    assert jlab_version.startswith('2')
    assert mitosheet3_version is None
    assert mitosheet_version is not None

    stdout, stderr = venv.run_python_module_command(['mitoinstaller', 'install'])
    print(stdout, stderr)
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')


# Version map taken from https://www.npmjs.com/package/@jupyter-widgets/jupyterlab-manager
@pytest.mark.parametrize("jupterlab_version, dependency", [
    ('0.35.0', '@jupyter-widgets/jupyterlab-manager@0.38'), 
    ('1.2.0', '@jupyter-widgets/jupyterlab-manager@1.1'), 
])
def test_not_upgrade_jlab_with_other_dependency(venv: VirtualEnvironment, jupterlab_version, dependency):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab=={jupterlab_version}'.format(jupterlab_version=jupterlab_version)])
    assert venv.get_package_version('jupyterlab') == jupterlab_version

    venv.run_python_module_command(['jupyter', 'labextension', 'install', '{dependency}'.format(dependency=dependency)])
    venv.run_python_module_command(['mitoinstaller', 'install'])
    
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is None 
    assert mitosheet_version is None 
    assert jlab_version == jupterlab_version


def test_installs_mitosheet_jlab_2(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==2.2.5'])
    venv.run_python_module_command(['jupyter', 'labextension', 'install', '@jupyter-widgets/jupyterlab-manager@2'])
    
    stdout, stderr = venv.run_python_module_command(['mitoinstaller', 'install'])
    print(stdout, stderr)
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')

    assert mitosheet3_version is None 
    assert mitosheet_version is not None 
    assert 'mitosheet' in venv.get_jupyterlab_extension_names()


def test_installs_mitosheet3_jlab_3(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==3.0'])
    
    venv.run_python_module_command(['mitoinstaller', 'install'])
    
    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert 'mitosheet3' in venv.get_jupyterlab_extension_names()


def test_create_startup_file(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab==3.0'])
    
    venv.run_python_module_command(['mitoinstaller', 'install'])

    IMPORT_MITOSHEET_FILE_PATH = os.path.join(os.path.expanduser("~"), '.ipython', 'profile_default', 'startup', 'import_mitosheet.py')
    
    assert os.path.exists(IMPORT_MITOSHEET_FILE_PATH) 
