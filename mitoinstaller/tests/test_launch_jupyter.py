
from mitoinstaller.jupyter_utils import get_prefered_jupyter_env_variable
from tests.conftest import VirtualEnvironment

def test_detects_notebook_as_prefered(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', 'notebook'])
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    out = venv.run_python_script('from mitoinstaller.jupyter_utils import get_prefered_jupyter_env_variable, set_prefered_jupyter_env_variable; set_prefered_jupyter_env_variable(); print(get_prefered_jupyter_env_variable())')
    assert out.strip() == 'notebook'

def test_defaults_to_lab(venv: VirtualEnvironment):
    venv.run_python_module_command(['pip', 'install', '-r', 'requirements.txt'])
    out = venv.run_python_script('from mitoinstaller.jupyter_utils import get_prefered_jupyter_env_variable, set_prefered_jupyter_env_variable; set_prefered_jupyter_env_variable(); print(get_prefered_jupyter_env_variable())')
    assert out.strip() == 'lab'