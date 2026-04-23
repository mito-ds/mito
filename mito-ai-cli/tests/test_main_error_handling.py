# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import argparse
import asyncio

from mito_ai_cli import main as cli_main


class _DummyProviderManager:
    def set_selected_model(self, _model: str) -> None:
        return None


class _DummyToolExecutor:
    def shutdown(self) -> None:
        return None


class _DummyRunner:
    def __init__(self, **_kwargs: object) -> None:
        return None

    async def run(self, *_args: object, **_kwargs: object) -> None:
        return None


def test_async_main_returns_one_when_notebook_save_fails(
    monkeypatch, tmp_path, capsys
) -> None:
    monkeypatch.setattr(cli_main, "ProviderManager", _DummyProviderManager)
    monkeypatch.setattr(cli_main, "PythonToolExecutor", _DummyToolExecutor)
    monkeypatch.setattr(cli_main, "ProviderAdapter", lambda _llm: object())
    monkeypatch.setattr(cli_main, "AgentRunner", _DummyRunner)
    monkeypatch.setattr(cli_main, "cells_to_notebook", lambda _cells: object())

    def _raise_save_error(*_args: object, **_kwargs: object) -> None:
        raise OSError("permission denied")

    monkeypatch.setattr(cli_main, "save_notebook", _raise_save_error)

    args = argparse.Namespace(
        prompt="test prompt",
        output=str(tmp_path / "out.ipynb"),
        model=None,
    )
    return_code = asyncio.run(cli_main._async_main(args))

    captured = capsys.readouterr()
    combined = captured.out + captured.err
    assert return_code == 1
    assert "Failed to save notebook: permission denied" in combined
    assert "OUTPUTS" not in combined
    assert "Traceback (most recent call last)" not in combined
