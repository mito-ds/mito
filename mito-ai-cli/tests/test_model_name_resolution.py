# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import pytest

from mito_ai_cli.model_name_utils import resolve_cli_model_name


@pytest.mark.parametrize(
    "user_model_name,expected_model_name",
    [
        ("gpt-4.1", "gpt-4.1"),
        ("GPT-4.1", "gpt-4.1"),
        ("gpt 5.5", "gpt-5.5"),
        ("haiku-4.5", "claude-haiku-4-5-20251001"),
        ("haiku 4.5", "claude-haiku-4-5-20251001"),
        ("gemini 3.1 pro", "gemini-3.1-pro-preview"),
    ],
)
def test_resolve_cli_model_name(user_model_name: str, expected_model_name: str) -> None:
    assert resolve_cli_model_name(user_model_name) == expected_model_name


def test_resolve_cli_model_name_raises_for_ambiguous_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "mito_ai_cli.model_name_utils.get_available_models",
        lambda: ["foo-haiku-4-5", "bar-haiku-4-5"],
    )

    with pytest.raises(ValueError, match="is ambiguous"):
        resolve_cli_model_name("haiku 4.5")


def test_resolve_cli_model_name_raises_for_unknown_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "mito_ai_cli.model_name_utils.get_available_models",
        lambda: ["gpt-4.1", "claude-haiku-4-5-20251001"],
    )

    with pytest.raises(ValueError, match="not in the allowed model list"):
        resolve_cli_model_name("not-a-model")
