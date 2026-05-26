# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import pytest
from typing import List, cast
from openai.types.chat import ChatCompletionMessageParam
from mito_ai_core.utils.trim_message_history import trim_message_content, trim_old_messages
from unittest.mock import Mock, patch
from mito_ai_core.completions.message_history import GlobalMessageHistory, ChatThread
from mito_ai_core.completions.models import ThreadID
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


# Tests for trim_message_content function

def test_trim_message_content_removes_sections_based_on_threshold() -> None:
    """Test that sections are removed when message_age >= trim_after_messages threshold."""
    # FilesSection has trim_after_messages = 3
    # VariablesSection has trim_after_messages = 6
    # NotebookSection has trim_after_messages = 6
    
    content = """Some text before.

<Files>file1.csv
file2.txt</Files>

<Variables>var1 = 1
var2 = "string"</Variables>

<Notebook>[
    {{"cell_type": "code", "id": "cell1"}}
]</Notebook>

Some text after."""

    # Test with message_age = 2 (should NOT trim Files, Variables, or Notebook)
    result = trim_message_content(content, message_age=2)
    assert "<Files>" in result
    assert "file1.csv" in result
    assert "<Variables>" in result
    assert "var1 = 1" in result
    assert "<Notebook>" in result
    assert "cell_type" in result
    
    # Test with message_age = 3 (should trim Files, but NOT Variables or Notebook)
    result = trim_message_content(content, message_age=3)
    assert "<Files>" not in result
    assert "file1.csv" not in result
    assert "<Variables>" in result
    assert "var1 = 1" in result
    assert "<Notebook>" in result
    assert "cell_type" in result
    
    # Test with message_age = 6 (should trim Files, Variables, and Notebook)
    result = trim_message_content(content, message_age=6)
    assert "<Files>" not in result
    assert "file1.csv" not in result
    assert "<Variables>" not in result
    assert "var1 = 1" not in result
    assert "<Notebook>" not in result
    assert "cell_type" not in result
    
    # Verify other content is preserved
    assert "Some text before." in result
    assert "Some text after." in result


def test_trim_message_content_removes_nested_xml_tags() -> None:
    """Test that trimming correctly removes nested XML tags within a section."""
    # ExampleSection can contain nested XML tags like <Files> and <Variables>
    # ExampleSection has trim_after_messages = 3
    
    content = """Some text before.

<Example name="Example 1">
<Files>file1.csv
file2.txt</Files>
<Variables>var1 = 1</Variables>
Some example text here.
</Example>

Some text after."""

    # Test with message_age = 2 (should NOT trim Example)
    result = trim_message_content(content, message_age=2)
    assert "<Example" in result
    assert "file1.csv" in result
    assert "<Variables>" in result
    assert "var1 = 1" in result
    
    # Test with message_age = 3 (should trim entire Example including nested tags)
    result = trim_message_content(content, message_age=3)
    assert "<Example" not in result
    assert "file1.csv" not in result
    assert "<Variables>" not in result
    assert "var1 = 1" not in result
    assert "Some example text here." not in result
    
    # Verify other content is preserved
    assert "Some text before." in result
    assert "Some text after." in result


def test_trim_message_content_handles_multiple_sections_of_same_type() -> None:
    """Test that all instances of a section type are removed when threshold is met."""
    content = """Text before.

<Files>file1.csv</Files>

Some middle text.

<Files>file2.txt
file3.py</Files>

Text after."""

    # Test with message_age = 3 (should remove all Files sections)
    result = trim_message_content(content, message_age=3)
    assert "<Files>" not in result
    assert "file1.csv" not in result
    assert "file2.txt" not in result
    assert "file3.py" not in result
    
    # Verify other content is preserved
    assert "Text before." in result
    assert "Some middle text." in result
    assert "Text after." in result


def test_trim_message_content_preserves_sections_with_none_threshold() -> None:
    """Test that sections with trim_after_messages = None are never trimmed."""
    # TaskSection has trim_after_messages = None
    # RulesSection has trim_after_messages = None
    
    content = """Some text.

<Task>Your task: Do something</Task>

<Rules>Always be concise.</Rules>

<Files>file1.csv</Files>

More text."""

    # Test with very high message_age
    result = trim_message_content(content, message_age=100)
    
    # Task and Rules should remain (threshold = None)
    assert "<Task>" in result
    assert "Your task: Do something" in result
    assert "<Rules>" in result
    assert "Always be concise." in result
    
    # Files should be removed (threshold = 3)
    assert "<Files>" not in result
    assert "file1.csv" not in result


def test_trim_message_content_handles_empty_content() -> None:
    """Test that trimming handles empty content correctly."""
    content = ""
    result = trim_message_content(content, message_age=5)
    assert result == ""


def test_trim_message_content_uses_declared_trim_tag_names() -> None:
    """Test that trimming uses the section's rendered tag name, not its class name."""

    RuntimeNamedSection = type(
        "RuntimeNamedSection",
        (),
        {
            "trim_after_messages": 3,
            "get_trim_tag_names": classmethod(lambda cls: ["Reminder"]),
        },
    )

    content = """Before text.

<Reminder>Remember to choose the correct tool to respond with.</Reminder>

After text."""

    with patch(
        "mito_ai_core.utils.trim_message_history.get_all_section_classes",
        return_value=[RuntimeNamedSection],
    ):
        result = trim_message_content(content, message_age=3)

    assert "<Reminder>" not in result
    assert "Remember to choose the correct tool" not in result
    assert "Before text." in result
    assert "After text." in result


def test_trim_message_content_trims_ephemeral_sections_aggressively() -> None:
    """Test that short-lived execution context is trimmed quickly."""

    content = """Before text.

<Reminder>Remember to choose the correct tool to respond with.</Reminder>

<StreamlitAppStatus>The notebook does not have an existing Streamlit app.</StreamlitAppStatus>

<ActiveCellId>active-cell-123</ActiveCellId>

<SelectedContext>The user selected rows 1-5.</SelectedContext>

<Task>Continue working on the user's task until you have finished</Task>

After text."""

    # At age 1, turn-local reminders/state should be trimmed, but selected context survives
    result = trim_message_content(content, message_age=1)
    assert "<Reminder>" not in result
    assert "<StreamlitAppStatus>" not in result
    assert "<ActiveCellId>" not in result
    assert "<SelectedContext>" in result
    assert "<Task>" in result

    # At age 2, selected context should also be trimmed
    result = trim_message_content(content, message_age=2)
    assert "<Reminder>" not in result
    assert "<StreamlitAppStatus>" not in result
    assert "<ActiveCellId>" not in result
    assert "<SelectedContext>" not in result
    assert "<Task>" in result
    assert "After text." in result


def test_trim_message_content_summarizes_variables_before_removing_them() -> None:
    """Test that older Variables sections keep names/types and cheap scalar values."""
    content = """Before text.

<Variables>
[
  {"name": "df", "type": "pd.DataFrame", "value": {"rows": 10}},
  {"name": "threshold", "type": "int", "value": 5},
  {"name": "flag", "type": "bool", "value": true},
  {"name": "optional", "type": "NoneType", "value": null},
  {"name": "label", "type": "str", "value": "short label"},
  {"name": "module", "type": "module", "value": "<module 'pandas' from '/tmp/pandas.py'>"},
  {"name": "long_text", "type": "str", "value": "This string is intentionally long enough to be dropped from the summarized variables payload."}
]
</Variables>

After text."""

    # Fresh messages keep the full variables payload
    result = trim_message_content(content, message_age=2)
    variables_payload = result.split("<Variables>", 1)[1].split("</Variables>", 1)[0].strip()
    assert json.loads(variables_payload)[0]["value"] == {"rows": 10}

    # Older messages summarize bulky values but preserve cheap scalars
    result = trim_message_content(content, message_age=3)
    assert "<Variables>" in result
    variables_payload = result.split("<Variables>", 1)[1].split("</Variables>", 1)[0].strip()
    assert json.loads(variables_payload) == [
        {"name": "df", "type": "pd.DataFrame"},
        {"name": "threshold", "type": "int", "value": 5},
        {"name": "flag", "type": "bool", "value": True},
        {"name": "optional", "type": "NoneType", "value": None},
        {"name": "label", "type": "str", "value": "short label"},
        {"name": "module", "type": "module"},
        {"name": "long_text", "type": "str"},
    ]

    # Very old messages still drop the Variables section entirely
    result = trim_message_content(content, message_age=6)
    assert "<Variables>" not in result
    assert "threshold" not in result


def test_trim_message_content_summarizes_notebook_before_removing_it() -> None:
    """Test that older Notebook sections keep structure and truncated previews."""
    notebook_content = """Each cell's "index" is its position from the top of the notebook: 0 = first cell at the top of the notebook, then 1, 2, ... (lower index = earlier in the notebook).

[
  {
    "index": 0,
    "id": "cell-1",
    "cell_type": "code",
    "content": "import pandas as pd\\nlong_variable_name = 'This code cell is intentionally long enough that the summarized notebook view should truncate it after a short preview.'"
  },
  {
    "index": 1,
    "id": "cell-2",
    "cell_type": "markdown",
    "content": "  # Report Title  "
  },
  {
    "index": 2,
    "id": "cell-3",
    "cell_type": "code",
    "content": ""
  }
]
"""
    content = f"""Before text.

<Notebook>
{notebook_content}</Notebook>

After text."""

    # Fresh messages keep the full notebook payload
    result = trim_message_content(content, message_age=2)
    notebook_payload = result.split("<Notebook>", 1)[1].split("</Notebook>", 1)[0].strip()
    assert "long_variable_name" in notebook_payload
    assert '"content": "  # Report Title  "' in notebook_payload

    # Older messages summarize bulky cell bodies but keep notebook structure
    result = trim_message_content(content, message_age=3)
    assert "<Notebook>" in result
    notebook_payload = result.split("<Notebook>", 1)[1].split("</Notebook>", 1)[0].strip()
    notebook_prefix, notebook_json = notebook_payload.split("\n\n", 1)
    assert notebook_prefix.startswith('Each cell\'s "index" is its position from the top of the notebook:')
    summarized_cells = json.loads(notebook_json)
    assert summarized_cells[0]["index"] == 0
    assert summarized_cells[0]["id"] == "cell-1"
    assert summarized_cells[0]["cell_type"] == "code"
    assert summarized_cells[0]["content"].startswith("import pandas as pd\nlong_variable_name =")
    assert summarized_cells[0]["content"].endswith("...")
    assert "truncate it after a short preview" not in summarized_cells[0]["content"]
    assert summarized_cells[1] == {
        "index": 1,
        "id": "cell-2",
        "cell_type": "markdown",
        "content": "# Report Title",
    }
    assert summarized_cells[2] == {
        "index": 2,
        "id": "cell-3",
        "cell_type": "code",
        "content": "",
    }

    # Very old messages still drop the Notebook section entirely
    result = trim_message_content(content, message_age=6)
    assert "<Notebook>" not in result
    assert "cell-1" not in result


def test_trim_message_content_handles_content_without_sections() -> None:
    """Test that trimming preserves content without XML sections."""
    content = "This is a simple message with no sections to trim."
    result = trim_message_content(content, message_age=5)
    assert result == content


def test_trim_message_content_handles_malformed_xml_gracefully() -> None:
    """Test that trimming handles malformed XML gracefully."""
    # Content with unclosed tags or mismatched tags
    content = """Some text.

<Files>file1.csv
<Variables>var1 = 1</Variables>

More text."""

    # Should not crash, and should attempt to trim what it can
    result = trim_message_content(content, message_age=3)
    # The behavior depends on regex matching, but should not raise an exception
    assert isinstance(result, str)


# Tests for trim_old_messages function

def test_trim_old_messages_calculates_message_age_correctly() -> None:
    """Test that message age is calculated correctly based on position in message list."""
    # Message age = total_messages - i - 1
    # So for a list of 5 messages (indices 0-4):
    # - Index 0 (oldest): age = 5 - 0 - 1 = 4
    # - Index 1: age = 5 - 1 - 1 = 3
    # - Index 2: age = 5 - 2 - 1 = 2
    # - Index 3: age = 5 - 3 - 1 = 1
    # - Index 4 (newest): age = 5 - 4 - 1 = 0
    
    # FilesSection has trim_after_messages = 3, so it should be trimmed when age >= 3
    # VariablesSection has trim_after_messages = 6, so it should be trimmed when age >= 6
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Message 0 with <Files>file0.csv</Files> and <Variables>var0</Variables>"},
        {"role": "user", "content": "Message 1 with <Files>file1.csv</Files> and <Variables>var1</Variables>"},
        {"role": "user", "content": "Message 2 with <Files>file2.csv</Files> and <Variables>var2</Variables>"},
        {"role": "user", "content": "Message 3 with <Files>file3.csv</Files> and <Variables>var3</Variables>"},
        {"role": "user", "content": "Message 4 with <Files>file4.csv</Files> and <Variables>var4</Variables>"},
    ]
    
    result = trim_old_messages(messages)
    
    # Message 0 (age=4): Files should be trimmed (4 >= 3), Variables should remain (4 < 6)
    content_0 = result[0].get("content")
    assert isinstance(content_0, str)
    assert "<Files>" not in content_0
    assert "file0.csv" not in content_0
    assert "<Variables>" in content_0
    assert "var0" in content_0
    
    # Message 1 (age=3): Files should be trimmed (3 >= 3), Variables should remain (3 < 6)
    content_1 = result[1].get("content")
    assert isinstance(content_1, str)
    assert "<Files>" not in content_1
    assert "file1.csv" not in content_1
    assert "<Variables>" in content_1
    assert "var1" in content_1
    
    # Message 2 (age=2): Files should remain (2 < 3), Variables should remain (2 < 6)
    content_2 = result[2].get("content")
    assert isinstance(content_2, str)
    assert "<Files>" in content_2
    assert "file2.csv" in content_2
    assert "<Variables>" in content_2
    assert "var2" in content_2
    
    # Message 3 (age=1): Files should remain (1 < 3), Variables should remain (1 < 6)
    content_3 = result[3].get("content")
    assert isinstance(content_3, str)
    assert "<Files>" in content_3
    assert "file3.csv" in content_3
    assert "<Variables>" in content_3
    assert "var3" in content_3
    
    # Message 4 (age=0, newest): Files should remain (0 < 3), Variables should remain (0 < 6)
    content_4 = result[4].get("content")
    assert isinstance(content_4, str)
    assert "<Files>" in content_4
    assert "file4.csv" in content_4
    assert "<Variables>" in content_4
    assert "var4" in content_4


def test_trim_old_messages_only_trims_user_messages() -> None:
    """Test that trim_old_messages only trims content from user messages."""
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
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_message_with_sections},
        {"role": "user", "content": user_message_with_sections},
        {"role": "assistant", "content": assistant_message_with_sections},
        {"role": "user", "content": "Recent user message"},
    ]
    
    result = trim_old_messages(messages)
    
    # System message should remain unchanged (not trimmed)
    system_content = result[0].get("content")
    assert isinstance(system_content, str)
    assert system_content == system_message_with_sections
    assert "<Files>" in system_content
    assert "file1.csv" in system_content
    
    # User message should be trimmed (age=1, but Files threshold is 3, so actually not trimmed in this case)
    # But let's test with an older message to ensure trimming works
    user_content = result[1].get("content")
    assert isinstance(user_content, str)
    # With age=2, Files should remain (2 < 3)
    assert "<Files>" in user_content
    
    # Assistant message should remain unchanged (not trimmed)
    assistant_content = result[2].get("content")
    assert isinstance(assistant_content, str)
    assert assistant_content == assistant_message_with_sections
    assert "<Files>" in assistant_content


def test_trim_old_messages_summarizes_json_variables_before_final_trim() -> None:
    """Test the end-to-end history path for summarized Variables sections."""
    variables_content = """<Variables>
[
  {"name": "df", "type": "pd.DataFrame", "value": {"rows": 10}},
  {"name": "threshold", "type": "int", "value": 5}
]
</Variables>"""

    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": variables_content},
        {"role": "assistant", "content": "ok"},
        {"role": "user", "content": variables_content},
        {"role": "assistant", "content": "ok"},
        {"role": "user", "content": "most recent"},
    ]

    result = trim_old_messages(messages)

    # Index 0 has age 4, so Variables should be summarized, not removed.
    oldest_content = result[0].get("content")
    assert isinstance(oldest_content, str)
    assert "<Variables>" in oldest_content
    oldest_payload = oldest_content.split("<Variables>", 1)[1].split("</Variables>", 1)[0].strip()
    assert json.loads(oldest_payload) == [
        {"name": "df", "type": "pd.DataFrame"},
        {"name": "threshold", "type": "int", "value": 5},
    ]

    # Index 2 has age 2, so Variables should remain untouched.
    newer_content = result[2].get("content")
    assert isinstance(newer_content, str)
    newer_payload = newer_content.split("<Variables>", 1)[1].split("</Variables>", 1)[0].strip()
    assert json.loads(newer_payload) == [
        {"name": "df", "type": "pd.DataFrame", "value": {"rows": 10}},
        {"name": "threshold", "type": "int", "value": 5},
    ]


def test_trim_old_messages_summarizes_notebook_before_final_trim() -> None:
    """Test the end-to-end history path for summarized Notebook sections."""
    notebook_content = """<Notebook>
Each cell's "index" is its position from the top of the notebook: 0 = first cell at the top of the notebook, then 1, 2, ... (lower index = earlier in the notebook).

[
  {
    "index": 0,
    "id": "cell-1",
    "cell_type": "code",
    "content": "print('This notebook cell is intentionally long enough to be truncated in old history snapshots while still preserving a short preview.')"
  },
  {
    "index": 1,
    "id": "cell-2",
    "cell_type": "markdown",
    "content": "# Summary"
  }
]
</Notebook>"""

    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": notebook_content},
        {"role": "assistant", "content": "ok"},
        {"role": "user", "content": notebook_content},
        {"role": "assistant", "content": "ok"},
        {"role": "user", "content": "most recent"},
    ]

    result = trim_old_messages(messages)

    # Index 0 has age 4, so Notebook should be summarized, not removed.
    oldest_content = result[0].get("content")
    assert isinstance(oldest_content, str)
    assert "<Notebook>" in oldest_content
    oldest_payload = oldest_content.split("<Notebook>", 1)[1].split("</Notebook>", 1)[0].strip()
    notebook_prefix, notebook_json = oldest_payload.split("\n\n", 1)
    assert notebook_prefix.startswith('Each cell\'s "index" is its position from the top of the notebook:')
    summarized_cells = json.loads(notebook_json)
    assert summarized_cells[0]["index"] == 0
    assert summarized_cells[0]["id"] == "cell-1"
    assert summarized_cells[0]["cell_type"] == "code"
    assert summarized_cells[0]["content"].startswith("print('This notebook cell is intentionally long enough")
    assert summarized_cells[0]["content"].endswith("...")
    assert "short preview.')" not in summarized_cells[0]["content"]
    assert summarized_cells[1] == {
        "index": 1,
        "id": "cell-2",
        "cell_type": "markdown",
        "content": "# Summary",
    }

    # Index 2 has age 2, so Notebook should remain untouched.
    newer_content = result[2].get("content")
    assert isinstance(newer_content, str)
    assert "preserving a short preview." in newer_content


def test_trim_old_messages_handles_mixed_content_messages() -> None:
    """
    Tests that when a message contains sections other than text (like image_url),
    those sections are removed completely, leaving only the trimmed text content.
    """
    mixed_content_message = cast(ChatCompletionMessageParam, {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "What is in this image? <Files>file1.csv</Files>"
            },
            {
                "type": "image_url",
                "image_url": {"url": "data:image/png;base64,someimagedata"}
            }
        ]
    })
    
    # Create message list with old message (should be trimmed) and recent messages
    message_list: List[ChatCompletionMessageParam] = [
        mixed_content_message,  # Age = 4, Files should be trimmed (4 >= 3)
        {"role": "assistant", "content": "That's a chart showing data trends"},
        {"role": "user", "content": "Can you explain more?"},
        {"role": "user", "content": "Another recent message"},
        {"role": "user", "content": "Yet another recent message"}
    ]
    
    trimmed_messages = trim_old_messages(message_list)
    
    # Verify that the first message has been trimmed properly
    assert trimmed_messages[0]["role"] == "user"
    first_content = trimmed_messages[0].get("content")
    assert isinstance(first_content, list)
    # Find the text section
    text_section = next((s for s in first_content if s.get("type") == "text"), None)
    assert text_section is not None
    assert isinstance(text_section.get("text"), str)
    assert "<Files>" not in text_section["text"]
    assert "file1.csv" not in text_section["text"]
    assert "What is in this image?" in text_section["text"]
    
    # Verify that recent messages are untouched
    assert trimmed_messages[1] == message_list[1]
    assert trimmed_messages[2] == message_list[2]
    assert trimmed_messages[3] == message_list[3]
    assert trimmed_messages[4] == message_list[4]


def test_trim_old_messages_empty_list() -> None:
    """Test that trim_old_messages handles empty message lists correctly."""
    messages: List[ChatCompletionMessageParam] = []
    result = trim_old_messages(messages)
    assert result == []


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
    from mito_ai_core.completions.message_history import GlobalMessageHistory
    from mito_ai_core.completions.models import ThreadID
    
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