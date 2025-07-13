# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import MessageType
from mito_ai.utils.server_limits import check_mito_server_quota, update_mito_server_quota
from tornado.httpclient import HTTPResponse
import time
import json
from typing import Any, Dict, Optional
from mito_ai.constants import MITO_GEMINI_URL
from mito_ai.utils.utils import _create_http_client


class ProviderCompletionException(Exception):
    """Custom exception for Mito server errors that converts well to CompletionError."""
    
    def __init__(self, error_message: str, provider_name: str = "LLM Provider", error_type: str = "LLMProviderError"):
        self.error_message = error_message
        self.provider_name = provider_name
        self.error_type = error_type
        
        # Create user-friendly title and hint
        self.user_friendly_title = f"{provider_name} Error: {error_message}"
        self.user_friendly_hint = f"There was a problem with {provider_name}. Try switching to a different model and trying again."

        # Set args[0] for fallback compatibility
        super().__init__(self.user_friendly_title)

    def __str__(self) -> str:
        return f"{self.provider_name} Error: {self.error_message}"


async def get_response_from_mito_server(
    url: str, 
    headers: dict, 
    data: Dict[str, Any],
    timeout: int, 
    max_retries: int,
    message_type: MessageType,
    provider_name: str = "Mito Server"
) -> str:
    """
    Get a response from the Mito server.
    
    Raises:
        ProviderCompletionException: When the server returns an error or invalid response
        Exception: For network/HTTP errors (let these bubble up to be handled by retry logic)
    """
    # First check the mito server quota. If the user has reached the limit, we raise an exception.
    check_mito_server_quota(message_type)

    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    start_time = time.time()
    
    try:
        res = await http_client.fetch(
            url,
            method="POST",
            headers=headers,
            body=json.dumps(data),
            request_timeout=http_client_timeout
        )
        print(f"Mito server request completed in {time.time() - start_time:.2f} seconds")
        
        # Parse and validate response
        try:
            content = json.loads(res.body.decode("utf-8"))
                        
            if "completion" in content:
                return content["completion"] # type: ignore
            elif "error" in content:
                # Server returned an error
                raise ProviderCompletionException(content['error'], provider_name=provider_name)
            else:
                # Invalid response format
                raise ProviderCompletionException(f"No completion found in response: {content}", provider_name=provider_name)
        except ProviderCompletionException:
            # Re-raise ProviderCompletionException as-is
            raise
        except Exception as e:
            raise ProviderCompletionException(f"Error parsing response: {str(e)}", provider_name=provider_name)
            
    finally:
        try:
            # We always update the quota, even if there is an error
            update_mito_server_quota(message_type)
        except Exception as e:
            pass
        
        http_client.close()
        
    