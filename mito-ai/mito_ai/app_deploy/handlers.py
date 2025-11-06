# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import time
import logging
from typing import Any, Union, List, Optional
import tempfile
from mito_ai.path_utils import AbsoluteNotebookDirPath, AppFileName, does_app_path_exist, get_absolute_app_path, get_absolute_notebook_dir_path, get_absolute_notebook_path, get_app_file_name
from mito_ai.utils.create import initialize_user
from mito_ai.utils.error_classes import StreamlitDeploymentError
from mito_ai.utils.version_utils import is_pro
from mito_ai.utils.websocket_base import BaseWebSocketHandler
from mito_ai.app_deploy.app_deploy_utils import  add_files_to_zip
from mito_ai.app_deploy.models import (
    DeployAppReply,
    AppDeployError,
    DeployAppRequest,
    ErrorMessage,
)
from mito_ai.completions.models import MessageType
from mito_ai.logger import get_logger
from mito_ai.constants import ACTIVE_STREAMLIT_BASE_URL
from mito_ai.utils.telemetry_utils import log_streamlit_app_deployment_failure
import requests
import traceback


class AppDeployHandler(BaseWebSocketHandler):
    """Handler for app deploy requests."""
    
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
            
            if message_type == MessageType.DEPLOY_APP.value:
                # Handle build app request
                deploy_app_request = DeployAppRequest(**parsed_message)
                response = await self._handle_deploy_app(deploy_app_request)
                self.reply(response)
            else:
                self.log.error(f"Unknown message type: {message_type}")
                error = AppDeployError(
                    error_type="InvalidRequest",
                    message=f"Unknown message type: {message_type}",
                    error_code=400
                )
                raise StreamlitDeploymentError(error)

        except StreamlitDeploymentError as e:
            self.log.error("Invalid app builder request", exc_info=e)
            log_streamlit_app_deployment_failure('mito_server_key', MessageType.DEPLOY_APP, e.error.__dict__)
            self.reply(
                DeployAppReply(
                        parent_id=e.message_id,
                        url="",
                        error=ErrorMessage(**e.error.__dict__)
                    )
            )
        except Exception as e:
            self.log.error("Error handling app builder message", exc_info=e)
            error = AppDeployError.from_exception(
                e, 
                hint="An error occurred while building the app. Please check the logs for details."
            )
            log_streamlit_app_deployment_failure('mito_server_key', MessageType.DEPLOY_APP, error.__dict__)
            self.reply(ErrorMessage(**error.__dict__))
            
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"App builder handler processed in {latency_ms} ms.")
    
    async def _handle_deploy_app(self, message: DeployAppRequest) -> DeployAppReply:
        """Handle a build app request.
        
        Args:
            message: The parsed message.
        """
        message_id = message.message_id
        notebook_path = message.notebook_path
        notebook_id = message.notebook_id
        jwt_token = message.jwt_token
        files_to_upload = message.selected_files
        
        # Validate parameters
        missing_required_parameters = []
        if not message_id:
            missing_required_parameters.append('message_id')
        if not notebook_id:
            missing_required_parameters.append('notebook_id')
        if not notebook_path:
            missing_required_parameters.append('notebook_path')
            
        if len(missing_required_parameters) > 0:
            error_message = f"Missing required request parameters: {', '.join(missing_required_parameters)}"
            self.log.error(error_message)
            error = AppDeployError(
                error_type="BadRequest",
                message=error_message,
                error_code=400,
                message_id=message_id
            )
            raise StreamlitDeploymentError(error)

        # Validate JWT token if provided
        token_preview = jwt_token[:20] if jwt_token else "No token provided"
        self.log.info(f"Validating JWT token: {token_preview}...")
        is_valid = self._validate_jwt_token(jwt_token) if jwt_token else False
        if not is_valid or not jwt_token:
            self.log.error("JWT token validation failed")
            error = AppDeployError(
                error_type="Unauthorized",
                message="Invalid authentication token",
                hint="Please sign in again to deploy your app.",
                error_code=401,
                message_id=message_id
            )
            raise StreamlitDeploymentError(error)
        else:
            self.log.info("JWT token validation successful")

        notebook_path = str(notebook_path) if notebook_path else ""
        absolute_notebook_path = get_absolute_notebook_path(notebook_path)
        absolute_app_directory = get_absolute_notebook_dir_path(absolute_notebook_path)
        app_file_name = get_app_file_name(notebook_id)
        app_path = get_absolute_app_path(absolute_app_directory, app_file_name)

        # Check if the app.py file exists
        app_path_exists = does_app_path_exist(app_path)
        if not app_path_exists:
            error = AppDeployError(
                error_type="AppNotFound",
                message="App not found",
                hint=f"Please make sure the {app_file_name} file exists in the same directory as the notebook.",
                error_code=400,
                message_id=message_id
            )
            raise StreamlitDeploymentError(error)

        # Finally, deploy the app
        deploy_url = await self._deploy_app(
            absolute_app_directory, 
            app_file_name,
            files_to_upload, 
            message_id,
            jwt_token
        )

        # Send the response
        return DeployAppReply(
            parent_id=message_id,
            url=deploy_url if deploy_url else ""
        )
        

    def _validate_jwt_token(self, token: str) -> bool:
        """Basic JWT token validation logic.

        In a production environment, you would:
        1. Decode the JWT token
        2. Verify the signature using AWS Cognito public keys
        3. Check the expiration time
        4. Validate the issuer and audience claims

        For now, we'll do a basic check that the token exists and has a reasonable format.
        """
        try:
            # Basic JWT format validation (header.payload.signature)
            if not token or '.' not in token:
                self.log.error("Token is empty or missing dots")
                return False

            parts = token.split('.')
            if len(parts) != 3:
                self.log.error("Token does not have 3 parts")
                return False

            # Check for placeholder token
            if token == 'placeholder-jwt-token':
                self.log.error("Placeholder token detected")
                return False

            return True

        except Exception as e:
            self.log.error(f"Error validating JWT token: {e}")
            return False


    async def _deploy_app(
        self,
        absolute_notebook_dir_path: AbsoluteNotebookDirPath, 
        app_file_name: AppFileName, 
        files_to_upload:List[str], 
        message_id: str, 
        jwt_token: str = ''
    ) -> Optional[str]:
        
        """Deploy the app using pre-signed URLs.
        
        Args:
            app_path: Path to the app file.
            files_to_upload: Files the user selected to upload for the app to run
            jwt_token: JWT token for authentication (optional)

        Returns:
            The URL of the deployed app.
        """
        # Get app name from the path without the file type ending 
        # ie: if the file is my-app.py, this variable is just my-app
        # We use it in the app url
        app_file_name_no_file_extension_ending = app_file_name.split('.')[0]
        self.log.info(f"Deploying app: {app_file_name} from path: {absolute_notebook_dir_path}")
        
        try:
            # Step 1: Get pre-signed URL from API
            self.log.info("Getting pre-signed upload URL...")

            # Prepare headers with JWT token if provided
            headers = {}
            if jwt_token and jwt_token != 'placeholder-jwt-token':
                headers['Authorization'] = f'Bearer {jwt_token}'
            else:
                self.log.warning("No JWT token provided for API request")

            headers["Subscription-Tier"] = 'Pro' if is_pro() else 'Standard'

            url_response = requests.get(f"{ACTIVE_STREAMLIT_BASE_URL}/get-upload-url?app_name={app_file_name_no_file_extension_ending}", headers=headers)
            url_response.raise_for_status()
            
            url_data = url_response.json()
            presigned_url = url_data['upload_url']
            expected_app_url = url_data['expected_app_url']
            
            self.log.info(f"Received pre-signed URL. App will be available at: {expected_app_url}")

            # Step 2: Create a zip file of the app.
            temp_zip_path = None
            try:
                # Create temp file
                with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
                    temp_zip_path = temp_zip.name

                self.log.info("Zipping application files...")
                add_files_to_zip(temp_zip_path, absolute_notebook_dir_path, files_to_upload, app_file_name, self.log)

                upload_response = await self._upload_app_to_s3(temp_zip_path, presigned_url)
            except Exception as e:
                self.log.error(f"Error zipping app: {e}")
                error = AppDeployError(
                    error_type="ZippingError",
                    message=f"Error zipping app: {e}",
                    traceback=traceback.format_exc(),
                    error_code=500,
                    message_id=message_id
                )
                raise StreamlitDeploymentError(error)
            finally:
                # Clean up
                if temp_zip_path is not None:
                    os.remove(temp_zip_path)
            
            self.log.info(f"Upload successful! Status code: {upload_response.status_code}")
            
            self.log.info(f"Deployment initiated. App will be available at: {expected_app_url}")
            return str(expected_app_url)
            
        except requests.exceptions.RequestException as e:
            self.log.error(f"Error during API request: {e}")
            if hasattr(e, 'response') and e.response is not None:
                error_detail = e.response.json()
                error_message = error_detail.get('error', "")
                self.log.error(f"Server error details: {error_detail}")
            else:
                error_message = str(e)
            
            error = AppDeployError(
                error_type="APIException",
                message=str(error_message),
                traceback=traceback.format_exc(),
                error_code=500,
                message_id=message_id
            )
            raise StreamlitDeploymentError(error)
        except Exception as e:
            self.log.error(f"Error during deployment: {str(e)}")
            error = AppDeployError(
                error_type="DeploymentException",
                message=str(e),
                traceback=traceback.format_exc(),
                error_code=500,
                message_id=message_id
            )
            raise StreamlitDeploymentError(error)

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