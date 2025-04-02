# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest  # type: ignore
from unittest.mock import patch

from mito_ai.utils.message_history_utils import trim_sections_from_message_content
from mito_ai.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai.prompt_builders.agent_smart_debug_prompt import (
    create_agent_smart_debug_prompt,
)
from mito_ai.prompt_builders.smart_debug_prompt import create_error_prompt
from mito_ai.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.prompt_builders.inline_completer_prompt import create_inline_prompt
from mito_ai.models import (
    AgentExecutionMetadata,
    AgentSmartDebugMetadata,
    AIOptimizedCell,
    ThreadID,
)
from mito_ai.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    CONTENT_REMOVED_PLACEHOLDER,
)

# Standard test data for multiple tests
TEST_VARIABLES = ["'df': pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})"]
TEST_FILES = ["data.csv", "script.py"]
TEST_CODE = "import pandas as pd\ndf = pd.read_csv('data.csv')"
TEST_INPUT = "Calculate the mean of col1"
TEST_ERROR = "AttributeError: 'Series' object has no attribute 'mena'"


@pytest.mark.parametrize(
    "content,expected", [({"some": "dict"}, {"some": "dict"}), (None, None), (123, 123)]
)
def test_trim_non_string_content(content, expected):
    """Test that non-string content is returned unchanged."""
    result = trim_sections_from_message_content(content)
    assert result == expected


def test_trim_sections_basic():
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

    # Verify sections are not in the result anymore
    assert "file1.csv" not in result
    assert "var1 = 1" not in result
    assert "cell_type" not in result

    # Verify other content is preserved
    assert "Some text before." in result
    assert "Some text after." in result
    assert f"{CODE_SECTION_HEADING}" in result
    assert "def hello():" in result


# Parameterized test cases for prompt builders (except inline completer)
PROMPT_BUILDER_TEST_CASES = [
    # Chat prompt
    (
        lambda: create_chat_prompt(TEST_VARIABLES, TEST_FILES, TEST_CODE, TEST_INPUT),
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
            )
        ),
        ["Your task: \nCalculate the mean of col1"],
        ["data.csv\nscript.py", f"'df': pd.DataFrame", "import pandas as pd"],
    ),
    # Smart debug prompt
    (
        lambda: create_error_prompt(TEST_ERROR, TEST_CODE, TEST_VARIABLES, TEST_FILES),
        ["Error Traceback:", TEST_ERROR],
        [
            f"{FILES_SECTION_HEADING}\ndata.csv\nscript.py",
            f"{VARIABLES_SECTION_HEADING}\n'df': pd.DataFrame",
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
def test_prompt_builder_trimming(prompt_builder, expected_in_result, expected_not_in_result):
    """Test trimming for different prompt builders."""
    # Create prompt using the provided builder function
    content = prompt_builder()

    # Trim the content
    result = trim_sections_from_message_content(content)

    # If none of the section headings are present, the content shouldn't change
    has_sections_to_trim = any(
        heading in content 
        for heading in [FILES_SECTION_HEADING, VARIABLES_SECTION_HEADING, JUPYTER_NOTEBOOK_SECTION_HEADING]
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

    # Verify expected content is still in the result
    for expected in expected_in_result:
        assert expected in result

    # Verify content that should be removed is not in the result
    for not_expected in expected_not_in_result:
        assert not_expected not in result

def test_no_sections_to_trim():
    """Test trimming content with no sections to trim."""
    content = "This is a simple message with no sections to trim."
    result = trim_sections_from_message_content(content)
    assert result == content