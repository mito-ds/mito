# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import requests
import time
from unittest.mock import patch, MagicMock
from mito_ai.tests.conftest import TOKEN
from mito_ai.completions.message_history import GlobalMessageHistory, ChatThread


@pytest.fixture
def mock_chat_threads():
    """Fixture that creates mock chat threads for testing"""
    thread_id_1 = "test-thread-1"
    thread_id_2 = "test-thread-2"

    # Create mock threads with different timestamps
    thread_1 = ChatThread(
        thread_id=thread_id_1,
        creation_ts=time.time() - 3600,  # 1 hour ago
        last_interaction_ts=time.time() - 1800,  # 30 minutes ago
        name="Test Chat 1",
        ai_optimized_history=[
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ],
        display_history=[
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ],
    )

    thread_2 = ChatThread(
        thread_id=thread_id_2,
        creation_ts=time.time() - 7200,  # 2 hours ago
        last_interaction_ts=time.time() - 900,  # 15 minutes ago (more recent)
        name="Test Chat 2",
        ai_optimized_history=[
            {"role": "user", "content": "How are you?"},
            {"role": "assistant", "content": "I'm doing well, thanks!"},
        ],
        display_history=[
            {"role": "user", "content": "How are you?"},
            {"role": "assistant", "content": "I'm doing well, thanks!"},
        ],
    )

    return {thread_id_1: thread_1, thread_id_2: thread_2}


@pytest.fixture
def mock_message_history(mock_chat_threads):
    """Fixture that mocks the GlobalMessageHistory with test data"""
    mock_history = MagicMock(spec=GlobalMessageHistory)
    mock_history._chat_threads = mock_chat_threads

    # Mock the get_threads method to return sorted threads
    def mock_get_threads():
        from mito_ai.completions.models import ChatThreadMetadata

        threads = []
        for thread in mock_chat_threads.values():
            threads.append(
                ChatThreadMetadata(
                    thread_id=thread.thread_id,
                    name=thread.name,
                    creation_ts=thread.creation_ts,
                    last_interaction_ts=thread.last_interaction_ts,
                )
            )
        # Sort by last_interaction_ts (newest first)
        threads.sort(key=lambda x: x.last_interaction_ts, reverse=True)
        return threads

    mock_history.get_threads = mock_get_threads
    return mock_history


# --- GET ALL THREADS ---


def test_get_all_threads_success(jp_base_url: str, mock_message_history):
    """Test successful GET all threads endpoint"""
    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_message_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 200

        response_json = response.json()
        assert "threads" in response_json
        assert len(response_json["threads"]) == 2

        # Check that threads are sorted by last_interaction_ts (newest first)
        threads = response_json["threads"]
        assert threads[0]["thread_id"] == "test-thread-2"  # More recent
        assert threads[1]["thread_id"] == "test-thread-1"  # Less recent

        # Check thread structure
        for thread in threads:
            assert "thread_id" in thread
            assert "name" in thread
            assert "creation_ts" in thread
            assert "last_interaction_ts" in thread


def test_get_all_threads_empty(jp_base_url: str):
    """Test GET all threads endpoint when no threads exist"""
    mock_history = MagicMock(spec=GlobalMessageHistory)
    mock_history.get_threads.return_value = []

    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 200

        response_json = response.json()
        assert response_json["threads"] == []


def test_get_all_threads_with_no_auth(jp_base_url: str):
    """Test GET all threads endpoint without authentication"""
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads",
    )
    assert response.status_code == 403  # Forbidden


def test_get_all_threads_with_incorrect_auth(jp_base_url: str):
    """Test GET all threads endpoint with incorrect authentication"""
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- GET SPECIFIC THREAD ---


def test_get_specific_thread_success(jp_base_url: str, mock_message_history):
    """Test successful GET specific thread endpoint"""
    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_message_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads/test-thread-1",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 200

        response_json = response.json()
        assert response_json["thread_id"] == "test-thread-1"
        assert response_json["name"] == "Test Chat 1"
        assert "creation_ts" in response_json
        assert "last_interaction_ts" in response_json
        assert "display_history" in response_json
        assert "ai_optimized_history" in response_json

        # Check message history structure
        display_history = response_json["display_history"]
        assert len(display_history) == 2
        assert display_history[0]["role"] == "user"
        assert display_history[0]["content"] == "Hello"
        assert display_history[1]["role"] == "assistant"
        assert display_history[1]["content"] == "Hi there!"


def test_get_specific_thread_not_found(jp_base_url: str, mock_message_history):
    """Test GET specific thread endpoint with non-existent thread ID"""
    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_message_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads/non-existent-thread",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 404

        response_json = response.json()
        assert "error" in response_json
        assert "non-existent-thread" in response_json["error"]


def test_get_specific_thread_with_no_auth(jp_base_url: str):
    """Test GET specific thread endpoint without authentication"""
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads/test-thread-1",
    )
    assert response.status_code == 403  # Forbidden


def test_get_specific_thread_with_incorrect_auth(jp_base_url: str):
    """Test GET specific thread endpoint with incorrect authentication"""
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads/test-thread-1",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- ERROR HANDLING ---


def test_get_threads_server_error(jp_base_url: str):
    """Test GET threads endpoint when server encounters an error"""
    mock_history = MagicMock(spec=GlobalMessageHistory)
    mock_history.get_threads.side_effect = Exception("Database connection failed")

    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 500

        response_json = response.json()
        assert "error" in response_json
        assert "Database connection failed" in response_json["error"]


def test_get_specific_thread_server_error(jp_base_url: str):
    """Test GET specific thread endpoint when server encounters an error"""

    # Create a custom mock dict that raises an exception when accessed
    class ErrorDict(dict):
        def __contains__(self, key):
            return key == "test-thread-1"

        def __getitem__(self, key):
            if key == "test-thread-1":
                raise Exception("Thread access failed")
            return super().__getitem__(key)

    mock_history = MagicMock(spec=GlobalMessageHistory)
    mock_history._chat_threads = ErrorDict()

    with patch(
        "mito_ai.chat_history.handlers.GlobalMessageHistory"
    ) as mock_global_history:
        mock_global_history.return_value = mock_history

        response = requests.get(
            jp_base_url + "/mito-ai/chat-history/threads/test-thread-1",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 500

        response_json = response.json()
        assert "error" in response_json
        assert "Thread access failed" in response_json["error"]
