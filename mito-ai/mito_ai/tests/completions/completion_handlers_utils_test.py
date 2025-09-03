# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.completion_handlers.utils import create_ai_optimized_message


def test_text_only_message():
    """Test scenario where the user only inputs text"""
    result = create_ai_optimized_message("Hello world")

    assert result["role"] == "user"
    assert result["content"] == "Hello world"


def test_message_with_uploaded_image():
    """Test scenario where the user uploads an image"""
    result = create_ai_optimized_message(
        text="Analyze this", base64EncodedUploadedImage="image_data"
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
    result = create_ai_optimized_message(
        text="Analyze this",
        base64EncodedUploadedImage="image_data",
        base64EncodedActiveCellOutput="cell_output_data",
    )

    assert result["role"] == "user"
    assert isinstance(result["content"], list)
    assert result["content"][0]["type"] == "text"
    assert result["content"][1]["type"] == "image_url"
    assert result["content"][2]["type"] == "image_url"
