import pytest
from tests.conftest import VirtualEnvironment

def test_allows_upgrade_to_jlab3_when_mitosheet_installed(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'mitosheet'])
    venv.run_python_script('import mitosheet')
    venv.run_python_module_command(['jupyter', 'labextension', 'install', '@jupyter-widgets/jupyterlab-manager@2'])

    stdout, stderr = venv.run_python_module_command(['mitoinstaller', 'upgrade_to_jupyterlab_3'])
    print(stdout, stderr)

    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')


def test_upgrade_to_jlab3_fails_when_other_extension(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'mitosheet'])
    venv.run_python_module_command(['jupyter', 'labextension', 'install', '@jupyter-widgets/jupyterlab-manager@2'])
    venv.run_python_module_command(['jupyter', 'labextension', 'install', 'jupyterlab-drawio'])

    venv.run_python_module_command(['mitoinstaller', 'upgrade_to_jupyterlab_3'])

    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is None 
    assert mitosheet_version is not None 
    assert jlab_version.startswith('2')

def test_upgrade_to_jlab3_fails_when_no_mitosheet_extension(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['pip', 'install', 'jupyterlab<3.0'])

    venv.run_python_module_command(['mitoinstaller', 'upgrade_to_jupyterlab_3'])

    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('2')


def test_upgrade_to_jlab3_fails_when_already_on_jlab3(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    venv.run_python_module_command(['mitoinstaller', 'install'])

    mitosheet3_version = venv.get_package_version('mitosheet3')
    mitosheet_version = venv.get_package_version('mitosheet')
    jlab_version = venv.get_package_version('jupyterlab')

    assert mitosheet3_version is not None 
    assert mitosheet_version is None 
    assert jlab_version.startswith('3')