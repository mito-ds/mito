import os
import json
from threading import Lock
from typing import Dict, List

from .utils.schema import MITO_FOLDER

class GlobalMessageHistory:
    """
    Manages a global message history with thread-safe access.

    This class ensures thread-safe operations for reading, writing, and 
    modifying message histories using a Lock object. It supports loading 
    from and saving to disk, appending new messages, clearing histories, 
    and truncating histories.

    Thread safety is crucial to prevent data corruption and race conditions 
    when multiple threads access or modify the message histories concurrently.

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
                    self._llm_history = data.get("llm_history", [])
                    self._display_history = data.get("display_history", [])
            except Exception as e:
                print(f"Error loading history file: {e}")
    
    def _save_to_disk(self):
        """Save current history to disk."""
        data = {
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
