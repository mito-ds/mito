import os
import json
from threading import Lock
from typing import Dict, List

from .utils.schema import MITO_FOLDER

CHAT_HISTORY_VERSION = 1 # Increment this if the schema changes

class GlobalMessageHistory:
    """
    Manages a global message history with thread-safe access and persistence.

    This class ensures thread-safe operations for reading, writing, and 
    modifying message histories using a Lock object. It supports loading 
    from and saving to disk, appending new messages, clearing histories, 
    and truncating histories. The histories are stored on disk for persistence.

    Thread safety is crucial to prevent data corruption and race conditions 
    when multiple threads access or modify the message histories concurrently.

    We store two types of messages: LLM messages and display messages.
    We store display_messages to be able to restore them in the frontend when 
    the extension loads. We store LLM messages to keep the conversation context
    for continuing the conversation.

    The JSON file structure for storing the histories is as follows:
    {
      "chat_history_version": 1,
      "llm_history": [
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

    JSON schema is chosen to match what is stored in the memory, so it is 
    easy to serialize/deserialize.

    Attributes:
        _lock (Lock): Ensures thread-safe access.
        _llm_history (List[Dict[str, str]]): Stores LLM messages.
        _display_history (List[Dict[str, str]]): Stores display messages.
        _save_file (str): Path to the file where histories are saved.

    Methods:
        get_histories() -> tuple[List[Dict[str, str]], List[Dict[str, str]]]:
            Returns copies of the LLM and display histories.
        clear_histories() -> None:
            Clears both histories and saves the changes to disk.
        append_message(llm_message: Dict[str, str], display_message: Dict[str, str]) -> None:
            Appends new messages to the histories and saves to disk.
        truncate_histories(index: int) -> None:
            Truncates both histories at the given index and saves to disk.
    """
    def __init__(self, save_file: str = os.path.join(MITO_FOLDER, "message_history.json")):
        self._lock = Lock()
        self._llm_history: List[Dict[str, str]] = []
        self._display_history: List[Dict[str, str]] = []
        self._save_file = save_file

        # Load from disk on startup
        self._load_from_disk()
    
    def _load_from_disk(self):
        """Load existing history from disk, if it exists."""
        if os.path.exists(self._save_file):
            try:
                with open(self._save_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                    # Check version
                    file_version = data.get("chat_history_version", 0)
                    if file_version == CHAT_HISTORY_VERSION:
                        self._llm_history = data.get("llm_history", [])
                        self._display_history = data.get("display_history", [])
                    else:
                        # If versions don't match, delete the file
                        print(
                            f"Warning: Incompatible chat history version ({file_version}). "
                            f"Expected version {CHAT_HISTORY_VERSION}. Deleting file."
                        )
                        f.close()
                        os.remove(self._save_file)
            except Exception as e:
                print(f"Error loading history file: {e}")
    
    def _save_to_disk(self):
        """Save current history to disk."""
        data = {
            "chat_history_version": CHAT_HISTORY_VERSION,
            "llm_history": self._llm_history,
            "display_history": self._display_history,
        }
        # Using a temporary file and rename for safer "atomic" writes
        tmp_file = f"{self._save_file}.tmp"
        try:
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_file, self._save_file)
        except Exception as e:
            # log or handle error
            print(f"Error saving history file: {e}")

    def get_histories(self) -> tuple[List[Dict[str, str]], List[Dict[str, str]]]:
        with self._lock:
            return self._llm_history[:], self._display_history[:]

    def clear_histories(self) -> None:
        with self._lock:
            self._llm_history = []
            self._display_history = []
            self._save_to_disk()

    def append_message(self, llm_message: Dict[str, str], display_message: Dict[str, str]) -> None:
        with self._lock:
            self._llm_history.append(llm_message)
            self._display_history.append(display_message)
            self._save_to_disk()

    def truncate_histories(self, index: int) -> None:
        with self._lock:
            self._llm_history = self._llm_history[:index]
            self._display_history = self._display_history[:index]
            self._save_to_disk()
