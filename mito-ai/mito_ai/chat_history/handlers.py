# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import tornado
from typing import List
from jupyter_server.base.handlers import APIHandler
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import ChatThreadMetadata


class ThreadHandler(APIHandler):
    """
    Endpoints for working with chat history threads.
    """

    # @tornado.web.authenticated
    def get(self) -> None:
        """Get all chat history threads."""
        try:
            # Get the global message history instance
            message_history = GlobalMessageHistory()
            
            # Get the list of threads
            threads: List[ChatThreadMetadata] = message_history.get_threads()
            
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

