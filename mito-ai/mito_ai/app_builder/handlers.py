# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import time
import logging
from typing import Any, Union
import zipfile
import tempfile
from mito_ai.utils.create import initialize_user
from mito_ai.utils.websocket_base import BaseWebSocketHandler
from mito_ai.app_builder.models import (
    BuildAppReply,
    AppBuilderError,
    ErrorMessage,
    MessageType
)
from mito_ai.logger import get_logger
import requests

# API endpoint for getting pre-signed URL
API_BASE_URL = "https://fr12uvtfy5.execute-api.us-east-1.amazonaws.com"

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
    
    async def on_message(self, message: Union[str, bytes]) -> None:
        """Handle incoming messages on the WebSocket.
        
        Args:
            message: The message received on the WebSocket.
        """
        start = time.time()
        
        # Convert bytes to string if needed
        if isinstance(message, bytes):
            message = message.decode('utf-8')
        
        self.log.debug("App builder message received: %s", message)
        
        try:
            parsed_message = self.parse_message(message)
            message_type = parsed_message.get('type')
            
            if message_type == MessageType.BUILD_APP.value:
                # Handle build app request
                await self._handle_build_app(parsed_message)
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
        """Deploy the app using pre-signed URLs.
        
        Args:
            app_path: Path to the app file.
            
        Returns:
            The URL of the deployed app.
        """
        # Get app name from the path
        app_name = os.path.basename(app_path).split('.')[0]
        self.log.info(f"Deploying app: {app_name} from path: {app_path}")
        
        try:
            # Step 1: Get pre-signed URL from API
            self.log.info("Getting pre-signed upload URL...")
            url_response = requests.get(f"{API_BASE_URL}/get-upload-url?app_name={app_name}")
            url_response.raise_for_status()
            
            url_data = url_response.json()
            presigned_url = url_data['upload_url']
            expected_app_url = url_data['expected_app_url']
            
            self.log.info(f"Received pre-signed URL. App will be available at: {expected_app_url}")
            
            # Step 2: Create a zip file of the app.
            temp_zip_path = None
            try:
                # Create temp file and close it before writing to avoid file handle conflicts
                with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                    temp_zip_path = temp_zip.name

                self.log.info("Zipping application files...")
                with zipfile.ZipFile(temp_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, _, files in os.walk(app_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            zipf.write(file_path, arcname=os.path.relpath(file_path, app_path))

                upload_response = await self._upload_app_to_s3(temp_zip_path, presigned_url)
            except Exception as e:
                self.log.error(f"Error zipping app: {e}")
                raise
            finally:
                # Clean up
                if temp_zip_path is not None:
                    os.remove(temp_zip_path)
            
            self.log.info(f"Upload successful! Status code: {upload_response.status_code}")
            
            self.log.info(f"Deployment initiated. App will be available at: {expected_app_url}")
            return expected_app_url # type: ignore
            
        except requests.exceptions.RequestException as e:
            self.log.error(f"Error during API request: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    self.log.error(f"Server error details: {error_detail}")
                except:
                    self.log.error(f"Server response: {e.response.text}")
            raise Exception(f"Deployment failed: {str(e)}")
        except Exception as e:
            self.log.error(f"Error during deployment: {str(e)}")
            raise

    async def _upload_app_to_s3(self, app_path: str, presigned_url: str) -> requests.Response:
        """Upload the app to S3 using the presigned URL."""
        with open(app_path, 'rb') as file_data:
            upload_response = requests.put(
                presigned_url,
                data=file_data,
                headers={'Content-Type': 'application/zip'}
            )
            upload_response.raise_for_status()
            
        return upload_response