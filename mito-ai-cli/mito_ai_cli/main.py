# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""CLI entrypoint: one-shot agent run and notebook save."""

from __future__ import annotations

import argparse
import asyncio
import sys
import traceback
from typing import Any, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.agent import AgentContext, AgentRunResult, ToolResult
from mito_ai_core.agent.agent_runner import AgentRunner
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import AgentResponse, MessageType
from mito_ai_core.provider_manager import ProviderManager
from mito_ai_python_tool_executor import PythonToolExecutor, cells_to_notebook, save_notebook


class ProviderAdapter:
    """Adapts :class:`ProviderManager` to :class:`CompletionProvider` (keyword-only API)."""

    def __init__(self, pm: ProviderManager) -> None:
        self._pm = pm

    async def request_completions(
        self,
        *,
        message_type: Any,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        return await self._pm.request_completions(
            message_type=message_type,
            messages=messages,
            response_format_info=response_format_info,
        )


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="mito-ai",
        description="Run the Mito AI agent and write a new notebook.",
    )
    sub = p.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Run the agent on a task and save cells to a notebook.")
    run.add_argument(
        "prompt",
        help="Natural language task for the agent (quote the string if it contains spaces).",
    )
    run.add_argument(
        "-o",
        "--output",
        required=True,
        metavar="PATH",
        help="Path for the output .ipynb (written once when the run finishes).",
    )
    run.add_argument(
        "--model",
        metavar="NAME",
        help="Optional model id (must be in the provider's allowed model list).",
    )
    return p


def _print_assistant_step(response: AgentResponse) -> None:
    line = f"[agent] {response.type}: {response.message}"
    print(line, file=sys.stderr)
    if response.next_steps:
        for step in response.next_steps:
            print(f"  next: {step}", file=sys.stderr)


def _print_tool_result(tool_result: ToolResult) -> None:
    name = tool_result.tool_name or "?"
    print(f"[tool] {name} ok={tool_result.success}", file=sys.stderr)
    if tool_result.error_message:
        print(f"  detail: {tool_result.error_message}", file=sys.stderr)


async def _async_main(args: argparse.Namespace) -> int:
    message_history = GlobalMessageHistory()
    thread_id = message_history.create_new_thread()
    tid = str(thread_id)

    llm = ProviderManager()
    if getattr(args, "model", None):
        llm.set_selected_model(args.model)

    tool_executor = PythonToolExecutor()

    async def on_assistant(response: AgentResponse) -> None:
        _print_assistant_step(response)

    async def on_tool(tool_result: ToolResult) -> None:
        _print_tool_result(tool_result)

    provider = ProviderAdapter(llm)
    runner = AgentRunner(
        provider=provider,
        tool_executor=tool_executor,
        message_history=message_history,
    )

    ctx = AgentContext(
        thread_id=tid,
        notebook_id="cli-notebook",
        notebook_path=args.output,
        cells=[],
        active_cell_id="",
        variables=None,
        files=None,
        is_chrome_browser=False,
        additional_context=None,
    )

    try:
        result: AgentRunResult = await runner.run(
            ctx,
            args.prompt,
            on_assistant_response=on_assistant,
            on_tool_result=on_tool,
            message_type=MessageType.AGENT_EXECUTION,
        )
    except Exception:
        print("Agent run failed:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1
    finally:
        tool_executor.shutdown()

    print(
        f"[done] finished={result.finished} iterations={result.iterations}",
        file=sys.stderr,
    )

    nb = cells_to_notebook(ctx.cells)
    save_notebook(nb, args.output)
    print(args.output)
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command != "run":
        parser.print_help()
        return 2
    return asyncio.run(_async_main(args))
