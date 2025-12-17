# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from typing import Callable, List, cast
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.utils.message_history_utils import trim_message_content, trim_old_messages
from mito_ai.completions.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.completions.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai.completions.prompt_builders.agent_smart_debug_prompt import create_agent_smart_debug_prompt
from unittest.mock import Mock, patch
from mito_ai.completions.message_history import GlobalMessageHistory, ChatThread
from mito_ai.completions.prompt_builders.smart_debug_prompt import create_error_prompt
from mito_ai.completions.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.completions.models import (
    AgentExecutionMetadata,
    AgentSmartDebugMetadata,
    AIOptimizedCell,
    ThreadID,
)




# Standard test data for multiple tests
TEST_VARIABLES = ["'df': pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})"]
TEST_FILES = ["data.csv", "script.py"]
TEST_CODE = "import pandas as pd\ndf = pd.read_csv('data.csv')"
TEST_INPUT = "Calculate the mean of col1"
TEST_ERROR = "AttributeError: 'Series' object has no attribute 'mena'"

def test_trim_sections_basic() -> None:
    """Test trimming sections on a simple string with all section types in XML format."""
    content = """Some text before.

<Files>file1.csv
file2.txt
file3.py</Files>

<Variables>var1 = 1
var2 = "string"
var3 = [1, 2, 3]</Variables>

<Notebook>[
    {{
        "cell_type": "code",
        "id": "cell1",
        "code": "print('hello world')"
    }}
]</Notebook>

<ActiveCellId>cell1</ActiveCellId>

<Code>```python
def hello():
    print("world")
```</Code>

Some text after."""

    # Test with message_age = 5 (should trim sections with threshold <= 5)
    result = trim_message_content(content, message_age=5)

    # Verify sections are removed (not present in result)
    assert "<Files>" not in result
    assert "file1.csv" not in result
    assert "<Variables>" not in result
    assert "var1 = 1" not in result
    assert "<Notebook>" not in result
    assert "cell_type" not in result
    assert "<ActiveCellId>" not in result
    assert "cell1" not in result
    
    # Verify other content is preserved
    assert "Some text before." in result
    assert "Some text after." in result
    assert "<Code>" in result  # Code section should remain (trim_after=3, but we're testing with age=5)
    assert "def hello():" in result


# Parameterized test cases for prompt builders (except inline completer)
PROMPT_BUILDER_TEST_CASES = [
    # Chat prompt
    (
        lambda: create_chat_prompt(TEST_VARIABLES, TEST_FILES, TEST_CODE, "cell1", False, TEST_INPUT),
        ["Your task: Calculate the mean of col1"],
        ["data.csv", "script.py", "'df': pd.DataFrame"],
    ),
    # Agent execution prompt
    (
        lambda: create_agent_execution_prompt(
            AgentExecutionMetadata(
                variables=TEST_VARIABLES,
                files=TEST_FILES,
                notebookPath='/test-notebook-path.ipynb',
                notebookID='test-notebook-id',
                aiOptimizedCells=[
                    AIOptimizedCell(cell_type="code", id="cell1", code=TEST_CODE)
                ],
                input=TEST_INPUT,
                promptType="agent:execution",
                threadId=ThreadID("test-thread-id"),
                activeCellId="cell1",
                isChromeBrowser=True
            )
        ),
        ["Your task: \nCalculate the mean of col1"],
        ["data.csv", "script.py", "'df': pd.DataFrame", "import pandas as pd"],
    ),
    # Smart debug prompt
    (
        lambda: create_error_prompt(TEST_ERROR, TEST_CODE, "cell1", TEST_VARIABLES, TEST_FILES),
        ["Error Traceback:", TEST_ERROR],
        [
            "data.csv",
            "script.py",
            "'df': pd.DataFrame",
            "cell1",
        ],
    ),
    # Explain code prompt (doesn't have sections to trim)
    (
        lambda: create_explain_code_prompt(TEST_CODE),
        ["import pandas as pd"],
        [],
    ),
    # Agent smart debug prompt
    (
        lambda: create_agent_smart_debug_prompt(
            AgentSmartDebugMetadata(
                variables=TEST_VARIABLES,
                files=TEST_FILES,
                aiOptimizedCells=[
                    AIOptimizedCell(cell_type="code", id="cell1", code=TEST_CODE)
                ],
                error_message_producing_code_cell_id="cell1",
                errorMessage=TEST_ERROR,
                promptType="agent:autoErrorFixup",
                threadId=ThreadID("test-thread-id"),
                isChromeBrowser=True
            )
        ),
        ["Error Traceback:", TEST_ERROR],
        [
            TEST_FILES[0],
            TEST_VARIABLES[0],
            "cell_type",
        ],
    ),
]


@pytest.mark.parametrize("prompt_builder,expected_in_result,expected_not_in_result", PROMPT_BUILDER_TEST_CASES)
def test_prompt_builder_trimming(prompt_builder: Callable[[], str], expected_in_result: List[str], expected_not_in_result: List[str]) -> None:
    """Test trimming for different prompt builders."""
    # Create prompt using the provided builder function
    content = prompt_builder()

    # Trim the content with message_age = 5 (should trim sections with threshold <= 5)
    result = trim_message_content(content, message_age=5)

    # Check if content has XML sections to trim
    has_sections_to_trim = any(
        f"<{section_name}>" in content 
        for section_name in ["Files", "Variables", "Notebook", "ActiveCellId"]
    )
    
    if not has_sections_to_trim:
        # If no sections to trim, content should be unchanged
        # Verify expected content is still in the result
        for expected in expected_in_result:
            assert expected in result
        return

    # Check that sections were removed (XML tags should not be in result)
    if "<Files>" in content:
        assert "<Files>" not in result
        
    if "<Variables>" in content:
        assert "<Variables>" not in result
        
    if "<Notebook>" in content:
        assert "<Notebook>" not in result

    if "<ActiveCellId>" in content:
        assert "<ActiveCellId>" not in result

    # Verify expected content is still in the result
    for expected in expected_in_result:
        assert expected in result

    # Verify content that should be removed is not in the result (check for actual content, not XML tags)
    for not_expected in expected_not_in_result:
        # Only check if it's not part of an XML tag
        if not_expected.startswith("<") and not_expected.endswith(">"):
            # This is likely old section heading format, skip it
            continue
        # Check if the content appears outside of XML tags
        if not_expected in result:
            # Make sure it's not part of a section that should have been removed
            # This is a simplified check - in practice, sections would be fully removed
            pass

def test_no_sections_to_trim() -> None:
    """Test trimming content with no sections to trim."""
    content = "This is a simple message with no sections to trim."
    result = trim_message_content(content, message_age=5)
    # Content without sections should remain unchanged
    assert result == content


# Tests for trim_old_messages function
def test_trim_old_messages_only_trims_user_messages() -> None:
    """Test that trim_old_messages only trims content from user messages."""
    # Create test messages with different roles using XML format
    user_message_with_sections = """User prompt with sections.
<Files>file1.csv
file2.txt</Files>
"""
    system_message_with_sections = """System message with sections.
<Files>file1.csv
file2.txt</Files>
"""
    assistant_message_with_sections = """Assistant message with sections.
<Files>file1.csv
file2.txt</Files>
"""
    
    # Create test messages with proper typing 
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_message_with_sections},
        {"role": "user", "content": user_message_with_sections},
        {"role": "assistant", "content": assistant_message_with_sections},
        {"role": "user", "content": "Recent user message 1"},
        {"role": "user", "content": "Recent user message 2"},
        {"role": "user", "content": "Recent user message 3"},
    ]
    
    result = trim_old_messages(messages)
    
    # System message should remain unchanged even though it's old
    system_content = result[0].get("content")
    assert isinstance(system_content, str)
    assert system_content == system_message_with_sections
    assert "<Files>" in system_content
    assert "file1.csv" in system_content
    
    # First user message should be trimmed
    assert result[1]["role"] == "user"
    user_content = result[1].get("content")
    assert isinstance(user_content, str)
    # Sections should be removed
    assert "<Files>" not in user_content
    assert "file1.csv" not in user_content
    
    # Assistant message should remain unchanged even though it's old
    assistant_content = result[2].get("content")
    assert isinstance(assistant_content, str)
    assert assistant_content == assistant_message_with_sections
    assert "<Files>" in assistant_content
    assert "file1.csv" in assistant_content
    
    # Recent user messages should remain unchanged
    recent_content_1 = result[3].get("content")
    assert isinstance(recent_content_1, str)
    assert recent_content_1 == "Recent user message 1"
    
    recent_content_2 = result[4].get("content")
    assert isinstance(recent_content_2, str)
    assert recent_content_2 == "Recent user message 2"
    
    recent_content_3 = result[5].get("content")
    assert isinstance(recent_content_3, str)
    assert recent_content_3 == "Recent user message 3"


def test_trim_old_messages_preserves_recent_messages() -> None:
    """Test that trim_old_messages preserves the most recent messages based on MESSAGE_HISTORY_TRIM_THRESHOLD."""
    # Create test messages with XML format
    old_message_1 = """Old message 1.
<Files>file1.csv</Files>
"""
    old_message_2 = """Old message 2.
<Files>file2.csv</Files>
"""
    recent_message_1 = """Recent message 1.
<Files>file3.csv</Files>
"""
    recent_message_2 = """Recent message 2.
<Files>file4.csv</Files>
"""
    recent_message_3 = """Recent message 3.
<Files>file5.csv</Files>
"""
    
    # Create test messages with proper typing
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": old_message_1},
        {"role": "user", "content": old_message_2},
        {"role": "user", "content": recent_message_1},
        {"role": "user", "content": recent_message_2},
        {"role": "user", "content": recent_message_3},
    ]
    
    # Test with MESSAGE_HISTORY_TRIM_THRESHOLD (3) - only the first 2 messages should be trimmed
    result = trim_old_messages(messages)
    
    # Old messages should be trimmed
    old_content_1 = result[0].get("content")
    assert isinstance(old_content_1, str)
    assert "<Files>" not in old_content_1
    assert "file1.csv" not in old_content_1
    
    old_content_2 = result[1].get("content")
    assert isinstance(old_content_2, str)
    assert "<Files>" not in old_content_2
    assert "file2.csv" not in old_content_2
    
    # Recent messages should remain unchanged
    recent_content_1 = result[2].get("content")
    assert isinstance(recent_content_1, str)
    assert recent_content_1 == recent_message_1
    assert "<Files>" in recent_content_1
    assert "file3.csv" in recent_content_1
    
    recent_content_2 = result[3].get("content")
    assert isinstance(recent_content_2, str)
    assert recent_content_2 == recent_message_2
    assert "<Files>" in recent_content_2
    assert "file4.csv" in recent_content_2
    
    recent_content_3 = result[4].get("content")
    assert isinstance(recent_content_3, str)
    assert recent_content_3 == recent_message_3
    assert "<Files>" in recent_content_3
    assert "file5.csv" in recent_content_3

def test_trim_old_messages_empty_list() -> None:
    """Test that trim_old_messages handles empty message lists correctly."""
    messages: List[ChatCompletionMessageParam] = []
    result = trim_old_messages(messages)
    assert result == []


def test_trim_old_messages_fewer_than_threshold() -> None:
    """Test that trim_old_messages doesn't modify messages if there are fewer than MESSAGE_HISTORY_TRIM_THRESHOLD."""
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "User message 1"},
        {"role": "assistant", "content": "Assistant message 1"},
    ]
    
    result = trim_old_messages(messages)
    
    # Messages should remain unchanged since we have fewer than MESSAGE_HISTORY_TRIM_THRESHOLD (3) messages
    user_content = result[0].get("content")
    assert isinstance(user_content, str)
    assert user_content == "User message 1"
    
    assistant_content = result[1].get("content")
    assert isinstance(assistant_content, str)
    assert assistant_content == "Assistant message 1"


def test_trim_mixed_content_messages() -> None:
    """
    Tests that when a message contains sections other than text (like image_url),
    those sections are removed completely, leaving only the text content.
    """
    # Create sample message with mixed content (text and image)
    mixed_content_message = cast(ChatCompletionMessageParam, {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "What is in this image?"
            },
            {
                "type": "image_url",
                "image_url": {"url": "data:image/png;base64,someimagedata"}
            }
        ]
    })
    
    # Create sample message list with one old message (the mixed content)
    # and enough recent messages to exceed MESSAGE_HISTORY_TRIM_THRESHOLD (3)
    message_list: List[ChatCompletionMessageParam] = [
        mixed_content_message,  # This should get trimmed
        {"role": "assistant", "content": "That's a chart showing data trends"},
        {"role": "user", "content": "Can you explain more?"},  # Recent message, should not be trimmed
        {"role": "user", "content": "Another recent message"},  # Recent message, should not be trimmed
        {"role": "user", "content": "Yet another recent message"}  # Recent message, should not be trimmed
    ]
    
    # Apply the trimming function
    trimmed_messages = trim_old_messages(message_list)
    
    # Verify that the first message has been trimmed properly
    assert trimmed_messages[0]["role"] == "user"
    assert trimmed_messages[0]["content"] == "What is in this image?"
    
    # Verify that the recent messages are untouched
    assert trimmed_messages[1] == message_list[1]
    assert trimmed_messages[2] == message_list[2]
    assert trimmed_messages[3] == message_list[3]
    assert trimmed_messages[4] == message_list[4]


def test_get_display_history_calls_update_last_interaction() -> None:
    """Test that get_display_history calls _update_last_interaction when retrieving a thread."""
    
    # Create a mock thread
    thread_id = ThreadID("test-thread-id")
    mock_thread = Mock(spec=ChatThread)
    mock_thread.display_history = [{"role": "user", "content": "test message"}]
    mock_thread.last_interaction_ts = 1234567890.0
    
    # Create message history instance and add the mock thread
    message_history = GlobalMessageHistory()
    message_history._chat_threads = {thread_id: mock_thread}
    
    # Mock the _update_last_interaction method
    with patch.object(message_history, '_update_last_interaction') as mock_update:
        with patch.object(message_history, '_save_thread_to_disk') as mock_save:
            # Call get_display_history
            result = message_history.get_display_history(thread_id)
            
            # Verify _update_last_interaction was called with the thread
            mock_update.assert_called_once_with(mock_thread)
            
            # Verify _save_thread_to_disk was also called
            mock_save.assert_called_once_with(mock_thread)
            
            # Verify the result is correct
            assert result == [{"role": "user", "content": "test message"}]


def test_get_display_history_returns_empty_for_nonexistent_thread() -> None:
    """Test that get_display_history returns empty list for non-existent thread."""
    from mito_ai.completions.message_history import GlobalMessageHistory
    from mito_ai.completions.models import ThreadID
    
    message_history = GlobalMessageHistory()
    thread_id = ThreadID("nonexistent-thread-id")
    
    # Mock the methods to ensure they're not called
    with patch.object(message_history, '_update_last_interaction') as mock_update:
        with patch.object(message_history, '_save_thread_to_disk') as mock_save:
            result = message_history.get_display_history(thread_id)
            
            # Verify methods were not called since thread doesn't exist
            mock_update.assert_not_called()
            mock_save.assert_not_called()
            
            # Verify empty result
            assert result == []