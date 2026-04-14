# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""End-to-end MCP tool wiring tests (local, deterministic, no network)."""

from __future__ import annotations

from typing import Callable

import pytest

from mito_ai_core.agent import AgentRunResult, ToolResult
from mito_ai_core.completions.models import AgentResponse
from mito_ai_mcp import request_agent_execution
from mito_ai_mcp.server import run_data_analyst

class FakeMcpContext:
    """Minimal context stub that records progress notifications."""

    def __init__(self) -> None:
        self.events: list[tuple[int, str]] = []

    async def report_progress(self, progress: int, total: int | None, message: str) -> None:
        del total  # Unused in tests.
        self.events.append((progress, message))


class FakeProviderManager:
    async def request_completions(self, **kwargs: object) -> str:
        del kwargs
        return "{}"


class FakeToolExecutor:
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

    ctx = FakeMcpContext()
    result = await run_data_analyst("Summarize this notebook", mcp_context=ctx)

    assert result == "Done\n\nSuggested next steps:\n- Share the summary"
    assert ctx.events == [
        (1, "Starting analysis run"),
        (2, "Assistant response (scratchpad): Planning next step"),
        (3, "Tool completed (scratchpad)"),
        (4, "Analysis run completed"),
    ]


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

    assert isinstance(result, str)
    assert result.strip() != ""
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

    assert isinstance(result, str)
    assert "9" in result
    assert len(ctx.events) >= 2
    assert ctx.events[0][1] == "Starting analysis run"
    assert ctx.events[-1][1] == "Analysis run completed"
    assert any("Tool completed (cell_update)" in message for _, message in ctx.events), ctx.events
