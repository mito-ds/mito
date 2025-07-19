# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import requests
import tornado
from datetime import datetime, timezone
from jupyter_server.base.handlers import APIHandler
from mito_ai.logger import get_logger
from mito_ai.constants import ACTIVE_COGNITO_CONFIG
from typing import Dict, Any


class AuthHandler(APIHandler):
    """Handler for authentication operations."""
    
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()
    
    @tornado.web.authenticated
    def post(self) -> None:
        """Exchange authorization code for JWT tokens."""
        try:
            data = json.loads(self.request.body)
            code = data.get('code')
            
            if not code:
                self.set_status(400)
                self.finish(json.dumps({"error": "Authorization code is required"}))
                return
            
            # Exchange authorization code for tokens
            token_response = self._exchange_code_for_tokens(code)
            
            if token_response.get('error'):
                self.set_status(400)
                self.finish(json.dumps({"error": token_response['error']}))
                return
            
            # Return the tokens to the client
            self.finish(json.dumps({
                "access_token": token_response.get('access_token'),
                "id_token": token_response.get('id_token'),
                "refresh_token": token_response.get('refresh_token'),
                "expires_in": token_response.get('expires_in')
            }))
            
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "Invalid JSON in request body"}))
        except Exception as e:
            self.log.error(f"Error in auth handler: {e}")
            self.set_status(500)
            self.finish(json.dumps({"error": "Internal server error"}))
    
    def _exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for JWT tokens using AWS Cognito."""
        try:
            # Prepare the token request
            token_data = {
                'grant_type': 'authorization_code',
                'client_id': ACTIVE_COGNITO_CONFIG['CLIENT_ID'],
                'code': code,
                'redirect_uri': ACTIVE_COGNITO_CONFIG['REDIRECT_URI']
            }
            
            # Add client secret if configured
            if ACTIVE_COGNITO_CONFIG['CLIENT_SECRET']:
                token_data['client_secret'] = ACTIVE_COGNITO_CONFIG['CLIENT_SECRET']
            
            # Make the token request
            response = requests.post(
                ACTIVE_COGNITO_CONFIG['TOKEN_ENDPOINT'],
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                token_response: Dict[str, Any] = response.json()
                
                current_time = datetime.now(timezone.utc)
                self.log.info(f"Token exchange successful at {current_time.isoformat()}")
                return token_response
            else:
                self.log.error(f"Token exchange failed: {response.status_code} - {response.text}")
                return {"error": "Failed to exchange authorization code for tokens"}
                
        except requests.exceptions.RequestException as e:
            self.log.error(f"Request error during token exchange: {e}")
            return {"error": "Network error during token exchange"}
        except Exception as e:
            self.log.error(f"Unexpected error during token exchange: {e}")
            return {"error": "Unexpected error during token exchange"}
