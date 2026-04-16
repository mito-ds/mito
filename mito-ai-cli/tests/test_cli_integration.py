# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Live end-to-end CLI test (no mocks): full agent loop, provider, and kernel.

Enable with::

    export MITO_AI_CLI_E2E=1
    pytest tests/test_cli_integration.py -v

Requires network and a working AI configuration (e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY,
GEMINI_API_KEY, or Mito server / enterprise setup as supported by mito-ai-core).
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import nbformat
import pytest

_E2E_ENV = "MITO_AI_CLI_E2E"
_E2E_SKIP_REASON = (
    f"Set {_E2E_ENV}=1 to run the live CLI integration test "
    "(network + LLM; uses your configured provider)."
)


@pytest.mark.integration
@pytest.mark.skipif(os.environ.get(_E2E_ENV) != "1", reason=_E2E_SKIP_REASON)
def test_cli_live_run_prints_result_and_outputs_and_writes_notebook(tmp_path: Path) -> None:
    """Run ``python -m mito_ai_cli run …`` like a user; assert RESULT, OUTPUTS, and a valid .ipynb."""
    out_ipynb = tmp_path / "mito-cli-e2e.ipynb"
    # Small, bounded task so the agent can finish with ``finished_task`` in reasonable time.
    prompt = (
        "Add exactly one new markdown cell at the start of the notebook whose only text is the word E2E. "
        "Then finish the task with a one-line summary."
    )
    r = subprocess.run(
        [
            sys.executable,
            "-m",
            "mito_ai_cli",
            "run",
            prompt,
            "-o",
            str(out_ipynb),
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        timeout=600,
        env=os.environ.copy(),
    )
    combined = r.stdout + r.stderr
    assert r.returncode == 0, combined
    assert out_ipynb.is_file(), combined

    nb = nbformat.read(out_ipynb, as_version=4)
    assert nb.nbformat == 4
    assert len(nb.cells) >= 1

    assert "OUTPUTS" in combined
    assert os.path.abspath(str(out_ipynb)) in combined
    assert "RESULT" in combined
