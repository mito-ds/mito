# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""End-to-end MCP tool wiring tests (local, deterministic, no network)."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from typing import Callable

import pytest

from mito_ai_core.agent import AgentRunResult, ToolResult
from mito_ai_core.completions.models import AgentResponse
from mito_ai_mcp import request_agent_execution
from mito_ai_mcp import server as mcp_server
from mito_ai_mcp.server import run_data_analyst
from mito_ai_mcp.utils.client_capabilities import detect_ask_user_mode

class FakeMcpContext:
    """Minimal context stub that records progress notifications."""

    def __init__(self) -> None:
        self.events: list[tuple[int, str]] = []
        self.request_context = SimpleNamespace(client_capabilities={})

    async def report_progress(self, progress: int, total: int | None, message: str) -> None:
        del total  # Unused in tests.
        self.events.append((progress, message))

class FakeMcpContextWithElicitation(FakeMcpContext):
    def __init__(self) -> None:
        super().__init__()
        self.request_context = SimpleNamespace(client_capabilities={"elicitation": {}})


class FakeMcpContextWithFormElicitation(FakeMcpContext):
    def __init__(self) -> None:
        super().__init__()
        self.request_context = SimpleNamespace(
            client_capabilities={"elicitation": {"form": {}}}
        )


class FakeMcpContextWithOnlyExtensions(FakeMcpContext):
    def __init__(self) -> None:
        super().__init__()
        self.request_context = SimpleNamespace(
            client_capabilities={"extensions": {"elicitation": {}}}
        )


class FakeMcpContextWithSdkExperimentalCapabilities(FakeMcpContext):
    def __init__(self) -> None:
        super().__init__()
        self.request_context = SimpleNamespace(
            experimental=SimpleNamespace(_client_capabilities=SimpleNamespace(elicitation={}))
        )


class FakeMcpContextWithRoots(FakeMcpContext):
    def __init__(self, root_path: Path) -> None:
        super().__init__()
        self.request_context = SimpleNamespace(
            client_capabilities={"roots": {}},
            session=SimpleNamespace(list_roots=self._list_roots),
        )
        self._root_path = root_path

    async def _list_roots(self) -> dict[str, object]:
        return {"roots": [{"uri": self._root_path.as_uri(), "name": "workspace"}]}


class FakeProviderManager:
    async def request_completions(self, **kwargs: object) -> str:
        del kwargs
        return "{}"


class FakeToolExecutor:
    def __init__(self, **kwargs: object) -> None:
        del kwargs

    def shutdown(self) -> None:
        return None


class FakeAgentRunner:
    """Fake runner that emits callbacks and a finished response."""

    def __init__(self, **kwargs: object) -> None:
        del kwargs

    async def run(
        self,
        ctx: object,
        prompt: str,
        *,
        on_assistant_response: Callable[[AgentResponse], object] | None = None,
        on_tool_result: Callable[[ToolResult], object] | None = None,
        message_type: object = None,
    ) -> AgentRunResult:
        del ctx, prompt, message_type

        if on_assistant_response is not None:
            await on_assistant_response(
                AgentResponse(
                    type="scratchpad",
                    message="Planning next step",
                    cell_update=None,
                    get_cell_output_cell_id=None,
                    next_steps=None,
                    analysis_assumptions=None,
                    streamlit_app_prompt=None,
                    question=None,
                    answers=None,
                    scratchpad_code=None,
                    scratchpad_summary=None,
                    mcp_tool_call=None,
                )
            )

        if on_tool_result is not None:
            await on_tool_result(ToolResult(success=True, tool_name="scratchpad"))

        return AgentRunResult(
            final_response=AgentResponse(
                type="finished_task",
                message="Done",
                cell_update=None,
                get_cell_output_cell_id=None,
                next_steps=["Share the summary"],
                analysis_assumptions=None,
                streamlit_app_prompt=None,
                question=None,
                answers=None,
                scratchpad_code=None,
                scratchpad_summary=None,
                mcp_tool_call=None,
            ),
            finished=True,
            iterations=2,
        )


@pytest.mark.asyncio
async def test_run_data_analyst_wires_callbacks_progress_and_final_text(monkeypatch: pytest.MonkeyPatch) -> None:
    """Validate the MCP server tool path from invocation through final response formatting."""
    monkeypatch.setattr(request_agent_execution, "ProviderManager", FakeProviderManager)
    monkeypatch.setattr(request_agent_execution, "PythonToolExecutor", FakeToolExecutor)
    monkeypatch.setattr(request_agent_execution, "AgentRunner", FakeAgentRunner)
    monkeypatch.setattr(request_agent_execution, "initialize_user", lambda: None)
    monkeypatch.setattr(request_agent_execution, "save_notebook", lambda nb, path: None)
    monkeypatch.setattr(request_agent_execution, "cells_to_notebook", lambda cells: {"cells": cells})
    monkeypatch.setattr(
        mcp_server,
        "_resolve_notebook_output_path",
        lambda _roots: "/tmp/test-mcp-notebook.ipynb",
    )

    ctx = FakeMcpContext()
    result = await run_data_analyst("Summarize this notebook", mcp_context=ctx)

    assert result == {
        "final_text": (
            "Done\n\nSuggested next steps:\n- Share the summary\n\n"
            "Notebook saved to: /tmp/test-mcp-notebook.ipynb"
        ),
        "metadata": {
            "notebook_path": "/tmp/test-mcp-notebook.ipynb",
            "artifact_paths": ["/tmp/test-mcp-notebook.ipynb"],
        },
    }
    assert ctx.events == [
        (1, "Starting analysis run"),
        (2, "Assistant response (scratchpad): Planning next step"),
        (3, "Tool completed (scratchpad)"),
        (4, "Analysis run completed"),
    ]


@pytest.mark.asyncio
async def test_run_data_analyst_uses_first_writable_root_for_notebook_path(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    transactions_file = tmp_path / "transactions.csv"
    transactions_file.write_text("customer_id,amount\n123,10\n", encoding="utf-8")
    captured: dict[str, object] = {}

    async def fake_run_prompt(
        prompt: str,
        *,
        metadata: request_agent_execution.RequestAgentExecutionInput | None = None,
        on_assistant_response: Callable[[AgentResponse], object] | None = None,
        on_tool_result: Callable[[ToolResult], object] | None = None,
    ) -> request_agent_execution.RequestAgentExecutionResult:
        del prompt, on_assistant_response, on_tool_result
        assert metadata is not None
        captured["metadata"] = metadata
        return request_agent_execution.RequestAgentExecutionResult(
            final_text="Done",
            finished=True,
            iterations=1,
            thread_id="thread-1",
            final_response_type="finished_task",
            notebook_path=metadata.notebook_path,
            artifact_paths=[metadata.notebook_path],
        )

    monkeypatch.setattr(mcp_server.request_agent_execution_manager, "run_prompt", fake_run_prompt)
    ctx = FakeMcpContextWithRoots(tmp_path)

    response = await run_data_analyst("Use the notebook root", mcp_context=ctx)

    metadata = captured["metadata"]
    assert isinstance(metadata, request_agent_execution.RequestAgentExecutionInput)
    assert metadata.notebook_path.startswith(str(tmp_path))
    assert metadata.notebook_path.endswith(".ipynb")
    assert metadata.kernel_cwd == str(tmp_path)
    assert metadata.files is not None
    assert str(transactions_file) in metadata.files
    assert "transactions.csv" in metadata.files
    assert response["metadata"]["notebook_path"] == metadata.notebook_path
    assert metadata.notebook_path in response["final_text"]


@pytest.mark.asyncio
async def test_run_data_analyst_leaves_kernel_cwd_unset_without_writable_roots(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    async def fake_run_prompt(
        prompt: str,
        *,
        metadata: request_agent_execution.RequestAgentExecutionInput | None = None,
        on_assistant_response: Callable[[AgentResponse], object] | None = None,
        on_tool_result: Callable[[ToolResult], object] | None = None,
    ) -> request_agent_execution.RequestAgentExecutionResult:
        del prompt, on_assistant_response, on_tool_result
        assert metadata is not None
        captured["metadata"] = metadata
        return request_agent_execution.RequestAgentExecutionResult(
            final_text="Done",
            finished=True,
            iterations=1,
            thread_id="thread-1",
            final_response_type="finished_task",
            notebook_path=metadata.notebook_path,
            artifact_paths=[metadata.notebook_path],
        )

    monkeypatch.setattr(mcp_server.request_agent_execution_manager, "run_prompt", fake_run_prompt)
    ctx = FakeMcpContext()

    await run_data_analyst("Use defaults", mcp_context=ctx)

    metadata = captured["metadata"]
    assert isinstance(metadata, request_agent_execution.RequestAgentExecutionInput)
    assert metadata.kernel_cwd is None


def test_detect_ask_user_mode_detects_elicitation_capability() -> None:
    ctx = FakeMcpContextWithElicitation()
    assert detect_ask_user_mode(ctx) == "mcp_elicitation"


def test_detect_ask_user_mode_supports_form_mode_capability_object() -> None:
    ctx = FakeMcpContextWithFormElicitation()
    assert detect_ask_user_mode(ctx) == "mcp_elicitation"


def test_detect_ask_user_mode_supports_fastmcp_sdk_capabilities_shape() -> None:
    ctx = FakeMcpContextWithSdkExperimentalCapabilities()
    assert detect_ask_user_mode(ctx) == "mcp_elicitation"


def test_detect_ask_user_mode_falls_back_to_plaintext() -> None:
    ctx = FakeMcpContext()
    assert detect_ask_user_mode(ctx) == "mcp_plaintext"


def test_detect_ask_user_mode_ignores_extension_only_signal() -> None:
    ctx = FakeMcpContextWithOnlyExtensions()
    assert detect_ask_user_mode(ctx) == "mcp_plaintext"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_run_data_analyst_live_end_to_end() -> None:
    """Run the real MCP->AgentRunner stack without mocking internals."""
    ctx = FakeMcpContext()
    result = await run_data_analyst(
        (
            "Say hello in one sentence and then immediately finish the task. "
            "Do not ask questions."
        ),
        mcp_context=ctx,
    )

    assert isinstance(result, dict)
    assert isinstance(result["final_text"], str)
    assert result["final_text"].strip() != ""
    assert isinstance(result["metadata"], dict)
    assert len(ctx.events) >= 2
    assert ctx.events[0][1] == "Starting analysis run"
    assert ctx.events[-1][1] == "Analysis run completed"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_run_data_analyst_live_dataframe_analysis_uses_cell_update() -> None:
    """Run a real analysis task that should require a cell_update tool execution."""
    ctx = FakeMcpContext()
    result = await run_data_analyst(
        (
            "Create a pandas DataFrame in a code cell with numbers [2, 9, 4]. "
            "Use a cell update so the code executes in the notebook context, "
            "determine the biggest number, and then finish with one sentence "
            "that includes the numeric result."
        ),
        mcp_context=ctx,
    )

    assert isinstance(result, dict)
    assert "9" in result["final_text"]
    assert len(ctx.events) >= 2
    assert ctx.events[0][1] == "Starting analysis run"
    assert ctx.events[-1][1] == "Analysis run completed"
    assert any("Tool completed (cell_update)" in message for _, message in ctx.events), ctx.events

