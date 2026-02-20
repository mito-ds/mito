# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import base64
import json
import os
import tempfile
from contextlib import contextmanager

import pytest

from mito_ai.completions.completion_handlers.utils import (
    create_ai_optimized_message,
    extract_and_encode_images_from_additional_context,
    normalize_agent_response_completion,
)


@contextmanager
def temporary_image_file(suffix=".png", content=b"fake_image_data"):
    """Context manager that creates a temporary image file for testing."""
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        yield temp_file_path
    finally:
        # Clean up the temporary file
        os.unlink(temp_file_path)


def test_text_only_message():
    """Test scenario where the user only inputs text"""
    result = create_ai_optimized_message("Hello world")

    assert result["role"] == "user"
    assert result["content"] == "Hello world"


def test_message_with_uploaded_image():
    """Test scenario where the user uploads an image"""
    with temporary_image_file() as temp_file_path:
        result = create_ai_optimized_message(
            text="Analyze this",
            additional_context=[{"type": "image/png", "value": temp_file_path}],
        )

        assert result["role"] == "user"
        assert isinstance(result["content"], list)
        assert result["content"][0]["type"] == "text"
        assert result["content"][1]["type"] == "image_url"


def test_message_with_multiple_uploaded_images():
    """Test scenario where the user uploads multiple images"""
    with temporary_image_file(suffix=".png", content=b"image1_data") as temp_file1:
        with temporary_image_file(suffix=".jpg", content=b"image2_data") as temp_file2:
            result = create_ai_optimized_message(
                text="Analyze these images",
                additional_context=[
                    {"type": "image/png", "value": temp_file1},
                    {"type": "image/jpeg", "value": temp_file2},
                ],
            )

            assert result["role"] == "user"
            assert isinstance(result["content"], list)
            assert len(result["content"]) == 3  # text + 2 images
            assert result["content"][0]["type"] == "text"
            assert result["content"][0]["text"] == "Analyze these images"
            assert result["content"][1]["type"] == "image_url"
            assert result["content"][2]["type"] == "image_url"
            
            # Verify the image URLs are properly formatted
            assert result["content"][1]["image_url"]["url"].startswith("data:image/png;base64,")
            assert result["content"][2]["image_url"]["url"].startswith("data:image/jpeg;base64,")


def test_message_with_active_cell_output():
    """Test scenario where the active cell has an output"""
    result = create_ai_optimized_message(
        text="Analyze this", base64EncodedActiveCellOutput="cell_output_data"
    )

    assert result["role"] == "user"
    assert isinstance(result["content"], list)
    assert result["content"][0]["type"] == "text"
    assert result["content"][1]["type"] == "image_url"


def test_message_with_uploaded_image_and_active_cell_output():
    """Test scenario where the user uploads an image and the active cell has an output"""
    with temporary_image_file() as temp_file_path:
        result = create_ai_optimized_message(
            text="Analyze this",
            additional_context=[{"type": "image/png", "value": temp_file_path}],
            base64EncodedActiveCellOutput="cell_output_data",
        )

        assert result["role"] == "user"
        assert isinstance(result["content"], list)
        assert result["content"][0]["type"] == "text"
        assert result["content"][1]["type"] == "image_url"
        assert result["content"][2]["type"] == "image_url"


def test_extract_and_encode_images_from_additional_context_valid_image():
    """Test extracting and encoding a valid image file"""
    with temporary_image_file() as temp_file_path:
        additional_context = [{"type": "image/png", "value": temp_file_path}]

        encoded_images = extract_and_encode_images_from_additional_context(
            additional_context
        )

        assert len(encoded_images) == 1
        assert encoded_images[0].startswith("data:image/png;base64,")
        # Verify it's valid base64 by checking it can be decoded
        base64_data = encoded_images[0].split(",")[1]
        decoded_data = base64.b64decode(base64_data)
        assert decoded_data == b"fake_image_data"


def test_extract_and_encode_images_from_additional_context_multiple_images():
    """Test extracting and encoding multiple image files"""
    with temporary_image_file(suffix=".png", content=b"image1_data") as temp_file1:
        with temporary_image_file(suffix=".jpg", content=b"image2_data") as temp_file2:
            additional_context = [
                {"type": "image/png", "value": temp_file1},
                {"type": "image/jpeg", "value": temp_file2},
            ]

            encoded_images = extract_and_encode_images_from_additional_context(
                additional_context
            )

            assert len(encoded_images) == 2
            assert encoded_images[0].startswith("data:image/png;base64,")
            assert encoded_images[1].startswith("data:image/jpeg;base64,")


def test_extract_and_encode_images_from_additional_context_invalid_file():
    """Test handling of invalid/non-existent image files"""
    additional_context = [{"type": "image/png", "value": "non_existent_file.png"}]

    encoded_images = extract_and_encode_images_from_additional_context(
        additional_context
    )

    assert len(encoded_images) == 0


def test_extract_and_encode_images_from_additional_context_non_image_types():
    """Test that non-image types are ignored"""
    with temporary_image_file(suffix=".txt", content=b"text_data") as temp_file:
        additional_context = [
            {"type": "text/plain", "value": temp_file},
            {"type": "application/pdf", "value": "document.pdf"},
        ]

        encoded_images = extract_and_encode_images_from_additional_context(
            additional_context
        )

        assert len(encoded_images) == 0


def test_extract_and_encode_images_from_additional_context_mixed_types():
    """Test handling of mixed image and non-image types"""
    with temporary_image_file() as temp_image_file:
        additional_context = [
            {"type": "image/png", "value": temp_image_file},
            {"type": "text/plain", "value": "document.txt"},
            {"type": "image/jpeg", "value": "non_existent.jpg"},
        ]

        encoded_images = extract_and_encode_images_from_additional_context(
            additional_context
        )

        # Should only have the valid PNG image
        assert len(encoded_images) == 1
        assert encoded_images[0].startswith("data:image/png;base64,")


def test_extract_and_encode_images_from_additional_context_empty():
    """Test handling of empty or None additional_context"""
    # Test with None
    encoded_images = extract_and_encode_images_from_additional_context(None)
    assert len(encoded_images) == 0

    # Test with empty list
    encoded_images = extract_and_encode_images_from_additional_context([])
    assert len(encoded_images) == 0


# ---------------------------------------------------------------------------
# normalize_agent_response_completion tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "completion",
    [
        "",
        "   \n\t  ",
        '{"type":"finished_task","message":"Done"}',
        '[1, 2, {"nested": true}]',
        '{"message": "He said \\"hello\\" to me"}',
        '{"a": {"b": {"c": 1}}}',
        '{"type":"finished_task","next_steps":["Step 1","Step 2",{"nested":true}]}',
        '{"type":"cell_update","message":"Update","cell_update":{"type":"modification","id":"abc","code":"x=1","code_summary":"Set x","cell_type":"code"}}',
        '{"type":"cell_update","message":"Code","cell_update":{"type":"new","after_cell_id":"id","code":"import json\\\\nprint(json.dumps({\\\"x\\\": 1}))","code_summary":"JSON","cell_type":"code"}}',
        '{"type":"scratchpad","message":"M","scratchpad_code":"x = {\\\"a\\\": 1}\\nprint(x)","scratchpad_summary":"Dict"}',
    ],
    ids=[
        "empty_string",
        "whitespace_only",
        "valid_single_json",
        "top_level_array",
        "escaped_quotes_in_string",
        "triple_nested_braces",
        "object_with_array_containing_objects",
        "nested_json_cell_update",
        "cell_update_code_contains_braces",
        "scratchpad_code_with_braces_and_quotes",
    ],
)
def test_normalize_agent_response_completion_identity(completion):
    """Input is returned unchanged when it is valid single JSON or has no object to extract."""
    result = normalize_agent_response_completion(completion)
    assert result == completion
    if completion.strip().startswith("{"):
        parsed = json.loads(result)
        assert isinstance(parsed, dict)


@pytest.mark.parametrize(
    "completion,expected",
    [
        (
            '{"a":1}\n{"b":2}',
            '{"a":1}',
        ),
        (
            '{"a":1}{"b":2}',
            '{"a":1}',
        ),
        (
            '{"type":"scratchpad","message":"First","scratchpad_code":"x=1","scratchpad_summary":"First"}\n'
            '{"type":"scratchpad","message":"Second","scratchpad_code":"y=2","scratchpad_summary":"Second"}',
            '{"type":"scratchpad","message":"First","scratchpad_code":"x=1","scratchpad_summary":"First"}',
        ),
        (
            '{"type":"finished_task","message":"Done"}\n\nI have completed the task.',
            '{"type":"finished_task","message":"Done"}',
        ),
            (
                '  \n  {"type":"finished_task","message":"Done"}',
                '{"type":"finished_task","message":"Done"}',
            ),
            (
                '  {"type":"scratchpad","message":"Hi"}  ',
                '{"type":"scratchpad","message":"Hi"}',
            ),
            (
                '{"type":"cell_update","message":"M","cell_update":{"type":"modification","id":"x","code":"1","code_summary":"Set","cell_type":"code"}}'
            '{"type":"finished_task","message":"Done"}',
            '{"type":"cell_update","message":"M","cell_update":{"type":"modification","id":"x","code":"1","code_summary":"Set","cell_type":"code"}}',
        ),
        (
            # Duplicate cell_update where code field contains a JSON object literal (braces/quotes).
            # Parser must not stop at the inner "}" in the code string.
            '{"type":"cell_update","message":"Add code","cell_update":{"type":"new","after_cell_id":"id","code":"import json\\\\nprint(json.dumps({\\\"key\\\": 1}))","code_summary":"JSON","cell_type":"code"}}'
            '\n'
            '{"type":"cell_update","message":"Add code","cell_update":{"type":"new","after_cell_id":"id","code":"import json\\\\nprint(json.dumps({\\\"key\\\": 1}))","code_summary":"JSON","cell_type":"code"}}',
            '{"type":"cell_update","message":"Add code","cell_update":{"type":"new","after_cell_id":"id","code":"import json\\\\nprint(json.dumps({\\\"key\\\": 1}))","code_summary":"JSON","cell_type":"code"}}',
        ),
    ],
        ids=[
            "duplicate_json_newline",
            "duplicate_json_no_newline",
            "duplicate_scratchpad_returns_first",
            "trailing_text_after_json",
            "leading_whitespace_before_brace",
            "valid_json_with_leading_trailing_whitespace_stripped",
            "nested_then_duplicate",
            "duplicate_cell_update_with_json_in_code_returns_first",
        ],
)
def test_normalize_agent_response_completion_extract_first(completion, expected):
    """When completion contains extra content after the first JSON object, only the first is returned."""
    result = normalize_agent_response_completion(completion)
    assert result == expected
    parsed = json.loads(result)
    assert isinstance(parsed, dict)


@pytest.mark.parametrize(
    "completion",
    [
        "plain text response",
        '{"type": "scratchpad", "message": "oops',
    ],
    ids=["no_brace_returns_original", "malformed_unbalanced_braces_returns_original"],
)
def test_normalize_agent_response_completion_returns_original_unchanged(completion):
    """When no valid complete JSON object can be extracted, the original string is returned."""
    result = normalize_agent_response_completion(completion)
    assert result == completion


def test_normalize_agent_response_completion_realistic_scratchpad_duplicate():
    """Realistic duplicate scratchpad response (as seen in the bug): return first only."""
    single = (
        '{"type":"scratchpad","message":"I will inspect the file.","cell_update":null,'
        '"get_cell_output_cell_id":null,"next_steps":null,"analysis_assumptions":null,'
        '"streamlit_app_prompt":null,"question":null,"answers":null,'
        '"scratchpad_code":"import pandas as pd\\n\\nscratch_path = \'Budget.xlsx\'\\n\\n'
        'scratch_xls = pd.ExcelFile(scratch_path)\\nprint(\'Sheets:\', scratch_xls.sheet_names)",'
        '"scratchpad_summary":"Inspecting Excel sheets"}'
    )
    duplicated = single + "\n" + single
    result = normalize_agent_response_completion(duplicated)
    assert result == single
    parsed = json.loads(result)
    assert parsed["type"] == "scratchpad"
    assert "Inspecting Excel sheets" in parsed["scratchpad_summary"]
