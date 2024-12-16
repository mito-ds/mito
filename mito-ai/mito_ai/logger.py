import logging

from traitlets.config import Application


_LOGGER = None  # type: logging.Logger | None


def get_logger() -> logging.Logger:
    """Create a logger for the Mito AI module.
    
    The logger will be attached as a child of the Jupyter server logger.
    This allows for easier filtering/flagging of log messages in the server logs.
    
    Example:

    The following snippet shows a log message produced by JupyterLab followed by
    two log messages produced by the Mito AI module.

        [D 2024-12-16 15:49:07.333 LabApp] 204 PUT /lab/api/workspaces/default?1734360547329 (ea7486428da24ff3921aebd4422611d9@::1) 1.85ms
        [D 2024-12-16 15:49:08.293 ServerApp.mito_ai] Message received: {...}
        [D 2024-12-16 15:49:08.293 ServerApp.mito_ai] Requesting completion from Mito server.

    You can filter the server logs to only show messages produced by the Mito AI module:

        jupyter lab --debug 2>&1 | egrep mito_ai
    """
    global _LOGGER
    if _LOGGER is None:
        app = Application.instance()
        _LOGGER = logging.getLogger("{!s}.mito_ai".format(app.log.name))
        Application.clear_instance()

    return _LOGGER
