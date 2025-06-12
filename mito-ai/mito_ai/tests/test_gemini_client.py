# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.gemini_client import extract_system_instruction_and_contents

# Dummy base64 image (1x1 PNG)
DUMMY_IMAGE_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBAp9l9AAAAABJRU5ErkJggg=="
)

def test_mixed_text_and_image():
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": [
            {"type": "text", "text": "Here is an image:"},
            {"type": "image_url", "image_url": {"url": DUMMY_IMAGE_DATA_URL}}
        ]}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == ["You are a helpful assistant."]
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    # Should have two parts: text and image
    assert len(contents[0]["parts"]) == 2
    assert contents[0]["parts"][0]["text"] == "Here is an image:"
    # The second part should be a Part object (from google.genai.types)
    from google.genai.types import Part
    assert isinstance(contents[0]["parts"][1], Part)

def test_no_system_instructions_only_content():
    messages = [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi, how can I help you?"}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == []
    assert len(contents) == 2
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "Hello!"
    assert contents[1]["role"] == "assistant"
    assert contents[1]["parts"][0]["text"] == "Hi, how can I help you?"

def test_system_instructions_and_content():
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the weather today?"}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == ["You are a helpful assistant."]
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "What is the weather today?" 