# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import tornado
from typing import List, Any
from jupyter_server.base.handlers import APIHandler
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import ChatThreadMetadata


class ChatHistoryHandler(APIHandler):
    """
    Endpoints for working with chat history threads.
    """

    def initialize(self, message_history: GlobalMessageHistory) -> None:
        """Initialize the handler with the global message history instance."""
        super().initialize()
        self._message_history = message_history

    @tornado.web.authenticated
    def get(self, *args: Any, **kwargs: Any) -> None:
        """Get all chat history threads or a specific thread by ID."""
        try:
            # Check if a specific thread ID is provided in the URL
            thread_id = kwargs.get("thread_id")

            if thread_id:
                # Get specific thread
                if thread_id in self._message_history._chat_threads:
                    thread = self._message_history._chat_threads[thread_id]
                    thread_data = {
                        "thread_id": thread.thread_id,
                        "name": thread.name,
                        "creation_ts": thread.creation_ts,
                        "last_interaction_ts": thread.last_interaction_ts,
                        "display_history": thread.display_history,
                        "ai_optimized_history": thread.ai_optimized_history,
                    }
                    self.finish(thread_data)
                else:
                    self.set_status(404)
                    self.finish({"error": f"Thread with ID {thread_id} not found"})
            else:
                # Get all threads
                threads: List[ChatThreadMetadata] = self._message_history.get_threads()

                # Convert to dict format for JSON serialization
                threads_data = [
                    {
                        "thread_id": thread.thread_id,
                        "name": thread.name,
                        "creation_ts": thread.creation_ts,
                        "last_interaction_ts": thread.last_interaction_ts,
                    }
                    for thread in threads
                ]

                self.finish({"threads": threads_data})

        except Exception as e:
            self.set_status(500)
            self.finish({"error": str(e)})
