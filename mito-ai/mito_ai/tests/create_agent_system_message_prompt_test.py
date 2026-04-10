# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.completions.prompt_builders.agent_system_message import create_agent_system_message_prompt

def test_create_agent_system_message_prompt_browser_conditional() -> None:
    """
    Test that verifies the create_agent_system_message_prompt function produces different output
    based on whether cell output / GET_CELL_OUTPUT is enabled (Chrome + non-Copilot).
    
    Specifically:
    - When include_cell_output_tool=False, the prompt should NOT contain GET_CELL_OUTPUT
    - When include_cell_output_tool=True, the prompt SHOULD contain GET_CELL_OUTPUT
    """
    # Disabled (non-Chrome or Copilot mode)
    disabled_prompt = create_agent_system_message_prompt(include_cell_output_tool=False)
    assert "GET_CELL_OUTPUT" not in disabled_prompt, "Disabled prompt should not contain GET_CELL_OUTPUT"
    
    # Enabled (Chrome and not Copilot)
    enabled_prompt = create_agent_system_message_prompt(include_cell_output_tool=True)
    assert "GET_CELL_OUTPUT" in enabled_prompt, "Enabled prompt should contain GET_CELL_OUTPUT"