# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.completions.prompt_builders.agent_system_message import create_agent_system_message_prompt

def test_create_agent_system_message_prompt_browser_conditional() -> None:
    """
    Test that verifies the create_agent_system_message_prompt function produces different output
    based on the browser type.
    
    Specifically:
    - When isChromeBrowser=False, the prompt should NOT contain GET_CELL_OUTPUT
    - When isChromeBrowser=True, the prompt SHOULD contain GET_CELL_OUTPUT
    """
    # Test non-Chrome browser case
    non_chrome_prompt = create_agent_system_message_prompt(isChromeBrowser=False)
    assert "GET_CELL_OUTPUT" not in non_chrome_prompt, "Non-Chrome prompt should not contain GET_CELL_OUTPUT"
    
    # Test Chrome browser case
    chrome_prompt = create_agent_system_message_prompt(isChromeBrowser=True)
    assert "GET_CELL_OUTPUT" in chrome_prompt, "Chrome prompt should contain GET_CELL_OUTPUT"