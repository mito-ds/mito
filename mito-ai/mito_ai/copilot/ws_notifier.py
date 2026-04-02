# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Thread-safe broadcast of GitHub Copilot login status to open completion WebSocket handlers."""

from __future__ import annotations

import logging
from dataclasses import asdict
from typing import Any, Dict, List

from tornado.ioloop import IOLoop

from mito_ai.completions.models import GithubCopilotLoginStatusMessage

log = logging.getLogger(__name__)

_handlers: List[Any] = []


def register_completion_handler(handler: Any) -> None:
    if handler not in _handlers:
        _handlers.append(handler)


def unregister_completion_handler(handler: Any) -> None:
    while handler in _handlers:
        _handlers.remove(handler)


def notify_github_copilot_login_status(data: Dict[str, Any]) -> None:
    """Called from auth threads; schedules WS writes on the IOLoop."""
    try:
        loop = IOLoop.current()
    except RuntimeError:
        log.debug("No current IOLoop; skipping Copilot login status push")
        return

    msg = GithubCopilotLoginStatusMessage(
        status=str(data.get("status", "")),
        verification_uri=data.get("verification_uri"),
        user_code=data.get("user_code"),
    )
    payload = asdict(msg)

    def _write_all() -> None:
        for h in list(_handlers):
            try:
                h.write_message(payload)
            except Exception:
                log.warning("Failed to push Copilot login status", exc_info=True)

    loop.add_callback(_write_all)
