from IPython.core.interactiveshell import InteractiveShell
from traitlets.config import Config

import pytest

from mito_sql_cell.magic import SqlMagic
from pathlib import Path

HERE = Path(__file__).parent


class TestingShell(InteractiveShell):
    """
    A custom InteractiveShell that raises exceptions instead of silently suppressing
    them.
    """

    def run_cell(self, *args, **kwargs):
        result = super().run_cell(*args, **kwargs)
        result.raise_error()
        return result

    @classmethod
    def preconfigured_shell(cls):
        c = Config()

        # By default, InteractiveShell will record command's history in a SQLite
        # database which leads to "too many open files" error when running tests;
        # this setting disables the history recording.
        # https://ipython.readthedocs.io/en/stable/config/options/terminal.html#configtrait-HistoryAccessor.enabled
        c.HistoryAccessor.enabled = False
        shell = cls(config=c)

        # there is some weird bug in ipython that causes this function to hang the
        # pytest process when all tests have been executed (an internal call to
        # gc.collect() hangs). This is a workaround.
        shell.displayhook.flush = lambda: None

        return shell


@pytest.fixture
def config_file(monkeypatch, tmp_path):
    # Redirect the default configuration file to a temporary file
    config_file = tmp_path / "connections.ini"
    monkeypatch.setattr(
        "mito_sql_cell.connections.DEFAULT_CONFIGURATION_FILE",
        str(config_file),
    )

    config_file.write_text(f"""[db]
database = {HERE}/gh.sqlite
driver = sqlite
""")


@pytest.fixture
def ipython_shell(config_file):
    shell = TestingShell.preconfigured_shell()

    sql_magic = SqlMagic(shell)

    shell.register_magics(sql_magic)

    return shell
