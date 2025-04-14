# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings

    warnings.warn("Importing 'mito_sql_cell' outside a proper installation.")
    __version__ = "dev"
from .handlers import setup_handlers
from .logger import get_logger
from .magic import SqlMagic


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "mito-sql-cell"}]


def _jupyter_server_extension_points():
    return [{"module": "mito_sql_cell"}]


def load_ipython_extension(ipython):
    """
    Any module file that define a function named `load_ipython_extension`
    can be loaded via `%load_ext module.path` or be configured to be
    autoloaded by IPython at startup time.
    """

    ipython.register_magics(SqlMagic(ipython))
    get_logger().info("Registered Mito SQL magic")


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    name = "mito_sql_cell"
    server_app.log.info(f"Registered {name} server extension")
