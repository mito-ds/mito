from __future__ import annotations

import traceback
from dataclasses import dataclass
from typing import List, Literal, Optional

from openai.types.chat import ChatCompletionMessageParam


@dataclass(frozen=True)
class AICapabilities:
    """AI provider capabilities"""

    configuration: dict
    """Configuration schema."""
    provider: str
    """AI provider name."""
    type: str = "ai_capabilities"
    """Message type."""


@dataclass(frozen=True)
class CompletionRequest:
    """Message send by the client to request an AI chat response."""

    type: Literal["chat", "inline_completion", "codeExplain", "smartDebug", "ai_capabilities"]
    """Message type."""
    message_id: str
    """Message UID generated by the client."""
    messages: list[ChatCompletionMessageParam]
    """Chat messages."""
    stream: bool = False
    """Whether to stream the response (if supported by the model)."""


@dataclass(frozen=True)
class CompletionItemError:
    """Completion item error information."""

    message: Optional[str] = None
    """Error message."""


@dataclass(frozen=True)
class CompletionItem:
    """A completion suggestion."""

    content: str
    """The completion."""
    isIncomplete: Optional[bool] = None
    """Whether the completion is incomplete or not."""
    token: Optional[str] = None
    """Unique token identifying the completion request in the frontend."""
    error: Optional[CompletionItemError] = None
    """Error information for the completion item."""


@dataclass(frozen=True)
class CompletionError:
    """Completion error description"""

    error_type: str
    """Error type"""
    title: str
    """Error title"""
    traceback: str
    """Error traceback"""
    hint: str = ""
    """Hint to resolve the error"""

    @staticmethod
    def from_exception(exception: BaseException, hint: str = "") -> CompletionError:
        """Create a completion error from an exception."""
        error_type = type(exception)
        error_module = getattr(error_type, "__module__", "")
        return CompletionError(
            error_type=f"{error_module}.{error_type.__name__}"
            if error_module
            else error_type.__name__,
            title=exception.body.get("message")
            if hasattr(exception, "body")
            else (exception.args[0] if exception.args else "Exception"),
            traceback=traceback.format_exc(),
            hint=hint,
        )


@dataclass(frozen=True)
class ErrorMessage(CompletionError):
    """Error message."""

    type: Literal["error"] = "error"
    """Message type."""


@dataclass(frozen=True)
class CompletionReply:
    """Message sent from model to client with the completion suggestions."""

    items: List[CompletionItem]
    """List of completion items."""
    parent_id: str
    """Parent message UID."""
    type: Literal["reply"] = "reply"
    """Message type."""
    error: Optional[CompletionError] = None
    """Completion error."""


@dataclass(frozen=True)
class CompletionStreamChunk:
    """Message sent from model to client with the infill suggestions"""

    chunk: CompletionItem
    """Completion item."""
    parent_id: str
    """Parent message UID."""
    done: bool
    """Whether the completion is done or not."""
    type: Literal["chunk"] = "chunk"
    """Message type."""
    error: Optional[CompletionError] = None
    """Completion error."""
