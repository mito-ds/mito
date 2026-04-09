# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Value types shared across the agent layer."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from mito_ai_core.completions.models import AIOptimizedCell, CellUpdate


@dataclass(frozen=True)
class ToolResult:
    """Outcome of a single tool execution.

    Every ToolExecutor method returns one of these so callers have a uniform
    way to inspect success/failure and any payload that came back.
    """

    success: bool
    """Whether the tool executed without errors."""

    error_message: Optional[str] = None
    """Human-readable error string when *success* is False."""

    cells: Optional[List[AIOptimizedCell]] = None
    """Snapshot of notebook cells after execution, if available."""

    variables: Optional[List[str]] = None
    """Variable names defined in the kernel after execution, if available."""

    output: Optional[str] = None
    """Captured stdout / rendered output (e.g. scratchpad print output,
    cell output text, base64-encoded image)."""

    extra: Dict[str, Any] = field(default_factory=dict)
    """Arbitrary payload a concrete executor may attach (e.g. new cell id)."""


@dataclass
class AgentContext:
    """Mutable snapshot of state the agent loop carries between turns.

    Platform adapters populate this before each LLM call so prompt builders
    and the tool executor share the same view of the world.
    """

    thread_id: str
    """Unique conversation thread identifier."""

    notebook_id: str
    """Opaque notebook / document identifier supplied by the platform."""

    notebook_path: str
    """File-system path (or URI) for the active notebook."""

    cells: List[AIOptimizedCell] = field(default_factory=list)
    """Current notebook cells (code + markdown)."""

    active_cell_id: str = ""
    """Cell the user's cursor is in."""

    variables: Optional[List[str]] = None
    """Variable names currently defined in the kernel."""

    files: Optional[List[str]] = None
    """File names in the working directory."""

    is_chrome_browser: bool = True
    """Whether the frontend is a Chrome-based browser (gates GET_CELL_OUTPUT)."""
