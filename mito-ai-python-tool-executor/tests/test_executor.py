import asyncio

from mito_ai_core.agent.types import AgentContext
from mito_ai_python_tool_executor.executor import (
    ASK_USER_QUESTION_DISABLED_MESSAGE,
    PythonToolExecutor,
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
