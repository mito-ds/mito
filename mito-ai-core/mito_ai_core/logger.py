# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import logging


_LOGGER = None  # type: logging.Logger | None


def get_logger() -> logging.Logger:
    """Create a logger for the Mito AI Core module.

    Returns a standard Python logger named ``mito_ai_core``.  When the
    library is used inside Jupyter the caller can attach a handler to
    ``mito_ai_core`` to integrate with the server log.
    """
    global _LOGGER
    if _LOGGER is None:
        _LOGGER = logging.getLogger("mito_ai_core")

