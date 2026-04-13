# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""CLI entrypoint: one-shot agent run and notebook save."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import secrets
import traceback
from typing import Any, List, Optional

from mito_ai_core.agent import AgentContext, ToolResult
from mito_ai_core.agent.agent_runner import AgentRunner
from mito_ai_core.agent.agent_runner_config import AgentRunnerConfig
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import AgentResponse, MessageType
from mito_ai_core.provider_manager import ProviderManager
from mito_ai_core.utils.telemetry_utils import MITO_SERVER_FREE_TIER_LIMIT_REACHED
from mito_ai_python_tool_executor import PythonToolExecutor, cells_to_notebook, save_notebook
from mito_ai_cli.cli_print import cli_print
from mito_ai_cli.model_name_utils import resolve_cli_model_name
from mito_ai_cli.provider_adapter import ProviderAdapter
from mito_ai_cli.terminal import (
    BOLD,
    CYAN,
    DIM,
    RED,
    YELLOW,
    stylize,
    truncate_prompt_preview,
)

# Shadow builtin so CLI output stays citation-free without per-call stripping.
print = cli_print  # noqa: A001


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="mito-ai",
        description="Run the Mito AI agent to answer a data question and write a new notebook.",
    )
    sub = p.add_subparsers(dest="command", required=True)

    run = sub.add_parser(
        "run",
        help="Run the agent to answer a data question and write a new notebook.",
        description="Run the Mito AI agent once and save the resulting notebook.",
        epilog=(
            "Examples:\n"
            "  mito-ai run \"Analyze sales by region\"\n"
            "  mito-ai run \"Build a chart of monthly revenue\" -o reports/revenue.ipynb\n"
            "  mito-ai run \"Summarize customer churn drivers\" --model gpt 4.1"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    run.add_argument(
        "prompt",
        help="Natural language task for the agent (quote the string if it contains spaces).",
    )
    run.add_argument(
        "-o",
        "--output",
        metavar="PATH",
        help=(
            "Optional path for the output notebook (same as -o PATH). "
            "The file is written once when the run finishes. "
            "If omitted, defaults to mito-<4 hex chars>.ipynb in the current directory."
        ),
    )
    run.add_argument(
        "--model",
        metavar="NAME",
        help=(
            "Optional model to use for this run (provider id or common name). "
            "Examples: gpt 4.1, haiku 4.5. "
            "If omitted, the default configured model is used."
        ),
    )
    return p


def _print_assistant_step(response: AgentResponse) -> None:
    if response.type == "finished_task":
        print("", file=sys.stderr)
        print(stylize("RESULT", BOLD, YELLOW), file=sys.stderr)
        print("", file=sys.stderr)
        for line in (response.message or "").splitlines():
            print(f"{line}", file=sys.stderr)
        
        print("", file=sys.stderr)

        if response.next_steps:
            line = f"Suggested next steps:"
            print(stylize(line, DIM), file=sys.stderr)
            for step in response.next_steps:
                line = f"- {step}"
                print(stylize(line, DIM), file=sys.stderr)
        return

    print("", file=sys.stderr)

    prefix = stylize("[agent]", BOLD, CYAN)
    text = response.message or ""
    body = f" {text}"
    print(prefix + body, file=sys.stderr)
    
    if response.next_steps:
        for step in response.next_steps:
            line = f"  next: {step}"
            print(stylize(line, DIM), file=sys.stderr)


def _print_tool_result(tool_result: ToolResult) -> None:
    name = tool_result.tool_name or "?"
    line = f"[tool] {name} ok={tool_result.success}"
    print(f"{stylize(line, DIM)}", file=sys.stderr)
    if tool_result.error_message:
        detail = stylize(f"    detail: {tool_result.error_message}", DIM, RED)
        print(detail, file=sys.stderr)
        

def _print_agent_startup_message(prompt: str) -> None:
    line1 = stylize("Spinning up agent…", BOLD, CYAN)
    print(line1, file=sys.stderr)
    preview = truncate_prompt_preview(prompt, 60)
    line2 = stylize(f"Task: {preview}", DIM)
    print(line2, file=sys.stderr)


def _collect_paths_from_tool_extra(extra: Optional[dict[str, Any]]) -> List[str]:
    if not extra:
        return []
    out: List[str] = []
    for key in ("output_paths", "artifact_paths"):
        raw = extra.get(key)
        if isinstance(raw, (list, tuple)):
            for p in raw:
                if isinstance(p, str) and p.strip():
                    ap = os.path.abspath(os.path.expanduser(p.strip()))
                    if ap not in out:
                        out.append(ap)
    return out


def _print_outputs_section(paths: List[str]) -> None:
    """Highlight saved files so terminals can linkify paths."""
    if not paths:
        return
    print("", file=sys.stderr)
    print(stylize("OUTPUTS", BOLD, YELLOW), file=sys.stderr)
    print("", file=sys.stderr)
    for p in paths:
        print(stylize(p, DIM), file=sys.stderr)
    print("", file=sys.stderr)


def _print_free_tier_limit_exceeded() -> None:
    """User-facing message when hosted Mito server monthly free quota is exhausted."""
    print("", file=sys.stderr)
    print(stylize("Free tier limit reached", BOLD, RED), file=sys.stderr)
    print("", file=sys.stderr)
    body = (
        "You have used your free Mito server AI allowance for this month.\n"
        "\n"
        "To continue:\n"
        "  • Set your own API key "
        "(e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY).\n"
        "  • Or upgrade to Mito Pro for unlimited hosted usage: https://www.trymito.io/plans."
    )
    print(stylize(body, DIM), file=sys.stderr)
    print("", file=sys.stderr)


async def _async_main(args: argparse.Namespace) -> int:
    if args.output:
        output_path = os.path.expanduser(args.output)
    else:
        output_path = f"mito-{secrets.token_hex(2)}.ipynb"

    message_history = GlobalMessageHistory()
    thread_id = message_history.create_new_thread()
    tid = str(thread_id)

    llm = ProviderManager()
    if getattr(args, "model", None):
        try:
            resolved_model_name = resolve_cli_model_name(args.model)
        except ValueError as e:
            print(stylize(str(e), RED), file=sys.stderr)
            return 1
        
        llm.set_selected_model(resolved_model_name)

    tool_executor = PythonToolExecutor()
    artifact_paths_from_tools: List[str] = []

    provider = ProviderAdapter(llm)

    async def on_assistant(response: AgentResponse) -> None:
        _print_assistant_step(response)

    async def on_tool(tool_result: ToolResult) -> None:
        _print_tool_result(tool_result)
        for p in _collect_paths_from_tool_extra(tool_result.extra):
            if p not in artifact_paths_from_tools:
                artifact_paths_from_tools.append(p)
                
    runner = AgentRunner(
        provider=provider,
        tool_executor=tool_executor,
        message_history=message_history,
        config=AgentRunnerConfig(enable_get_cell_output=False),
    )

    ctx = AgentContext(
        thread_id=tid,
        notebook_id="cli-notebook",
        notebook_path=output_path,
        cells=[],
        active_cell_id="",
        variables=None,
        files=None,
        is_chrome_browser=False,
        additional_context=None,
    )

    try:
        _print_agent_startup_message(args.prompt)
        await runner.run(
            ctx,
            args.prompt,
            on_assistant_response=on_assistant,
            on_tool_result=on_tool,
            message_type=MessageType.AGENT_EXECUTION,
        )
    except PermissionError as e:
        if str(e) == MITO_SERVER_FREE_TIER_LIMIT_REACHED:
            _print_free_tier_limit_exceeded()
            return 1
        print("Agent run failed:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1
    except Exception:
        print("Agent run failed:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1
    finally:
        tool_executor.shutdown()

    try:
        nb = cells_to_notebook(ctx.cells)
        save_notebook(nb, output_path)
    except Exception as e:
        print(stylize(f"Failed to save notebook: {e}", RED), file=sys.stderr)
        return 1

    notebook_abs = os.path.abspath(os.path.expanduser(output_path))
    output_paths = [notebook_abs]
    for p in artifact_paths_from_tools:
        if p != notebook_abs and p not in output_paths:
            output_paths.append(p)

    _print_outputs_section(output_paths)

    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command != "run":
        parser.print_help()
        return 2
    return asyncio.run(_async_main(args))
