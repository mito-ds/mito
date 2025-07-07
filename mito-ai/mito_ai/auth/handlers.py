# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import requests
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.logger import get_logger

# AWS Cognito configuration
COGNITO_CONFIG = {
    'TOKEN_ENDPOINT': 'https://mito-app-auth.auth.us-east-1.amazoncognito.com/oauth2/token',
    'CLIENT_ID': '6ara3u3l8sss738hrhbq1qtiqf',
    'CLIENT_SECRET': '',
    'REDIRECT_URI': 'http://localhost:8888/lab'
}

class AuthHandler(APIHandler):
    """Handler for authentication operations."""
    
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()
    
    @tornado.web.authenticated
    def post(self):
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
    
    def _exchange_code_for_tokens(self, code: str) -> dict:
        """Exchange authorization code for JWT tokens using AWS Cognito."""
        try:
            # Prepare the token request
            token_data = {
                'grant_type': 'authorization_code',
                'client_id': COGNITO_CONFIG['CLIENT_ID'],
                'code': code,
                'redirect_uri': COGNITO_CONFIG['REDIRECT_URI']
            }
            
            # Add client secret if configured
            if COGNITO_CONFIG['CLIENT_SECRET']:
                token_data['client_secret'] = COGNITO_CONFIG['CLIENT_SECRET']
            
            # Make the token request
            response = requests.post(
                COGNITO_CONFIG['TOKEN_ENDPOINT'],
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                self.log.error(f"Token exchange failed: {response.status_code} - {response.text}")
                return {"error": "Failed to exchange authorization code for tokens"}
                
        except requests.exceptions.RequestException as e:
            self.log.error(f"Request error during token exchange: {e}")
            return {"error": "Network error during token exchange"}
        except Exception as e:
            self.log.error(f"Unexpected error during token exchange: {e}")
            return {"error": "Unexpected error during token exchange"}

class TokenValidationHandler(APIHandler):
    """Handler for JWT token validation."""
    
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()
    
    @tornado.web.authenticated
    def post(self):
        """Validate a JWT token."""
        try:
            data = json.loads(self.request.body)
            token = data.get('token')
            
            if not token:
                self.set_status(400)
                self.finish(json.dumps({"error": "Token is required"}))
                return
            
            # Validate the token
            is_valid = self._validate_jwt_token(token)
            
            self.finish(json.dumps({
                "valid": is_valid
            }))
            
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "Invalid JSON in request body"}))
        except Exception as e:
            self.log.error(f"Error in token validation: {e}")
            self.set_status(500)
            self.finish(json.dumps({"error": "Internal server error"}))
    
    def _validate_jwt_token(self, token: str) -> bool:
        """Validate a JWT token.
        
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
                return False
            
            parts = token.split('.')
            if len(parts) != 3:
                return False
            
            # TODO: Add proper JWT validation using AWS Cognito public keys
            # For now, just check that it's not a placeholder token
            if token == 'placeholder-jwt-token':
                return False
            
            return True
            
        except Exception as e:
            self.log.error(f"Error validating JWT token: {e}")
            return False 