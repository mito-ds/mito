# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Configuration for :class:`~mito_ai_core.agent.agent_runner.AgentRunner`."""

from __future__ import annotations

from dataclasses import dataclass

__all__ = ["AgentRunnerConfig"]


@dataclass(frozen=True)
class AgentRunnerConfig:
    """Feature flags for the agent loop.

    Parameters
    ----------
    enable_get_cell_output:
        When ``False``, the model is not told about ``GET_CELL_OUTPUT`` and any
        such tool response is rejected with an error tool result. Use ``False``
        for headless runners (e.g. Mito AI CLI). For JupyterLab, enable only in
        Chrome-based browsers where cell image capture is supported.
    """

    enable_get_cell_output: bool = True
