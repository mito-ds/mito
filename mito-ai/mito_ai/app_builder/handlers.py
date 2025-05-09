# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import time
import logging
import asyncio
from typing import Any

from mito_ai.utils.create import initialize_user
from mito_ai.utils.websocket_base import BaseWebSocketHandler
from mito_ai.app_builder.models import (
    BuildAppReply,
    AppBuilderError,
    ErrorMessage,
    MessageType
)
from mito_ai.logger import get_logger


class AppBuilderHandler(BaseWebSocketHandler):
    """Handler for app building requests."""
    
    def initialize(self) -> None:
        """Initialize the WebSocket handler."""
        super().initialize()
        self.log.debug("Initializing app builder websocket connection %s", self.request.path)
    
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()
    
    async def get(self, *args: Any, **kwargs: Any) -> None:
        """Get an event to open a socket or check service availability."""
        # Check if this is just a service availability check
        if self.get_query_argument('check_availability', None) == 'true':
            self.set_status(200)
            self.finish()
            return

        await super().pre_get()  # Authenticate and authorize
        initialize_user()  # Initialize user directory structure
        
        reply = super().get(*args, **kwargs)
        if reply is not None:
            await reply
    
    async def on_message(self, message: str) -> None:
        """Handle incoming messages on the WebSocket.
        
        Args:
            message: The message received on the WebSocket.
        """
        start = time.time()
        self.log.debug("App builder message received: %s", message)
        
        print("IN THE ON MESSAGE")
        
        try:
            parsed_message = self.parse_message(message)
            message_type = parsed_message.get('type')
            
            if message_type == MessageType.BUILD_APP.value:
                # Handle build app request
                # await self._handle_build_app(parsed_message)
                print('hi')
            else:
                self.log.error(f"Unknown message type: {message_type}")
                error = AppBuilderError(
                    error_type="InvalidRequest",
                    title=f"Unknown message type: {message_type}"
                )
                self.reply(ErrorMessage(**error.__dict__))
                
        except ValueError as e:
            self.log.error("Invalid app builder request", exc_info=e)
            error = AppBuilderError.from_exception(e)
            self.reply(ErrorMessage(**error.__dict__))
        except Exception as e:
            self.log.error("Error handling app builder message", exc_info=e)
            error = AppBuilderError.from_exception(
                e, 
                hint="An error occurred while building the app. Please check the logs for details."
            )
            self.reply(ErrorMessage(**error.__dict__))
            
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"App builder handler processed in {latency_ms} ms.")
    
    async def _handle_build_app(self, message: dict) -> None:
        """Handle a build app request.
        
        Args:
            message: The parsed message.
        """
        message_id = message.get('message_id', '')  # Default to empty string if not present
        app_path = message.get('path')
        
        if not message_id:
            self.log.error("Missing message_id in request")
            return
        
        if not app_path:
            error = AppBuilderError(
                error_type="InvalidRequest",
                title="Missing 'path' parameter"
            )
            self.reply(BuildAppReply(
                parent_id=message_id,
                url="",
                error=error
            ))
            return
        
        try:
            # This is a placeholder for the actual app building logic
            # In a real implementation, this would deploy the app to a hosting service
            # and return the URL
            deploy_url = await self._deploy_app(app_path)
            
            # Send the response
            self.reply(BuildAppReply(
                parent_id=message_id,
                url=deploy_url
            ))
            
        except Exception as e:
            self.log.error(f"Error building app: {e}", exc_info=e)
            error = AppBuilderError.from_exception(e)
            self.reply(BuildAppReply(
                parent_id=message_id,
                url="",
                error=error
            ))
    
    async def _deploy_app(self, app_path: str) -> str:
        """Deploy the app to a hosting service.
        
        Args:
            app_path: Path to the app file.
            
        Returns:
            The URL of the deployed app.
        """
        # This is a placeholder implementation
        # In a real implementation, this would deploy the app to a hosting service
        # For now, we'll just return a fake URL
        
        # TODO: Implement actual deployment logic
        # For example, using Streamlit sharing, Heroku, or a custom service
        
        # Simulate a delay for deployment
        await asyncio.sleep(2)
        
        # For testing, return a placeholder URL
        return f"https://example.com/app/{os.path.basename(app_path)}"
