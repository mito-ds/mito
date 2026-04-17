import asyncio

import pytest

from mito_ai_core.agent.types import AgentContext
from mito_ai_python_tool_executor import executor as executor_module
from mito_ai_python_tool_executor.executor import (
    ASK_USER_QUESTION_DISABLED_MESSAGE,
    PythonToolExecutor,
    STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE,
)


class _FakeSession:
    def fetch_variables(self):
        return []


def _build_context() -> AgentContext:
    return AgentContext(
        thread_id="thread-id",
        notebook_id="notebook-id",
        notebook_path="notebook-path.ipynb",
        is_chrome_browser=False,
    )


def test_ask_user_question_plaintext_mode_returns_disabled_message() -> None:
    executor = PythonToolExecutor(ask_user_mode="mcp_plaintext")
    executor._ensure_session = lambda: _FakeSession()  # type: ignore[method-assign]
    ctx = _build_context()

    result = asyncio.run(
        executor.ask_user_question(
            ctx,
            question="How should I proceed?",
            message="Need clarification",
            answers=["Option A", "Option B"],
        )
    )

    assert result.success is True
    assert result.tool_name == "ask_user_question"
    assert result.output == ASK_USER_QUESTION_DISABLED_MESSAGE


def test_executor_forwards_kernel_cwd_when_starting_session(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, str | None] = {"cwd": None}

    class _KernelSessionStub:
        def __init__(self, *, cwd: str | None = None) -> None:
            captured["cwd"] = cwd

    monkeypatch.setattr(executor_module, "KernelSession", _KernelSessionStub)

    executor = PythonToolExecutor(kernel_cwd="/tmp/mcp-root")
    executor._ensure_session()

    assert captured["cwd"] == "/tmp/mcp-root"


def test_ask_user_question_elicitation_without_handler_falls_back_to_disabled_message() -> None:
    executor = PythonToolExecutor(ask_user_mode="mcp_elicitation", ask_user_handler=None)
    executor._ensure_session = lambda: _FakeSession()  # type: ignore[method-assign]
    ctx = _build_context()

    result = asyncio.run(
        executor.ask_user_question(
            ctx,
            question="What would you like to do?",
            message="Need user input",
            answers=["Proceed", "Cancel"],
        )
    )

    assert result.success is True
    assert result.tool_name == "ask_user_question"
    assert result.output == ASK_USER_QUESTION_DISABLED_MESSAGE
    assert result.error_message is None


def test_ask_user_question_elicitation_exception_falls_back_to_disabled_message() -> None:
    async def _failing_handler(question: str, answers: list[str] | None) -> str:
        del question, answers
        raise RuntimeError("elicitation transport failed")

    executor = PythonToolExecutor(
        ask_user_mode="mcp_elicitation",
        ask_user_handler=_failing_handler,
    )
    executor._ensure_session = lambda: _FakeSession()  # type: ignore[method-assign]
    ctx = _build_context()

    result = asyncio.run(
        executor.ask_user_question(
            ctx,
            question="Pick one",
            message="Need user input",
            answers=["A", "B"],
        )
    )

    assert result.success is True
    assert result.tool_name == "ask_user_question"
    assert result.output == ASK_USER_QUESTION_DISABLED_MESSAGE
    assert result.error_message is None


def test_create_streamlit_app_returns_not_implemented_message() -> None:
    executor = PythonToolExecutor()
    executor._ensure_session = lambda: _FakeSession()  # type: ignore[method-assign]
    ctx = _build_context()

    result = asyncio.run(
        executor.create_streamlit_app(
            ctx,
            message="Create a streamlit app",
            streamlit_app_prompt="Simple dashboard",
        )
    )

    assert result.success is True
    assert result.tool_name == "create_streamlit_app"
    assert result.output == STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE
    assert result.error_message is None


def test_edit_streamlit_app_returns_not_implemented_message() -> None:
    executor = PythonToolExecutor()
    executor._ensure_session = lambda: _FakeSession()  # type: ignore[method-assign]
    ctx = _build_context()

    result = asyncio.run(
        executor.edit_streamlit_app(
            ctx,
            streamlit_app_prompt="Add date filters",
            message="Edit the streamlit app",
        )
    )

    assert result.success is True
    assert result.tool_name == "edit_streamlit_app"
    assert result.output == STREAMLIT_FUNCTIONALITY_DISABLED_MESSAGE
    assert result.error_message is None
