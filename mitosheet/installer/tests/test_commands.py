import pytest
from tests.conftest import WINDOWS

from mitoinstaller.commands import run_command


def test_command_suceedes():
    if WINDOWS:
        run_command(['dir'])
    else:
        run_command(['ls'])

def test_command_fails():
    with pytest.raises(Exception) as e:
        run_command(['cd', './fake-folder'])
    assert 'file' in str(e)