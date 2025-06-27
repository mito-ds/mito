# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import time
import json
import uuid
from threading import Lock
from typing import Dict, List, Optional

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import CompletionRequest, ChatThreadMetadata, MessageType, ThreadID
from mito_ai.completions.prompt_builders.chat_name_prompt import create_chat_name_prompt
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.utils.schema import MITO_FOLDER
from mito_ai.utils.message_history_utils import trim_old_messages

CHAT_HISTORY_VERSION = 2 # Increment this if the schema changes
NEW_CHAT_NAME = "(New Chat)"
NUMBER_OF_THREADS_CUT_OFF = 50

async def generate_short_chat_name(user_message: str, assistant_message: str, model: str, llm_provider: OpenAIProvider) -> str:
    prompt = create_chat_name_prompt(user_message, assistant_message)

    completion = await llm_provider.request_completions(
        messages=[{"role": "user", "content": prompt}], 
        # We set the model so we can use the correct model provider, but request_completions will decide to 
        # use the fast model from that provider to make the request.
        model=model, 
        message_type=MessageType.CHAT_NAME_GENERATION,
        thread_id=None
    )
    
    # Do a little cleanup of the completion. Gemini seems to return the string
    # wrapped in quotes and a newline character. 
    # TODO: Fix this problem upstream. I wonder if there is some extra encoding
    # we are doing with the gemini responses.
    if isinstance(completion, str):
        # If completion has quotes around it, remove them
        if completion.startswith('"') and completion.endswith('"'):
            completion = completion[1:-1]
            
        if completion.startswith("'") and completion.endswith("'"):
            completion = completion[1:-1]
            
        # If completion ends in a \n, remove it
        completion = completion.strip()
        completion = completion.replace("\n", "") # Remove newline character
        completion = completion.replace("\\n", "") # Remove literal \ and n characters
        
    if not completion or completion == "":
        return "Untitled Chat"
    
    return completion

class ChatThread:
    """
    Holds metadata + two lists of messages: LLM and display messages.
    """
    def __init__(
        self,
        thread_id: ThreadID,
        creation_ts: float,
        last_interaction_ts: float,
        name: str,
        ai_optimized_history: List[ChatCompletionMessageParam] = [],
        display_history: List[ChatCompletionMessageParam] = [],
    ):
        self.thread_id = thread_id
        self.creation_ts = creation_ts
        self.last_interaction_ts = last_interaction_ts
        self.name = name  # short name for the thread
        self.ai_optimized_history: List[ChatCompletionMessageParam] = ai_optimized_history or []
        self.display_history: List[ChatCompletionMessageParam] = display_history or []
        self.chat_history_version = CHAT_HISTORY_VERSION

class GlobalMessageHistory:
    """
    Manages a global message history with thread-safe chat conversations.

    This class ensures thread-safe operations for reading, writing, and 
    modifying message histories using a Lock object. It supports loading 
    from and saving to disk, appending new messages, clearing histories, 
    and truncating histories. Each chat thread is stored in a separate JSON file 
    for persistence.

    Thread safety is crucial to prevent data corruption and race conditions 
    when multiple threads access or modify the message histories concurrently.

    We store two types of messages per thread: AI-optimized and display-optimized messages.
    We store display_history to be able to restore them in the frontend when 
    the extension loads. We store ai_optimized_history to keep the conversation context
    for continuing the conversation.

    The JSON file structure for storing each thread is as follows:
    {
      "chat_history_version": 2,
      "thread_id": "<uuid>",
      "creation_ts": 1234567890.123,
      "last_interaction_ts": 1234567890.123,
      "name": "Short descriptive name",
      "ai_optimized_history": [
        {
          "role": "user",
          "content": "..."
        },
        {
          "role": "assistant",
          "content": "..."
        }
      ],
      "display_history": [
        {
          "role": "user",
          "content": "..."
        },
        {
          "role": "assistant",
          "content": "..."
        }
      ]
    }

    Each thread is stored in a separate JSON file named "<thread_id>.json".

    Attributes:
        _lock (Lock): Ensures thread-safe access.
        _chats_dir (str): Directory where chat thread files are stored.
        _chat_threads (Dict[ThreadID, ChatThread]): In-memory cache of all chat threads.

    Methods:
        create_new_thread() -> ThreadID:
            Creates a new empty chat thread and returns its ID.
        get_ai_optimized_history(thread_id: Optional[ThreadID] = None) -> List[ChatCompletionMessageParam]:
            Returns the AI-optimized history for the specified thread or newest thread.
        get_display_history(thread_id: Optional[ThreadID] = None) -> List[ChatCompletionMessageParam]:
            Returns the display-optimized history for the specified thread or newest thread.
        append_message(ai_optimized_message: ChatCompletionMessageParam, display_message: ChatCompletionMessageParam, llm_provider: OpenAIProvider, thread_id: Optional[ThreadID] = None) -> None:
            Appends messages to the specified thread (or newest thread) and generates a name if needed.
        truncate_histories(index: int, thread_id: Optional[ThreadID] = None) -> None:
            Truncates messages at the given index for the specified thread.
        delete_thread(thread_id: ThreadID) -> bool:
            Deletes a chat thread by its ID from memory and disk, returns success status.
        get_threads() -> List[ChatThreadMetadata]:
            Returns a list of threads with metadata, sorted by last interaction (newest first).
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._chats_dir = os.path.join(MITO_FOLDER, "ai-chats")
        os.makedirs(self._chats_dir, exist_ok=True)

        # In-memory cache of all chat threads loaded from disk
        self._chat_threads: Dict[ThreadID, ChatThread] = {}

        # Load existing threads from disk on startup
        self._load_all_threads_from_disk()

    def create_new_thread(self) -> ThreadID:
        """
        Creates a new empty chat thread and saves it immediately.
        """
        with self._lock:
            thread_id = ThreadID(str(uuid.uuid4()))
            now = time.time()
            new_thread = ChatThread(
                thread_id=thread_id,
                creation_ts=now,
                last_interaction_ts=now,
                name=NEW_CHAT_NAME,  # we'll fill this in once we have at least user & assistant messages
            )
            self._chat_threads[thread_id] = new_thread
            self._save_thread_to_disk(new_thread)
            return thread_id
    
    def _load_all_threads_from_disk(self) -> None:
        """
        Loads each .json file in `self._chats_dir` into self._chat_threads.
        """
        files = os.listdir(self._chats_dir)
        for file_name in files:
            if not file_name.endswith(".json"):
                continue
            path = os.path.join(self._chats_dir, file_name)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                    # Check version
                    file_version = data.get("chat_history_version", 0)
                    if file_version == CHAT_HISTORY_VERSION:
                        thread = ChatThread(
                            thread_id=ThreadID(data["thread_id"]),
                            creation_ts=data["creation_ts"],
                            last_interaction_ts=data["last_interaction_ts"],
                            name=data["name"],
                            ai_optimized_history=data.get("ai_optimized_history", []),
                            display_history=data.get("display_history", []),
                        )
                        self._chat_threads[thread.thread_id] = thread
                    else:
                        # If versions don't match, throw a warning
                        print(
                            f"Warning: Incompatible chat history version ({file_version}). "
                            f"Expected version {CHAT_HISTORY_VERSION}."
                        )
                        f.close()
            except Exception as e:
                print(f"Error loading chat thread from {path}: {e}")
    
    def _save_thread_to_disk(self, thread: ChatThread) -> None:
        """
        Saves the given ChatThread to a JSON file `<thread_id>.json` in `self._chats_dir`.
        """
        path = os.path.join(self._chats_dir, f"{thread.thread_id}.json")
        
        # Using a temporary file and rename for safer "atomic" writes
        tmp_file = path + ".tmp"
        try:
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(thread.__dict__, f, indent=2)
            os.replace(tmp_file, path)
        except Exception as e:
            print(f"Error saving chat thread {thread.thread_id}: {e}")
    
    def _get_newest_thread_id(self) -> Optional[ThreadID]:
        """
        Returns the thread_id of the thread with the latest 'last_interaction_ts'.
        If no threads exist, return None.
        """
        if not self._chat_threads:
            return None
        return max(self._chat_threads, key=lambda tid: self._chat_threads[tid].last_interaction_ts)

    def _update_last_interaction(self, thread: ChatThread) -> None:
        thread.last_interaction_ts = time.time()

    def get_ai_optimized_history(self, thread_id: ThreadID) -> List[ChatCompletionMessageParam]:
        """
        Returns the AI-optimized message history for the specified thread or the newest thread if not specified.
        """
        with self._lock:
            if thread_id not in self._chat_threads:
                return []
            return self._chat_threads[thread_id].ai_optimized_history
    
    def get_display_history(self, thread_id: ThreadID) -> List[ChatCompletionMessageParam]:
        """
        Returns the display-optimized message history for the specified thread or the newest thread if not specified.
        """
        with self._lock:
            if thread_id not in self._chat_threads:
                return []
            return self._chat_threads[thread_id].display_history

    async def append_message(
        self, 
        ai_optimized_message: ChatCompletionMessageParam, 
        display_message: ChatCompletionMessageParam, 
        model: str,
        llm_provider: OpenAIProvider,
        thread_id: ThreadID
    ) -> None:
        """
        Appends the messages to the specified thread or the newest thread if not specified.
        If there are no threads yet, create one.
        We also detect if we should set a short name for the thread.
        """

        # Add messages and check if naming is needed while holding the lock
        name_gen_input = None
        with self._lock:
            thread = self._chat_threads[thread_id]
            thread.ai_optimized_history.append(ai_optimized_message)
            thread.display_history.append(display_message)
            self._update_last_interaction(thread)
            
            # Trim old messages in ai_optimized_history to reduce token count
            thread.ai_optimized_history = trim_old_messages(thread.ai_optimized_history)

            if thread.name == NEW_CHAT_NAME and len(thread.display_history) >= 2:
                # Retrieve first user and assistant messages from display_history
                user_message = None
                assistant_message = None
                for msg in thread.display_history:
                    if msg["role"] == "user" and user_message is None:
                        user_message = msg["content"]
                    elif msg["role"] == "assistant" and assistant_message is None:
                        assistant_message = msg["content"]
                    if user_message and assistant_message:
                        break
                if user_message and assistant_message:
                    name_gen_input = (user_message, assistant_message)

            # Save the updated thread to disk
            self._save_thread_to_disk(thread)

        # Outside the lock, await the name generation if needed
        if name_gen_input:
            new_name = await generate_short_chat_name(str(name_gen_input[0]), str(name_gen_input[1]), model, llm_provider)
            with self._lock:
                # Update the thread's name if still required
                thread = self._chat_threads[thread_id]
                if thread is not None and thread.name == NEW_CHAT_NAME:
                    thread.name = new_name
                    self._save_thread_to_disk(thread)

    def truncate_histories(self, index: int, thread_id: ThreadID) -> None:
        """
        For the newest thread, truncate messages at the given index.
        """
        if index < 0:
            return
        
        with self._lock:
            thread = self._chat_threads[thread_id]
            thread.ai_optimized_history = thread.ai_optimized_history[:index]
            thread.display_history = thread.display_history[:index]
            self._update_last_interaction(thread)
            self._save_thread_to_disk(thread)

    def delete_thread(self, thread_id: ThreadID) -> bool:
        """
        Deletes a chat thread by its ID. Removes both the in-memory entry and the JSON file.
        Includes safety checks to ensure we're only deleting valid thread files.
        """

        # Safety check: validate thread_id is a properly formatted UUID
        if not thread_id or not isinstance(thread_id, str):
            print(f"Invalid thread_id: {thread_id}")
            return False
        
        # UUIDs should only contain alphanumeric chars and hyphens
        if not all(c.isalnum() or c == '-' for c in thread_id):
            print(f"Thread ID contains invalid characters: {thread_id}")
            return False

        with self._lock:
            # Remove from in-memory cache if present
            if thread_id in self._chat_threads:
                del self._chat_threads[thread_id]
            
            # Construct the file path
            path = os.path.join(self._chats_dir, f"{thread_id}.json")

            # Security check: ensure path is within the expected directory
            if not os.path.normpath(path).startswith(os.path.normpath(self._chats_dir)):
                print(f"Path traversal attempt detected: {path}")
                return False
            
            # Ensure we're only deleting .json files
            if not path.endswith('.json'):
                print(f"Not a .json file: {path}")
                return False
            
            # Check if the file exists and is actually a file (not directory)
            if os.path.exists(path):
                if not os.path.isfile(path):
                    print(f"Path exists but is not a file: {path}")
                    return False
                    
                try:
                    os.remove(path)
                    return True
                except Exception as e:
                    print(f"Error deleting thread {thread_id}: {e}")
                    return False
            
        return False

    def get_threads(self) -> List[ChatThreadMetadata]:
        """
        Returns a list of all chat threads with keys:
          - thread_id
          - name
          - creation_ts
          - last_interaction_ts
        The list is sorted by last_interaction_ts (newest first).
        """
        with self._lock:
            threads = []
            for thread in self._chat_threads.values():
                threads.append(ChatThreadMetadata(
                    thread_id=thread.thread_id,
                    name=thread.name,
                    creation_ts=thread.creation_ts,
                    last_interaction_ts=thread.last_interaction_ts,
                ))
            threads.sort(key=lambda x: x.last_interaction_ts, reverse=True)

            # Since we expect vast majority of chats are never going to be deleted,
            # we cut off the list of threads to a reasonable number.
            return threads[:NUMBER_OF_THREADS_CUT_OFF]
