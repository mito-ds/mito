# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Tests for mito_ai_core.agent.utils parse/coercion helpers."""

from __future__ import annotations

import json

import pytest

from mito_ai_core.agent.utils import parse_agent_response


def _minimal_cell_update_dict() -> dict:
    return {
        "type": "new",
        "after_cell_id": None,
        "id": None,
        "code": "print(1)",
        "code_summary": "print",
        "cell_type": "code",
    }


def _cell_update_completion(cell_update_value) -> str:
    payload = {
        "type": "cell_update",
        "message": "msg",
        "cell_update": cell_update_value,
    }
    return json.dumps(payload)


def test_parse_agent_response_cell_update_object_unchanged() -> None:
    inner = _minimal_cell_update_dict()
    r = parse_agent_response(_cell_update_completion(inner))
    assert r.type == "cell_update"
    assert r.cell_update is not None
    assert r.cell_update.code == "print(1)"


def test_parse_agent_response_cell_update_from_json_string() -> None:
    inner = _minimal_cell_update_dict()
    sloppy = json.dumps(inner) + "\n</invoke>"
    r = parse_agent_response(_cell_update_completion(sloppy))
    assert r.cell_update is not None
    assert r.cell_update.type == "new"
    assert r.cell_update.code == "print(1)"


def test_parse_agent_response_cell_update_whitespace_only_string_fails_to_none(
    caplog: pytest.LogCaptureFixture,
) -> None:
    import logging

    caplog.set_level(logging.WARNING)
    r = parse_agent_response(_cell_update_completion("   "))
    assert r.cell_update is None
    assert any("cell_update string" in rec.message for rec in caplog.records)


def test_parse_agent_response_cell_update_invalid_string_sets_none(
    caplog: pytest.LogCaptureFixture,
) -> None:
    import logging

    caplog.set_level(logging.WARNING)
    r = parse_agent_response(_cell_update_completion("not valid json {{{"))
    assert r.cell_update is None
    assert any("Could not parse cell_update" in rec.message for rec in caplog.records)


def test_parse_agent_response_cell_update_non_dict_json_string_sets_none(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """A JSON string that parses to a non-object (e.g. array) cannot be CellUpdate."""
    import logging

    caplog.set_level(logging.WARNING)
    r = parse_agent_response(_cell_update_completion("[1, 2]"))
    assert r.cell_update is None


def test_parse_agent_response_cell_update_dict_omits_optional_ids() -> None:
    """Models often omit id/after_cell_id keys; they must still parse."""
    inner = {
        "type": "new",
        "code": "x = 1",
        "code_summary": "assign",
        "cell_type": "code",
    }
    r = parse_agent_response(_cell_update_completion(inner))
    assert r.cell_update is not None
    assert r.cell_update.id is None
    assert r.cell_update.after_cell_id is None
    assert r.cell_update.code == "x = 1"


def test_parse_agent_response_cell_update_missing_code_summary_uses_default() -> None:
    """Missing nested code_summary should be filled by the CellUpdate schema default."""
    inner = {
        "type": "new",
        "code": "x = 1",
        "cell_type": "code",
    }
    r = parse_agent_response(_cell_update_completion(inner))
    assert r.cell_update is not None
    assert r.cell_update.code_summary == "Updating cell"
