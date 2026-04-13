# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Detect dangerous patterns in code before execution (parity with mito-ai blacklistedWords)."""

from __future__ import annotations

import re
from typing import List, NamedTuple, Optional, Pattern, Tuple

__all__ = ["BlacklistResult", "check_for_blacklisted_words"]


class BlacklistResult(NamedTuple):
    safe: bool
    reason: Optional[str] = None


# Keep in sync with mito-ai/src/utils/blacklistedWords.tsx
_BLACKLISTED_PATTERNS: List[Tuple[Pattern[str], str]] = [
    (
        re.compile(r"\brm\s+-rf\b"),
        "This code contains a command (rm -rf) that could recursively delete files and directories from your system",
    ),
    (
        re.compile(r"\bfs\.rmdir\b"),
        "This code contains a Node.js command (fs.rmdir) that could delete directories from your system",
    ),
    (
        re.compile(r"\bfs\.unlink\b"),
        "This code contains a Node.js command (fs.unlink) that could delete files from your system",
    ),
    (
        re.compile(r"\bshutil\.rmtree\b"),
        "This code contains a Python command (shutil.rmtree) that could recursively delete directories and their contents",
    ),
    (
        re.compile(r"\bos\.remove\b"),
        "This code contains a Python command (os.remove) that could delete files from your system",
    ),
    (
        re.compile(r"\bos\.rmdir\b"),
        "This code contains a Python command (os.rmdir) that could delete directories from your system",
    ),
    (
        re.compile(r"\bos\.unlink\b"),
        "This code contains a Python command (os.unlink) that could delete files from your system",
    ),
    (
        re.compile(r"\brmdir\b"),
        "This code contains a command (rmdir) that could delete directories from your system",
    ),
    (
        re.compile(r"\bunlink\b"),
        "This code contains a function (unlink) that could delete files from your system",
    ),
    (
        re.compile(r"\bdelete\s+from\b", re.IGNORECASE),
        "This code contains an SQL DELETE command that could remove data from your database",
    ),
    (
        re.compile(r"\bdrop\s+table\b", re.IGNORECASE),
        "This code contains an SQL DROP TABLE command that could delete entire tables from your database",
    ),
    (
        re.compile(r"\bdrop\s+database\b", re.IGNORECASE),
        "This code contains an SQL DROP DATABASE command that could delete your entire database",
    ),
    (
        re.compile(r"\bsystem\s*\("),
        "This code contains a system() call that could execute arbitrary system commands, which is a security risk",
    ),
    (
        re.compile(r"\beval\s*\("),
        "This code contains an eval() function that could execute arbitrary code, which is a security risk",
    ),
    (
        re.compile(r"\bexec\s*\("),
        "This code contains an exec() function that could execute arbitrary code, which is a security risk",
    ),
]


def check_for_blacklisted_words(code: str) -> BlacklistResult:
    """Return ``safe=False`` and a *reason* if *code* matches a blocked pattern."""
    for pattern, message in _BLACKLISTED_PATTERNS:
        if pattern.search(code):
            return BlacklistResult(safe=False, reason=message)
    return BlacklistResult(safe=True, reason=None)
