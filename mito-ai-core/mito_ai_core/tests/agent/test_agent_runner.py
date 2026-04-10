# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Tests for AgentRunner using a FakeToolExecutor and a FakeProviderManager."""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional

import pytest

from mito_ai_core.agent import AgentContext, AgentRunResult, ToolExecutor, ToolResult
from mito_ai_core.agent.agent_runner import AgentRunner
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import (
    AIOptimizedCell,
    AgentResponse,
    CellUpdate,
    KernelVariable,
    MessageType,
)

# ---------------------------------------------------------------------------
# Fake ProviderManager
# ---------------------------------------------------------------------------


class FakeProviderManager:
    """Returns pre-canned completion strings in order.

    Quacks enough like :class:`ProviderManager` for the runner to call
    ``request_completions``.
    """

    def __init__(self, completions: List[str]) -> None:
        self._completions = list(completions)
        self._call_index = 0
        self.call_count = 0
        self.last_messages: Optional[List[Any]] = None
        self.messages_per_call: List[List[Any]] = []

    async def request_completions(self, **kwargs: Any) -> str:
        if self._call_index >= len(self._completions):
            raise RuntimeError("FakeProviderManager ran out of completions")
        msgs = kwargs.get("messages")
        # Snapshot: runner mutates the same list after each completion.
        self.last_messages = list(msgs) if msgs is not None else []
        self.messages_per_call.append(list(msgs) if msgs is not None else [])
        result = self._completions[self._call_index]
        self._call_index += 1
        self.call_count += 1
        return result


# ---------------------------------------------------------------------------
# Fake ToolExecutor (same as in test_tool_executor.py, extended slightly)
# ---------------------------------------------------------------------------


class FakeToolExecutor:
    """In-memory ToolExecutor for agent-runner tests."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, dict]] = []

    async def execute_cell_update(
        self,
        ctx: AgentContext,
        cell_update: CellUpdate,
        message: str,
    ) -> ToolResult:
        self.calls.append(("execute_cell_update", {
            "ctx": ctx,
            "cell_update": cell_update,
            "message": message,
        }))
        new_cell = AIOptimizedCell(
            cell_type="code",
            id=cell_update.id or "new-cell-1",
            code=cell_update.code,
        )
        return ToolResult(
            success=True,
            cells=[new_cell],
            variables=[KernelVariable(variable_name="df", type="DataFrame", value=None)],
        )

    async def run_all_cells(
        self,
        ctx: AgentContext,
        message: str,
    ) -> ToolResult:
        self.calls.append(("run_all_cells", {
            "ctx": ctx,
            "message": message,
        }))
        return ToolResult(success=True, cells=ctx.cells, variables=ctx.variables)

    async def get_cell_output(
        self,
        ctx: AgentContext,
        cell_id: str,
        message: str,
    ) -> ToolResult:
        self.calls.append(("get_cell_output", {
            "ctx": ctx,
            "cell_id": cell_id,
            "message": message,
        }))
        return ToolResult(success=True, output="base64-encoded-image-data")

    async def execute_scratchpad(
        self,
        ctx: AgentContext,
        code: str,
        summary: str,
        message: str,
    ) -> ToolResult:
        self.calls.append(("execute_scratchpad", {
            "ctx": ctx,
            "code": code,
            "summary": summary,
            "message": message,
        }))
        return ToolResult(success=True, output="['.', 'data.csv']")

    async def ask_user_question(
        self,
        ctx: AgentContext,
        question: str,
        message: str,
        answers: Optional[List[str]] = None,
    ) -> ToolResult:
        self.calls.append(("ask_user_question", {
            "ctx": ctx,
            "question": question,
            "message": message,
            "answers": answers,
        }))
        return ToolResult(success=True, output="Use yfinance")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _new_history_and_ctx() -> tuple[GlobalMessageHistory, AgentContext]:
    """Fresh history with a real thread so ``append_message`` / system prompt setup succeed."""
    mh = GlobalMessageHistory()
    tid = str(mh.create_new_thread())
    ctx = AgentContext(
        thread_id=tid,
        notebook_id="nb-1",
        notebook_path="/tmp/test.ipynb",
        cells=[
            AIOptimizedCell(cell_type="code", id="cell-1", code="import pandas as pd"),
        ],
        active_cell_id="cell-1",
        variables=[KernelVariable(variable_name="pd", type="module", value=None)],
    )
    return mh, ctx


def _agent_response_json(
    rtype: str,
    message: str = "thinking...",
    **extra: Any,
) -> str:
    """Build a valid AgentResponse JSON string."""
    data: Dict[str, Any] = {
        "type": rtype,
        "message": message,
        "cell_update": None,
        "get_cell_output_cell_id": None,
        "next_steps": None,
        "analysis_assumptions": None,
        "streamlit_app_prompt": None,
        "question": None,
        "answers": None,
        "scratchpad_code": None,
        "scratchpad_summary": None,
    }
    data.update(extra)
    return json.dumps(data)


def _cell_update_response(code: str = "df.head()") -> str:
    return _agent_response_json(
        "cell_update",
        message="Adding code.",
        cell_update={
            "type": "modification",
            "id": "cell-1",
            "after_cell_id": None,
            "code": code,
            "code_summary": "preview data",
            "cell_type": "code",
        },
    )


def _finished_response() -> str:
    return _agent_response_json("finished_task", message="All done.")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestSingleIterationFinish:
    """Agent responds with finished_task on the first call."""

    @pytest.mark.asyncio
    async def test_returns_finished(self) -> None:
        provider = FakeProviderManager([_finished_response()])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert result.iterations == 1
        assert result.final_response.type == "finished_task"
        assert len(executor.calls) == 0

    @pytest.mark.asyncio
    async def test_appends_assistant_message_to_working_history(self) -> None:
        provider = FakeProviderManager([_finished_response()])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        assistant_texts: list[AgentResponse] = []

        async def on_a(response: AgentResponse) -> None:
            assistant_texts.append(response)

        await runner.run(ctx, "", on_assistant_response=on_a)

        assert provider.last_messages is not None
        assert len(provider.last_messages) == 2
        assert [m["role"] for m in provider.last_messages] == ["system", "user"]
        assert len(assistant_texts) == 1


class TestToolDispatch:
    """Agent makes one tool call then finishes."""

    @pytest.mark.asyncio
    async def test_cell_update_dispatched(self) -> None:
        provider = FakeProviderManager([
            _cell_update_response("import numpy as np"),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert result.iterations == 2
        assert len(executor.calls) == 1
        assert executor.calls[0][0] == "execute_cell_update"

    @pytest.mark.asyncio
    async def test_run_all_cells_dispatched(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json("run_all_cells", message="Running all cells."),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert executor.calls[0][0] == "run_all_cells"

    @pytest.mark.asyncio
    async def test_get_cell_output_dispatched(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json(
                "get_cell_output",
                message="Checking chart.",
                get_cell_output_cell_id="cell-1",
            ),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert executor.calls[0][0] == "get_cell_output"

    @pytest.mark.asyncio
    async def test_scratchpad_dispatched(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json(
                "scratchpad",
                message="Exploring files.",
                scratchpad_code="import os; print(os.listdir('.'))",
                scratchpad_summary="listing directory",
            ),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert executor.calls[0][0] == "execute_scratchpad"

    @pytest.mark.asyncio
    async def test_ask_user_question_dispatched(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json(
                "ask_user_question",
                message="Need info.",
                question="Which dataset?",
                answers=["iris", "titanic"],
            ),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert executor.calls[0][0] == "ask_user_question"


class TestContextUpdated:
    """ToolResult feeds back into ctx."""

    @pytest.mark.asyncio
    async def test_cells_and_variables_updated(self) -> None:
        provider = FakeProviderManager([
            _cell_update_response("df = pd.read_csv('data.csv')"),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        await runner.run(ctx, "")

        # FakeToolExecutor.execute_cell_update returns cells=[new_cell], variables=[df]
        assert ctx.variables is not None
        assert len(ctx.variables) == 1
        assert ctx.variables[0].variable_name == "df"
        assert ctx.cells is not None
        assert len(ctx.cells) == 1


class TestCallbacks:
    """on_assistant_response and on_tool_result are invoked."""

    @pytest.mark.asyncio
    async def test_callbacks_called(self) -> None:
        provider = FakeProviderManager([
            _cell_update_response(),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        assistant_responses: list[AgentResponse] = []
        tool_results: list[ToolResult] = []

        async def on_assistant(response: AgentResponse) -> None:
            assistant_responses.append(response)

        async def on_tool(result: ToolResult) -> None:
            tool_results.append(result)

        await runner.run(
            ctx,
            "",
            on_assistant_response=on_assistant,
            on_tool_result=on_tool,
        )

        # 2 LLM calls → 2 assistant responses
        assert len(assistant_responses) == 2
        # 1 dispatchable tool → 1 tool result callback
        assert len(tool_results) == 1
        assert tool_results[0].success is True


class TestMaxIterations:
    """Loop terminates at max_iterations even if agent never finishes."""

    @pytest.mark.asyncio
    async def test_max_iterations_reached(self) -> None:
        # Agent always returns cell_update, never finished_task
        provider = FakeProviderManager(
            [_cell_update_response()] * 5
        )
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh, max_iterations=3)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is False
        assert result.iterations == 3
        assert provider.call_count == 3

    def test_max_iterations_validation(self) -> None:
        provider = FakeProviderManager([])
        executor = FakeToolExecutor()
        with pytest.raises(ValueError, match="max_iterations must be >= 1"):
            AgentRunner(provider, executor, GlobalMessageHistory(), max_iterations=0)  # type: ignore[arg-type]


class TestWorkingHistory:
    """Messages list grows correctly across iterations."""

    @pytest.mark.asyncio
    async def test_messages_grow(self) -> None:
        provider = FakeProviderManager([
            _cell_update_response(),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        await runner.run(ctx, "")

        # Iteration 1: +1 assistant, +1 tool-result
        # Iteration 2: +1 assistant (finished_task, no tool-result)
        # Working history includes the agent system prompt plus the user turn.
        assert len(provider.messages_per_call) == 2
        assert len(provider.messages_per_call[0]) == 2
        assert [m["role"] for m in provider.messages_per_call[0]] == ["system", "user"]
        assert len(provider.messages_per_call[1]) == 4
        assert [m["role"] for m in provider.messages_per_call[1]] == [
            "system",
            "user",
            "assistant",
            "user",
        ]


class TestNonDispatchableStopsLoop:
    """Non-dispatchable types (e.g. create_streamlit_app) stop the loop."""

    @pytest.mark.asyncio
    async def test_streamlit_stops(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json("create_streamlit_app", message="Creating app."),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is False
        assert result.final_response.type == "create_streamlit_app"
        assert result.iterations == 1
        assert len(executor.calls) == 0


class TestNullPayloadHandling:
    """Agent returns a dispatchable type with a null required payload."""

    @pytest.mark.asyncio
    async def test_null_cell_update_payload(self) -> None:
        provider = FakeProviderManager([
            _agent_response_json("cell_update", message="oops", cell_update=None),
            _finished_response(),
        ])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        # The null payload should produce a failed ToolResult, not crash
        assert result.finished is True
        assert result.iterations == 2
        # The tool result message should mention the failure
        assert provider.messages_per_call[1][3]["role"] == "user"
        tool_msg_content = provider.messages_per_call[1][3]["content"]
        assert "failed" in str(tool_msg_content).lower()


class TestOptionalFieldsFilledByParser:
    """LLM might omit optional AgentResponse fields."""

    @pytest.mark.asyncio
    async def test_minimal_finished_task_json(self) -> None:
        """Agent returns only type and message — no optional fields."""
        minimal = json.dumps({"type": "finished_task", "message": "Done."})
        provider = FakeProviderManager([minimal])
        executor = FakeToolExecutor()
        mh, ctx = _new_history_and_ctx()
        runner = AgentRunner(provider, executor, mh)  # type: ignore[arg-type]

        result = await runner.run(ctx, "")

        assert result.finished is True
        assert result.final_response.message == "Done."
