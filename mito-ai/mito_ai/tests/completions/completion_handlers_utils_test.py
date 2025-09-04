# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
from contextlib import contextmanager
from mito_ai.completions.completion_handlers.utils import create_ai_optimized_message


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
