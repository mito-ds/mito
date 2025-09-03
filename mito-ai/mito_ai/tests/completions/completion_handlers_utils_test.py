from mito_ai.completions.completion_handlers.utils import create_ai_optimized_message


def test_text_only_message():
    """Test the else branch - text only message"""
    result = create_ai_optimized_message("Hello world")

    assert result["role"] == "user"
    assert result["content"] == "Hello world"


def test_message_with_uploaded_image():
    """Test the first if branch - uploaded image takes priority"""
    result = create_ai_optimized_message(
        text="Analyze this", base64EncodedUploadedImage="image_data"
    )

    assert result["role"] == "user"
    assert isinstance(result["content"], list)
    assert result["content"][0]["type"] == "text"
    assert result["content"][1]["type"] == "image_url"


def test_message_with_active_cell_output():
    """Test the elif branch - active cell output when no uploaded image"""
    result = create_ai_optimized_message(
        text="Analyze this", base64EncodedActiveCellOutput="cell_output_data"
    )

    assert result["role"] == "user"
    assert isinstance(result["content"], list)
    assert result["content"][0]["type"] == "text"
    assert result["content"][1]["type"] == "image_url"
