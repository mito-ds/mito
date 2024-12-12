import logging

from traitlets.config import Application


_LOGGER = None  # type: logging.Logger | None


def get_logger() -> logging.Logger:
    global _LOGGER
    if _LOGGER is None:
        app = Application.instance()
        _LOGGER = logging.getLogger("{!s}.mito_ai".format(app.log.name))
        Application.clear_instance()

    return _LOGGER
