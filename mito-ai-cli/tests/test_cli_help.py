# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Smoke tests: CLI help exits successfully (package must be importable)."""

from __future__ import annotations

import subprocess
import sys


def _run_cli(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "mito_ai_cli", *args],
        capture_output=True,
        text=True,
    )


def test_module_help_exits_zero() -> None:
    r = _run_cli(["--help"])
    assert r.returncode == 0
    out = (r.stdout + r.stderr).lower()
    assert "usage" in out
    assert "run" in out


def test_run_subcommand_help_exits_zero() -> None:
    r = _run_cli(["run", "--help"])
    assert r.returncode == 0
    out = r.stdout + r.stderr
    assert "--output" in out or "-o" in out
    assert "prompt" in out.lower()
