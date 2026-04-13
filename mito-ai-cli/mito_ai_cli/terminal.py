# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""TTY-aware ANSI styling for CLI stderr output."""

from __future__ import annotations

import sys

# SGR sequences (stderr only — we never color stdout for scripting)
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
MAGENTA = "\033[35m"
GREEN = "\033[32m"
RED = "\033[31m"


def stderr_color_enabled() -> bool:
    return sys.stderr.isatty()


def stylize(text: str, *codes: str) -> str:
    """Wrap *text* with SGR *codes* when stderr is a TTY; otherwise return *text*."""
    if not stderr_color_enabled():
        return text
    return "".join(codes) + text + RESET


def truncate_prompt_preview(text: str, max_len: int = 60) -> str:
    """Single-line preview of the user prompt for startup feedback."""
    single = " ".join(text.split())
    if len(single) <= max_len:
        return single
    return single[: max_len - 3] + "..."
