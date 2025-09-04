# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import base64
import os
import tempfile
from contextlib import contextmanager
from mito_ai.completions.completion_handlers.utils import (
    create_ai_optimized_message,
    extract_and_encode_images_from_additional_context,
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
