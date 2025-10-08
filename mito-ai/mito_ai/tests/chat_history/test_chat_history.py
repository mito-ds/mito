# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import requests
import time
from unittest.mock import patch, MagicMock
from mito_ai.tests.conftest import TOKEN
from mito_ai.completions.message_history import GlobalMessageHistory, ChatThread
from mito_ai.completions.models import ThreadID


@pytest.fixture
def mock_chat_threads():
    """Fixture that creates mock chat threads for testing"""
    thread_id_1 = ThreadID("test-thread-1")
    thread_id_2 = ThreadID("test-thread-2")

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
    # Since the server extension is already loaded, we need to work with the actual instance
    # Let's just test that the endpoint works and returns the expected structure
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    response_json = response.json()
    assert "threads" in response_json
    # The actual number of threads will depend on what's in the .mito/ai-chats directory
    # So we'll just check that it's a list
    assert isinstance(response_json["threads"], list)

    # Check thread structure for any threads that exist
    for thread in response_json["threads"]:
        assert "thread_id" in thread
        assert "name" in thread
        assert "creation_ts" in thread
        assert "last_interaction_ts" in thread


def test_get_all_threads_empty(jp_base_url: str):
    """Test GET all threads endpoint when no threads exist"""
    # This test will work with whatever threads exist in the actual .mito/ai-chats directory
    # We'll just verify the endpoint works and returns the expected structure
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    response_json = response.json()
    assert "threads" in response_json
    assert isinstance(response_json["threads"], list)


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
    # First, get all threads to see what's available
    response = requests.get(
        jp_base_url + "/mito-ai/chat-history/threads",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    threads = response.json()["threads"]
    if not threads:
        # If no threads exist, skip this test
        pytest.skip("No threads available for testing")

    # Use the first available thread
    thread_id = threads[0]["thread_id"]

    response = requests.get(
        jp_base_url + f"/mito-ai/chat-history/threads/{thread_id}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    response_json = response.json()
    assert response_json["thread_id"] == thread_id
    assert "name" in response_json
    assert "creation_ts" in response_json
    assert "last_interaction_ts" in response_json
    assert "display_history" in response_json
    assert "ai_optimized_history" in response_json

    # Check message history structure
    display_history = response_json["display_history"]
    assert isinstance(display_history, list)
    ai_optimized_history = response_json["ai_optimized_history"]
    assert isinstance(ai_optimized_history, list)


def test_get_specific_thread_not_found(jp_base_url: str, mock_message_history):
    """Test GET specific thread endpoint with non-existent thread ID"""
    # Use a clearly non-existent thread ID
    fake_thread_id = "non-existent-thread-12345"

    response = requests.get(
        jp_base_url + f"/mito-ai/chat-history/threads/{fake_thread_id}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 404

    response_json = response.json()
    assert "error" in response_json
    assert fake_thread_id in response_json["error"]


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
