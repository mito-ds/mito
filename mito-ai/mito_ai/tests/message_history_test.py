# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import pytest
import json
from unittest.mock import patch, Mock, AsyncMock
from typing import List, Dict, Any, Optional

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.message_history import GlobalMessageHistory, ThreadID
from mito_ai.utils.message_history_utils import trim_old_messages
from mito_ai.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    CONTENT_REMOVED_PLACEHOLDER
)


@pytest.fixture
def temp_chats_dir(monkeypatch, tmp_path):
    """Fixture to create a temporary directory for chat history files."""
    monkeypatch.setattr('mito_ai.message_history.MITO_FOLDER', str(tmp_path))
    chats_dir = tmp_path / "ai-chats"
    chats_dir.mkdir()
    return chats_dir


class TestGlobalMessageHistory:
    """Tests for the GlobalMessageHistory class."""

    def test_trim_old_messages_in_append_message(self, temp_chats_dir):
        """Test that trim_old_messages is called during append_message and works correctly."""
        
        # Create a mock OpenAIProvider
        mock_provider = Mock()
        mock_provider.request_completions = AsyncMock(return_value="Mock response")
        
        # Initialize GlobalMessageHistory
        history = GlobalMessageHistory()
        thread_id = history.create_new_thread()
        
        # Create messages with sections that should be trimmed
        user_message_with_sections = f"""User prompt with sections.
{FILES_SECTION_HEADING}
file1.csv
file2.txt
"""
        # Create 6 user messages to ensure we have enough to exceed the keep_recent default (3)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": user_message_with_sections + " 1"},
            {"role": "assistant", "content": "Assistant response 1"},
            {"role": "user", "content": user_message_with_sections + " 2"},
            {"role": "assistant", "content": "Assistant response 2"},
            {"role": "user", "content": user_message_with_sections + " 3"},
            {"role": "assistant", "content": "Assistant response 3"},
            {"role": "user", "content": user_message_with_sections + " 4"},
            {"role": "assistant", "content": "Assistant response 4"}
        ]
        
        # Mock the trim_old_messages function to track calls
        original_trim_old_messages = trim_old_messages
        trim_calls = []
        
        def mock_trim_old_messages(messages, keep_recent=3):
            trim_calls.append((messages, keep_recent))
            return original_trim_old_messages(messages, keep_recent)
        
        # Add messages to history
        with patch('mito_ai.message_history.trim_old_messages', side_effect=mock_trim_old_messages):
            # Add each message pair
            for i in range(0, len(messages), 2):
                # Using pytest.mark.asyncio would be better, but for simplicity we'll use a synchronous approach
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(
                        history.append_message(
                            messages[i],  # User message
                            messages[i],  # Same message for display
                            mock_provider,
                            thread_id
                        )
                    )
                    if i + 1 < len(messages):
                        loop.run_until_complete(
                            history.append_message(
                                messages[i + 1],  # Assistant message
                                messages[i + 1],  # Same message for display
                                mock_provider,
                                thread_id
                            )
                        )
                finally:
                    loop.close()
            
            # Verify trim_old_messages was called for each append
            assert len(trim_calls) == len(messages)
            
            # Get the AI optimized history
            ai_history = history.get_ai_optimized_history(thread_id)
            
            # The history should have all messages
            assert len(ai_history) == len(messages)
            
            # Check that older user messages (beyond keep_recent=3) have been trimmed
            # First message should be trimmed
            first_msg = ai_history[0]
            assert first_msg["role"] == "user"
            first_content = first_msg.get("content")
            assert isinstance(first_content, str)
            assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in first_content
            assert "file1.csv" not in first_content
            
            # Recent messages should not be trimmed
            recent_msg = ai_history[-2]  # Last user message
            assert recent_msg["role"] == "user"
            recent_content = recent_msg.get("content")
            assert isinstance(recent_content, str)
            assert FILES_SECTION_HEADING in recent_content
            assert "file1.csv" in recent_content
            
            # Check file contents to ensure persistent storage works
            thread_file = temp_chats_dir / f"{thread_id}.json"
            assert thread_file.exists()
            
            with open(thread_file, "r") as f:
                saved_data = json.load(f)
                assert len(saved_data["ai_optimized_history"]) == len(messages)
                
                # Check that trimming is reflected in saved data
                first_saved_msg = saved_data["ai_optimized_history"][0]
                assert first_saved_msg["role"] == "user"
                assert f"{FILES_SECTION_HEADING} {CONTENT_REMOVED_PLACEHOLDER}" in first_saved_msg["content"]
                assert "file1.csv" not in first_saved_msg["content"] 