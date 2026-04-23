# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Tests for blacklisted word patterns (parity with mito-ai blacklistedWords.tsx)."""

from mito_ai_python_tool_executor.blacklisted_words import check_for_blacklisted_words


def test_safe_snippets() -> None:
    assert check_for_blacklisted_words("import pandas as pd\ndf.head()").safe is True
    assert check_for_blacklisted_words("os.path.join('a', 'b')").safe is True


def test_blocks_rm_rf() -> None:
    r = check_for_blacklisted_words("!rm -rf /tmp/x")
    assert r.safe is False
    assert r.reason is not None
    assert "rm -rf" in r.reason


def test_blocks_shutil_rmtree() -> None:
    r = check_for_blacklisted_words("import shutil\nshutil.rmtree('foo')")
    assert r.safe is False
    assert "shutil.rmtree" in (r.reason or "")


def test_blocks_sql_delete() -> None:
    r = check_for_blacklisted_words("DELETE FROM users WHERE 1=1")
    assert r.safe is False


def test_blocks_eval() -> None:
    r = check_for_blacklisted_words("eval('1+1')")
    assert r.safe is False
