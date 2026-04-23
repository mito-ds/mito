# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Tests for MCP roots capability and retrieval helpers."""

from __future__ import annotations

import os
from types import SimpleNamespace
from typing import Any

import pytest

from mito_ai_mcp.utils.client_capabilities import detect_roots_capability
from mito_ai_mcp.utils.roots import file_uri_to_path, list_client_roots


class _FakeRootsSession:
    def __init__(self, response: Any) -> None:
        self._response = response
        self.calls = 0

    async def list_roots(self) -> Any:
        self.calls += 1
        return self._response


class _RaisingRootsSession:
    def __init__(self, exc: Exception) -> None:
        self._exc = exc
        self.calls = 0

    async def list_roots(self) -> Any:
        self.calls += 1
        raise self._exc


class _MethodNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Method not found: roots/list")
        self.code = -32601


class _SessionWithoutListRoots:
    pass


class _FakeUri:
    def __init__(self, value: str) -> None:
        self._value = value

    def __str__(self) -> str:
        return self._value


class _FakeRoot:
    def __init__(self, uri: object, name: str | None = None) -> None:
        self.uri = uri
        self.name = name


class _FakeContext:
    def __init__(self, *, capabilities: Any, session: Any = None) -> None:
        self.request_context = SimpleNamespace(
            client_capabilities=capabilities,
            session=session,
        )


def test_detect_roots_capability_from_dict_capabilities() -> None:
    ctx = _FakeContext(capabilities={"roots": {}})
    assert detect_roots_capability(ctx) is True


def test_detect_roots_capability_from_sdk_experimental_shape() -> None:
    ctx = SimpleNamespace(
        request_context=SimpleNamespace(
            experimental=SimpleNamespace(
                _client_capabilities=SimpleNamespace(roots=SimpleNamespace())
            )
        )
    )
    assert detect_roots_capability(ctx) is True


def test_detect_roots_capability_falls_back_when_missing() -> None:
    ctx = _FakeContext(capabilities={})
    assert detect_roots_capability(ctx) is False


def test_file_uri_to_path_decodes_spaces() -> None:
    assert file_uri_to_path("file:///tmp/my%20data.csv") == "/tmp/my data.csv"


def test_file_uri_to_path_rejects_non_file_scheme() -> None:
    assert file_uri_to_path("https://example.com/data.csv") is None


def test_file_uri_to_path_rejects_non_local_authority() -> None:
    assert file_uri_to_path("file://remote-host/tmp/data.csv") is None


def test_file_uri_to_path_handles_windows_drive_letter_uris() -> None:
    path = file_uri_to_path("file:///C:/Users/test/data.csv")
    if os.name == "nt":
        assert path == "C:\\Users\\test\\data.csv"
    else:
        assert path == "/C:/Users/test/data.csv"


@pytest.mark.asyncio
async def test_list_client_roots_normalizes_paths_and_uses_cache() -> None:
    session = _FakeRootsSession(
        {"roots": [{"uri": "file:///tmp/data.csv", "name": "workspace"}]}
    )
    ctx = _FakeContext(capabilities={"roots": {}}, session=session)

    first = await list_client_roots(ctx)
    second = await list_client_roots(ctx)

    assert session.calls == 1
    assert first == second
    assert len(first) == 1
    assert first[0].uri == "file:///tmp/data.csv"
    assert first[0].name == "workspace"
    assert first[0].path == "/tmp/data.csv"


@pytest.mark.asyncio
async def test_list_client_roots_refreshes_when_requested() -> None:
    session = _FakeRootsSession({"roots": [{"uri": "file:///tmp/one.csv"}]})
    ctx = _FakeContext(capabilities={"roots": {}}, session=session)

    await list_client_roots(ctx)
    await list_client_roots(ctx, force_refresh=True)

    assert session.calls == 2


@pytest.mark.asyncio
async def test_list_client_roots_returns_empty_when_roots_not_supported() -> None:
    session = _FakeRootsSession({"roots": [{"uri": "file:///tmp/data.csv"}]})
    ctx = _FakeContext(capabilities={}, session=session)

    roots = await list_client_roots(ctx)

    assert roots == []
    assert session.calls == 0


@pytest.mark.asyncio
async def test_list_client_roots_returns_empty_when_session_missing() -> None:
    ctx = _FakeContext(capabilities={"roots": {}}, session=None)

    roots = await list_client_roots(ctx)

    assert roots == []


@pytest.mark.asyncio
async def test_list_client_roots_returns_empty_when_session_has_no_list_roots() -> None:
    ctx = _FakeContext(capabilities={"roots": {}}, session=_SessionWithoutListRoots())

    roots = await list_client_roots(ctx)

    assert roots == []


@pytest.mark.asyncio
async def test_list_client_roots_returns_empty_for_method_not_found() -> None:
    session = _RaisingRootsSession(_MethodNotFoundError())
    ctx = _FakeContext(capabilities={"roots": {}}, session=session)

    roots = await list_client_roots(ctx)

    assert roots == []
    assert session.calls == 1


@pytest.mark.asyncio
async def test_list_client_roots_supports_uri_objects() -> None:
    session = _FakeRootsSession(
        {"roots": [_FakeRoot(uri=_FakeUri("file:///tmp/transactions.csv"), name="workspace")]}
    )
    ctx = _FakeContext(capabilities={"roots": {}}, session=session)

    roots = await list_client_roots(ctx)

    assert len(roots) == 1
    assert roots[0].uri == "file:///tmp/transactions.csv"
    assert roots[0].path == "/tmp/transactions.csv"
