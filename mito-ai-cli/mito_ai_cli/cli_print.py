# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""CLI :func:`print` replacement that strips MITO inline markers (see MarkdownBlock.tsx)."""

from __future__ import annotations

import builtins
import re
from typing import Any

__all__ = ["cli_print", "strip_mito_citations"]

# Optional ASCII spaces + marker, per MarkdownBlock.tsx extractCitationsAndCellRefs.
# Removing leading spaces avoids gaps before punctuation after stripping.
_MITO_CITATION_RE = re.compile(r" *\[MITO_CITATION:[^:]+:\d+(?:-\d+)?\]")
_MITO_CELL_REF_RE = re.compile(r" *\[MITO_CELL_REF:[^\]]+\]")


def strip_mito_citations(text: str) -> str:
    """Remove ``[MITO_CITATION:…]`` and ``[MITO_CELL_REF:…]`` tokens (and spaces before them)."""
    if not text:
        return text
    text = _MITO_CITATION_RE.sub("", text)
    return _MITO_CELL_REF_RE.sub("", text)


def cli_print(*args: object, **kwargs: Any) -> None:
    """Like :func:`builtins.print`, but strips MITO citation/cell-ref markers from each str arg."""
    stripped = tuple(
        strip_mito_citations(a) if isinstance(a, str) else a for a in args
    )
    builtins.print(*stripped, **kwargs)
