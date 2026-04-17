import logging
from typing import Optional

from traitlets.config import Application


_LOGGER: Optional[logging.Logger] = None


def get_logger() -> logging.Logger:
    """Return a cached logger namespaced under the Jupyter server logger."""
    global _LOGGER
    if _LOGGER is None:
        app = Application.instance()
        _LOGGER = logging.getLogger("{!s}.mito_ai_core".format(app.log.name))
        Application.clear_instance()

    return _LOGGER
