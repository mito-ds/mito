# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from typing import Callable, List, cast
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.utils.message_history_utils import trim_sections_from_message_content, trim_old_messages
from mito_ai.completions.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.completions.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai.completions.prompt_builders.agent_smart_debug_prompt import (
    create_agent_smart_debug_prompt,
)
from mito_ai.completions.prompt_builders.smart_debug_prompt import create_error_prompt
from mito_ai.completions.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.completions.models import (
    AgentExecutionMetadata,
    AgentSmartDebugMetadata,
    AIOptimizedCell,
    ThreadID,
)
from mito_ai.completions.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING,
    ACTIVE_CELL_ID_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    CONTENT_REMOVED_PLACEHOLDER,
)

# Standard test data for multiple tests
TEST_VARIABLES = ["'df': pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})"]
TEST_FILES = ["data.csv", "script.py"]
TEST_CODE = "import pandas as pd\ndf = pd.read_csv('data.csv')"
TEST_INPUT = "Calculate the mean of col1"
TEST_ERROR = "AttributeError: 'Series' object has no attribute 'mena'"

def test_trim_sections_basic() -> None:
    """Test trimming sections on a simple string with all section types."""
    content = f"""Some text before.

{FILES_SECTION_HEADING}
file1.csv
file2.txt
file3.py

{VARIABLES_SECTION_HEADING}
var1 = 1
var2 = "string"
var3 = [1, 2, 3]

{JUPYTER_NOTEBOOK_SECTION_HEADING}
[
    {{
        "cell_type": "code",
        "id": "cell1",
        "code": "print('hello world')"
    }}
]

{ACTIVE_CELL_ID_SECTION_HEADING}
cell1

{CODE_SECTION_HEADING}
```python
def hello():
    print("world")
```

Some text after."""

    result = trim_sections_from_message_content(content)

    # Verify sections are replaced with placeholders
    assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
    assert f"{VARIABLES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
    assert f"{JUPYTER_NOTEBOOK_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
    assert f"{ACTIVE_CELL_ID_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
    
    # Verify sections are not in the result anymore
    assert "file1.csv" not in result
    assert "var1 = 1" not in result
    assert "cell_type" not in result
    assert "cell1" not in result
    
    # Verify other content is preserved
    assert "Some text before." in result
    assert "Some text after." in result
    assert f"{CODE_SECTION_HEADING}" in result
    assert "def hello():" in result


# Parameterized test cases for prompt builders (except inline completer)
PROMPT_BUILDER_TEST_CASES = [
    # Chat prompt
    (
        lambda: create_chat_prompt(TEST_VARIABLES, TEST_FILES, TEST_CODE, "cell1", False, TEST_INPUT),
        ["Your task: Calculate the mean of col1"],
        ["data.csv\nscript.py", f"{VARIABLES_SECTION_HEADING}\n'df': pd.DataFrame"],
    ),
    # Agent execution prompt
    (
        lambda: create_agent_execution_prompt(
            AgentExecutionMetadata(
                variables=TEST_VARIABLES,
                files=TEST_FILES,
                aiOptimizedCells=[
                    AIOptimizedCell(cell_type="code", id="cell1", code=TEST_CODE)
                ],
                input=TEST_INPUT,
                promptType="agent:execution",
                threadId=ThreadID("test-thread-id"),
                isChromeBrowser=True
            )
        ),
        ["Your task: \nCalculate the mean of col1"],
        ["data.csv\nscript.py", f"'df': pd.DataFrame", "import pandas as pd"],
    ),
    # Smart debug prompt
    (
        lambda: create_error_prompt(TEST_ERROR, TEST_CODE, "cell1", TEST_VARIABLES, TEST_FILES),
        ["Error Traceback:", TEST_ERROR],
        [
            f"{FILES_SECTION_HEADING}\ndata.csv\nscript.py",
            f"{VARIABLES_SECTION_HEADING}\n'df': pd.DataFrame",
            f"{ACTIVE_CELL_ID_SECTION_HEADING}\ncell1",
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
            f"{FILES_SECTION_HEADING}\n{TEST_FILES[0]}",
            f"{VARIABLES_SECTION_HEADING}\n{TEST_VARIABLES[0]}",
            "cell_type",
        ],
    ),
]


@pytest.mark.parametrize("prompt_builder,expected_in_result,expected_not_in_result", PROMPT_BUILDER_TEST_CASES)
def test_prompt_builder_trimming(prompt_builder: Callable[[], str], expected_in_result: List[str], expected_not_in_result: List[str]) -> None:
    """Test trimming for different prompt builders."""
    # Create prompt using the provided builder function
    content = prompt_builder()

    # Trim the content
    result = trim_sections_from_message_content(content)

    # If none of the section headings are present, the content shouldn't change
    has_sections_to_trim = any(
        heading in content 
        for heading in [FILES_SECTION_HEADING, VARIABLES_SECTION_HEADING, JUPYTER_NOTEBOOK_SECTION_HEADING, ACTIVE_CELL_ID_SECTION_HEADING]
    )
    
    if not has_sections_to_trim:
        assert result == content
        # Verify expected content is still in the result
        for expected in expected_in_result:
            assert expected in result
        return

    # Check for each section if it was present in the original content
    if FILES_SECTION_HEADING in content:
        assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
        
    if VARIABLES_SECTION_HEADING in content:
        assert f"{VARIABLES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result
        
    if JUPYTER_NOTEBOOK_SECTION_HEADING in content:
        assert (
            f"{JUPYTER_NOTEBOOK_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}"
            in result
        )

    if ACTIVE_CELL_ID_SECTION_HEADING in content:
        assert f"{ACTIVE_CELL_ID_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in result

    # Verify expected content is still in the result
    for expected in expected_in_result:
        assert expected in result

    # Verify content that should be removed is not in the result
    for not_expected in expected_not_in_result:
        assert not_expected not in result

def test_no_sections_to_trim() -> None:
    """Test trimming content with no sections to trim."""
    content = "This is a simple message with no sections to trim."
    result = trim_sections_from_message_content(content)
    assert result == content


# Tests for trim_old_messages function
def test_trim_old_messages_only_trims_user_messages() -> None:
    """Test that trim_old_messages only trims content from user messages."""
    # Create test messages with different roles
    user_message_with_sections = f"""User prompt with sections.
{FILES_SECTION_HEADING}
file1.csv
file2.txt
"""
    system_message_with_sections = f"""System message with sections.
{FILES_SECTION_HEADING}
file1.csv
file2.txt
"""
    assistant_message_with_sections = f"""Assistant message with sections.
{FILES_SECTION_HEADING}
file1.csv
file2.txt
"""
    
    # Create test messages with proper typing
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_message_with_sections},
        {"role": "user", "content": user_message_with_sections},
        {"role": "assistant", "content": assistant_message_with_sections},
        {"role": "user", "content": "Recent user message"},
    ]
    
    # Keep only the most recent message
    result = trim_old_messages(messages, keep_recent=1)
    
    # System message should remain unchanged even though it's old
    system_content = result[0].get("content")
    assert isinstance(system_content, str)
    assert system_content == system_message_with_sections
    assert FILES_SECTION_HEADING in system_content
    assert "file1.csv" in system_content
    
    # First user message should be trimmed
    assert result[1]["role"] == "user"
    user_content = result[1].get("content")
    assert isinstance(user_content, str)
    assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in user_content
    assert "file1.csv" not in user_content
    
    # Assistant message should remain unchanged even though it's old
    assistant_content = result[2].get("content")
    assert isinstance(assistant_content, str)
    assert assistant_content == assistant_message_with_sections
    assert FILES_SECTION_HEADING in assistant_content
    assert "file1.csv" in assistant_content
    
    # Recent user message should remain unchanged
    recent_content = result[3].get("content")
    assert isinstance(recent_content, str)
    assert recent_content == "Recent user message"


def test_trim_old_messages_preserves_recent_messages() -> None:
    """Test that trim_old_messages preserves the most recent messages based on keep_recent parameter."""
    # Create test messages
    old_message_1 = f"""Old message 1.
{FILES_SECTION_HEADING}
file1.csv
"""
    old_message_2 = f"""Old message 2.
{FILES_SECTION_HEADING}
file2.csv
"""
    recent_message_1 = f"""Recent message 1.
{FILES_SECTION_HEADING}
file3.csv
"""
    recent_message_2 = f"""Recent message 2.
{FILES_SECTION_HEADING}
file4.csv
"""
    
    # Create test messages with proper typing
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": old_message_1},
        {"role": "user", "content": old_message_2},
        {"role": "user", "content": recent_message_1},
        {"role": "user", "content": recent_message_2},
    ]
    
    # Keep the 2 most recent messages
    result = trim_old_messages(messages, keep_recent=2)
    
    # Old messages should be trimmed
    old_content_1 = result[0].get("content")
    assert isinstance(old_content_1, str)
    assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in old_content_1
    assert "file1.csv" not in old_content_1
    
    old_content_2 = result[1].get("content")
    assert isinstance(old_content_2, str)
    assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in old_content_2
    assert "file2.csv" not in old_content_2
    
    # Recent messages should remain unchanged
    recent_content_1 = result[2].get("content")
    assert isinstance(recent_content_1, str)
    assert recent_content_1 == recent_message_1
    assert FILES_SECTION_HEADING in recent_content_1
    assert "file3.csv" in recent_content_1
    
    recent_content_2 = result[3].get("content")
    assert isinstance(recent_content_2, str)
    assert recent_content_2 == recent_message_2
    assert FILES_SECTION_HEADING in recent_content_2
    assert "file4.csv" in recent_content_2

def test_trim_old_messages_empty_list() -> None:
    """Test that trim_old_messages handles empty message lists correctly."""
    messages: List[ChatCompletionMessageParam] = []
    result = trim_old_messages(messages, keep_recent=2)
    assert result == []


def test_trim_old_messages_fewer_than_keep_recent() -> None:
    """Test that trim_old_messages doesn't modify messages if there are fewer than keep_recent."""
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "User message 1"},
        {"role": "assistant", "content": "Assistant message 1"},
    ]
    
    result = trim_old_messages(messages, keep_recent=3)
    
    # Messages should remain unchanged
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
    # and one recent message (to not be trimmed)
    message_list: List[ChatCompletionMessageParam] = [
        mixed_content_message,  # This should get trimmed
        {"role": "assistant", "content": "That's a chart showing data trends"},
        {"role": "user", "content": "Can you explain more?"}  # Recent message, should not be trimmed
    ]
    
    # Apply the trimming function
    trimmed_messages = trim_old_messages(message_list, keep_recent=2)
    
    # Verify that the first message has been trimmed properly
    assert trimmed_messages[0]["role"] == "user"
    assert trimmed_messages[0]["content"] == "What is in this image?"
    
    # Verify that the recent messages are untouched
    assert trimmed_messages[1] == message_list[1]
    assert trimmed_messages[2] == message_list[2]