# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""In-process :class:`ToolExecutor` backed by an ipykernel session."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Awaitable, Callable, List, Literal, Optional, Tuple

from mito_ai_core.agent.types import AgentContext, ToolResult
from mito_ai_core.completions.models import AIOptimizedCell, CellUpdate

from mito_ai_python_tool_executor.blacklisted_words import check_for_blacklisted_words
from mito_ai_python_tool_executor.kernel_session import KernelSession

AskUserMode = Literal["cli", "mcp_elicitation", "mcp_plaintext"]
AskUserHandler = Callable[[str, Optional[List[str]]], Awaitable[Optional[str]]]
logger = logging.getLogger(__name__)

ASK_USER_QUESTION_DISABLED_MESSAGE = (
    "The ask_user_question tool is disabled in this environment. "
    "Please use your best judgement to assume the user's response and continue working."
)

STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE = (
    "This Streamlit and app functionality is disabled in this environment. "
    "Please use your best judgement on how to proceed. Either continue working in the notebook "
    "or tell the user that this functionality is disabled."
)


def _blacklist_error(code: str) -> Optional[str]:
    result = check_for_blacklisted_words(code)
    return result.reason if not result.safe else None


def _default_cell_type(cell_update: CellUpdate) -> str:
    return cell_update.cell_type or "code"


def _find_cell_index(cells: List[AIOptimizedCell], cell_id: str) -> Optional[int]:
    for i, c in enumerate(cells):
        if c.id == cell_id:
            return i
    return None


class PythonToolExecutor:
    """Execute agent tools against a single long-lived ipykernel.

    Mutates :class:`AgentContext` in place (``cells``, ``active_cell_id``,
    ``variables``) and returns :class:`ToolResult` snapshots for the agent loop.
    """

    def __init__(
        self,
        *,
        ask_user_mode: AskUserMode = "cli",
        ask_user_handler: Optional[AskUserHandler] = None,
        kernel_cwd: str | None = None,
    ) -> None:
        self._session: Optional[KernelSession] = None
        self._last_cell_text: dict[str, str] = {}
        self._ask_user_mode: AskUserMode = ask_user_mode
        self._ask_user_handler = ask_user_handler
        self._kernel_cwd = kernel_cwd

    def _ensure_session(self) -> KernelSession:
        if self._session is None:
            self._session = KernelSession(cwd=self._kernel_cwd)
        return self._session

    def shutdown(self) -> None:
        """Stop the kernel if it was started."""
        if self._session is not None:
            self._session.shutdown()
            self._session = None

    async def execute_cell_update(
        self,
        ctx: AgentContext,
        cell_update: CellUpdate,
        message: str,
    ) -> ToolResult:
        def _sync() -> ToolResult:
            session = self._ensure_session()
            cells = list(ctx.cells)
            new_cells, active_id, err = self._apply_cell_update(cells, cell_update)
            if err:
                return ToolResult(
                    success=False,
                    tool_name="cell_update",
                    error_message=err,
                )
            ctx.cells = new_cells
            ctx.active_cell_id = active_id

            idx = _find_cell_index(new_cells, active_id)
            if idx is None:
                vars_ = session.fetch_variables()
                ctx.variables = vars_
                return ToolResult(
                    success=True,
                    tool_name="cell_update",
                    cells=new_cells,
                    variables=vars_,
                )

            cell = new_cells[idx]
            if cell.cell_type != "code":
                vars_ = session.fetch_variables()
                ctx.variables = vars_
                return ToolResult(
                    success=True,
                    tool_name="cell_update",
                    cells=new_cells,
                    variables=vars_,
                )

            blocked = _blacklist_error(cell.code)
            if blocked:
                vars_ = session.fetch_variables()
                ctx.variables = vars_
                return ToolResult(
                    success=False,
                    tool_name="cell_update",
                    error_message=blocked,
                    cells=new_cells,
                    variables=vars_,
                )

            ok, out, exec_err = session.execute(cell.code)
            self._last_cell_text[cell.id] = out if out else (exec_err or "")

            vars_ = session.fetch_variables()
            ctx.variables = vars_
            if not ok:
                return ToolResult(
                    success=False,
                    tool_name="cell_update",
                    error_message=exec_err or "Cell execution failed",
                    cells=new_cells,
                    variables=vars_,
                )
            return ToolResult(
                success=True,
                tool_name="cell_update",
                cells=new_cells,
                variables=vars_,
            )

        return await asyncio.to_thread(_sync)

    def _apply_cell_update(
        self,
        cells: List[AIOptimizedCell],
        cell_update: CellUpdate,
    ) -> Tuple[List[AIOptimizedCell], str, Optional[str]]:
        if cell_update.type == "modification":
            if not cell_update.id:
                return cells, "", "cell_update modification requires id"
            idx = _find_cell_index(cells, cell_update.id)
            if idx is None:
                return cells, "", f"Cell id {cell_update.id!r} not found"
            ct = _default_cell_type(cell_update)
            updated = AIOptimizedCell(cell_type=ct, id=cell_update.id, code=cell_update.code)
            new_cells = cells.copy()
            new_cells[idx] = updated
            return new_cells, cell_update.id, None

        # new cell
        after = cell_update.after_cell_id
        if after is None:
            return cells, "", "cell_update new requires after_cell_id"

        ct = _default_cell_type(cell_update)
        new_id = str(uuid.uuid4())
        new_cell = AIOptimizedCell(cell_type=ct, id=new_id, code=cell_update.code)
        new_cells = cells.copy()

        if after == "new cell":
            new_cells.insert(0, new_cell)
            return new_cells, new_id, None

        idx = _find_cell_index(new_cells, after)
        if idx is None:
            return cells, "", f"after_cell_id {after!r} not found"
        new_cells.insert(idx + 1, new_cell)
        return new_cells, new_id, None

    async def run_all_cells(
        self,
        ctx: AgentContext,
        message: str,
    ) -> ToolResult:
        def _sync() -> ToolResult:
            session = self._ensure_session()
            cells = list(ctx.cells)
            for cell in cells:
                if cell.cell_type != "code":
                    continue
                blocked = _blacklist_error(cell.code)
                if blocked:
                    vars_ = session.fetch_variables()
                    ctx.variables = vars_
                    ctx.cells = cells
                    return ToolResult(
                        success=False,
                        tool_name="run_all_cells",
                        error_message=blocked,
                        cells=cells,
                        variables=vars_,
                    )
                ok, out, err = session.execute(cell.code)
                self._last_cell_text[cell.id] = out if out else (err or "")
                if not ok:
                    vars_ = session.fetch_variables()
                    ctx.variables = vars_
                    ctx.cells = cells
                    return ToolResult(
                        success=False,
                        tool_name="run_all_cells",
                        error_message=err or "Run-all failed",
                        cells=cells,
                        variables=vars_,
                    )
            vars_ = session.fetch_variables()
            ctx.variables = vars_
            ctx.cells = cells
            return ToolResult(
                success=True,
                tool_name="run_all_cells",
                cells=cells,
                variables=vars_,
            )

        return await asyncio.to_thread(_sync)

    async def get_cell_output(
        self,
        ctx: AgentContext,
        cell_id: str,
        message: str,
    ) -> ToolResult:
        def _sync() -> ToolResult:
            text = self._last_cell_text.get(cell_id)
            if text is None:
                return ToolResult(
                    success=True,
                    tool_name="get_cell_output",
                    output=None,
                    error_message=(
                        "[CLI] No captured text output for this cell yet. "
                        "Run the cell or use run_all_cells / scratchpad first."
                    ),
                )
            return ToolResult(
                success=True,
                tool_name="get_cell_output",
                output=None,
                error_message=f"Cell output (plain text):\n{text}",
            )

        return await asyncio.to_thread(_sync)

    async def execute_scratchpad(
        self,
        ctx: AgentContext,
        code: str,
        summary: str,
        message: str,
    ) -> ToolResult:
        def _sync() -> ToolResult:
            session = self._ensure_session()
            blocked = _blacklist_error(code)
            if blocked:
                vars_ = session.fetch_variables()
                ctx.variables = vars_
                return ToolResult(
                    success=False,
                    tool_name="scratchpad",
                    error_message=blocked,
                    variables=vars_,
                )
            ok, out, err = session.execute(code)
            vars_ = session.fetch_variables()
            ctx.variables = vars_
            if not ok:
                return ToolResult(
                    success=False,
                    tool_name="scratchpad",
                    error_message=err or "Scratchpad execution failed",
                    output=out,
                    variables=vars_,
                )
            return ToolResult(
                success=True,
                tool_name="scratchpad",
                output=out,
                variables=vars_,
            )

        return await asyncio.to_thread(_sync)

    async def ask_user_question(
        self,
        ctx: AgentContext,
        question: str,
        message: str,
        answers: Optional[List[str]] = None,
    ) -> ToolResult:
        logger.info(
            "ask_user_question invoked with mode=%s, answers_provided=%s",
            self._ask_user_mode,
            bool(answers),
        )

        if self._ask_user_mode == "mcp_elicitation":
            logger.info("Routing ask_user_question via MCP elicitation handler")
            return await self._ask_user_question_via_mcp(ctx, question, answers)
        if self._ask_user_mode == "mcp_plaintext":
            logger.info("Routing ask_user_question via MCP plaintext fallback")
            return await self._ask_user_question_disabled_response(ctx, question, answers)
        if self._ask_user_mode != "cli":
            logger.warning(
                "Unknown ask_user_mode=%s; forcing plaintext fallback",
                self._ask_user_mode,
            )
            return await self._ask_user_question_disabled_response(ctx, question, answers)

        logger.warning("Routing ask_user_question via CLI stdin/stdout prompt path")
        def _sync() -> ToolResult:
            session = self._ensure_session()
            print(question, flush=True)
            if answers:
                for i, a in enumerate(answers):
                    print(f"  [{i}] {a}", flush=True)
                raw = input("Enter a number or free text: ").strip()
                if raw.isdigit():
                    j = int(raw)
                    if 0 <= j < len(answers):
                        answer = answers[j]
                    else:
                        answer = raw
                else:
                    answer = raw
            else:
                answer = input("> ").strip()

            vars_ = session.fetch_variables()
            ctx.variables = vars_
            return ToolResult(
                success=True,
                tool_name="ask_user_question",
                output=answer,
                variables=vars_,
            )

        return await asyncio.to_thread(_sync)

    async def _ask_user_question_via_mcp(
        self,
        ctx: AgentContext,
        question: str,
        answers: Optional[List[str]],
    ) -> ToolResult:
        if self._ask_user_handler is None:
            logger.warning(
                "ask_user_question is in `mcp_elicitation` mode but no "
                "elicitation handler is configured; returning disabled "
                "plaintext message."
            )
            return await self._ask_user_question_disabled_response(ctx, question, answers)

        try:
            answer = await self._ask_user_handler(question, answers)
        except Exception as exc:
            logger.warning(
                "MCP elicitation failed for ask_user_question; returning "
                "disabled plaintext message. error=%s",
                exc,
            )
            return await self._ask_user_question_disabled_response(ctx, question, answers)

        session = self._ensure_session()
        vars_ = session.fetch_variables()
        ctx.variables = vars_
        return ToolResult(
            success=True,
            tool_name="ask_user_question",
            output=(answer or "").strip(),
            variables=vars_,
        )

    async def _ask_user_question_disabled_response(
        self,
        ctx: AgentContext,
        question: str,
        answers: Optional[List[str]],
    ) -> ToolResult:
        del question, answers  # Plaintext mode intentionally disables user prompting.
        session = self._ensure_session()
        vars_ = session.fetch_variables()
        ctx.variables = vars_
        return ToolResult(
            success=True,
            tool_name="ask_user_question",
            output=ASK_USER_QUESTION_DISABLED_MESSAGE,
            variables=vars_,
        )

    async def create_streamlit_app(
        self,
        ctx: AgentContext,
        message: str,
        streamlit_app_prompt: Optional[str] = None,
    ) -> ToolResult:
        del message, streamlit_app_prompt
        session = self._ensure_session()
        vars_ = session.fetch_variables()
        ctx.variables = vars_
        return ToolResult(
            success=True,
            tool_name="create_streamlit_app",
            output=STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE,
            variables=vars_,
        )

    async def edit_streamlit_app(
        self,
        ctx: AgentContext,
        streamlit_app_prompt: str,
        message: str,
    ) -> ToolResult:
        del streamlit_app_prompt, message
        session = self._ensure_session()
        vars_ = session.fetch_variables()
        ctx.variables = vars_
        return ToolResult(
            success=True,
            tool_name="edit_streamlit_app",
            output=STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE,
            variables=vars_,
        )
