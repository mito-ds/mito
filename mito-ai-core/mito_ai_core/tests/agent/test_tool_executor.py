# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Tests that validate the ToolExecutor protocol using a fake implementation."""

from __future__ import annotations

from typing import List, Optional

import pytest

from mito_ai_core.agent import AgentContext, ToolExecutor, ToolResult
from mito_ai_core.completions.models import AIOptimizedCell, CellUpdate, KernelVariable


# ---------------------------------------------------------------------------
# Fake executor — satisfies the protocol without any real I/O
# ---------------------------------------------------------------------------

class FakeToolExecutor:
    """In-memory ToolExecutor for unit tests.

    Records every call so tests can assert on call counts and arguments.
    """

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

    async def create_streamlit_app(
        self,
        ctx: AgentContext,
        message: str,
        streamlit_app_prompt: Optional[str] = None,
    ) -> ToolResult:
        self.calls.append(("create_streamlit_app", {
            "ctx": ctx,
            "message": message,
            "streamlit_app_prompt": streamlit_app_prompt,
        }))
        return ToolResult(success=True, output="Created Streamlit app preview")

    async def edit_streamlit_app(
        self,
        ctx: AgentContext,
        streamlit_app_prompt: str,
        message: str,
    ) -> ToolResult:
        self.calls.append(("edit_streamlit_app", {
            "ctx": ctx,
            "streamlit_app_prompt": streamlit_app_prompt,
            "message": message,
        }))
        return ToolResult(success=True, output="Edited Streamlit app preview")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_ctx() -> AgentContext:
    return AgentContext(
        thread_id="t-1",
        notebook_id="nb-1",
        notebook_path="/tmp/test.ipynb",
        cells=[
            AIOptimizedCell(cell_type="code", id="cell-1", code="import pandas as pd"),
        ],
        active_cell_id="cell-1",
        variables=[KernelVariable(variable_name="pd", type="module", value=None)],
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestFakeToolExecutorSatisfiesProtocol:
    """The fake must be recognised as a structural subtype of ToolExecutor."""

    def test_isinstance_check(self) -> None:
        executor = FakeToolExecutor()
        assert isinstance(executor, ToolExecutor)


class TestExecuteCellUpdate:
    @pytest.mark.asyncio
    async def test_modification(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        cell = CellUpdate(
            type="modification",
            id="cell-1",
            after_cell_id=None,
            code="import pandas as pd\ndf = pd.read_csv('data.csv')",
            code_summary="Loading data",
            cell_type="code",
        )
        result = await executor.execute_cell_update(ctx, cell, "Load the CSV.")

        assert result.success
        assert result.cells is not None
        assert result.cells[0].code == cell.code
        assert len(executor.calls) == 1
        assert executor.calls[0][0] == "execute_cell_update"

    @pytest.mark.asyncio
    async def test_new_cell(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        cell = CellUpdate(
            type="new",
            id=None,
            after_cell_id="cell-1",
            code="df.head()",
            code_summary="Previewing data",
            cell_type="code",
        )
        result = await executor.execute_cell_update(ctx, cell, "Preview the dataframe.")

        assert result.success
        assert result.cells is not None
        assert result.cells[0].id == "new-cell-1"


class TestRunAllCells:
    @pytest.mark.asyncio
    async def test_returns_refreshed_state(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        result = await executor.run_all_cells(ctx, "Refresh kernel state.")

        assert result.success
        assert result.cells == ctx.cells
        assert result.variables == ctx.variables


class TestGetCellOutput:
    @pytest.mark.asyncio
    async def test_returns_output(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        result = await executor.get_cell_output(ctx, "cell-1", "Check the chart.")

        assert result.success
        assert result.output == "base64-encoded-image-data"


class TestExecuteScratchpad:
    @pytest.mark.asyncio
    async def test_captures_stdout(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        result = await executor.execute_scratchpad(
            ctx,
            code="import os; print(os.listdir('.'))",
            summary="Checking files",
            message="See what data files exist.",
        )

        assert result.success
        assert result.output is not None


class TestAskUserQuestion:
    @pytest.mark.asyncio
    async def test_with_answers(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        result = await executor.ask_user_question(
            ctx,
            question="Which data source?",
            message="The CSV wasn't found.",
            answers=["yfinance", "placeholder", "skip"],
        )

        assert result.success
        assert result.output == "Use yfinance"
        assert executor.calls[0][1]["answers"] == ["yfinance", "placeholder", "skip"]

    @pytest.mark.asyncio
    async def test_without_answers(self) -> None:
        executor = FakeToolExecutor()
        ctx = _make_ctx()
        result = await executor.ask_user_question(
            ctx,
            question="What file should I use?",
            message="Need clarification.",
        )

        assert result.success
        assert executor.calls[0][1]["answers"] is None


class TestToolResultDefaults:
    """ToolResult should have sensible defaults for optional fields."""

    def test_minimal_success(self) -> None:
        r = ToolResult(success=True)
        assert r.tool_name is None
        assert r.error_message is None
        assert r.cells is None
        assert r.variables is None
        assert r.output is None
        assert r.extra == {}

    def test_failure_with_message(self) -> None:
        r = ToolResult(success=False, error_message="NameError: name 'x' is not defined")
        assert not r.success
        assert "NameError" in (r.error_message or "")


class TestAgentContext:
    """AgentContext should be mutable and have sensible defaults."""

    def test_defaults(self) -> None:
        ctx = AgentContext(
            thread_id="t-1",
            notebook_id="nb-1",
            notebook_path="/tmp/test.ipynb",
        )
        assert ctx.cells == []
        assert ctx.active_cell_id == ""
        assert ctx.variables is None
        assert ctx.files is None
        assert ctx.is_chrome_browser is True

    def test_mutability(self) -> None:
        ctx = _make_ctx()
        ctx.active_cell_id = "cell-2"
        assert ctx.active_cell_id == "cell-2"
