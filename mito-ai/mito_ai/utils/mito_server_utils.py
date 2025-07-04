from mito_ai.completions.models import MessageType
from mito_ai.utils.server_limits import update_mito_server_quota
from tornado.httpclient import HTTPResponse
import time
import json
from typing import Any, Dict, Optional
from mito_ai.constants import MITO_GEMINI_URL
from mito_ai.utils.utils import _create_http_client


class ProviderCompletionException(Exception):
    """Custom exception for Mito server errors that converts well to CompletionError."""
    
    def __init__(self, error_message: str, error_type: str = "LLMProviderError"):
        self.error_message = error_message
        self.error_type = error_type
        
        # Create a body attribute that mimics OpenAI's error structure
        # This will be picked up by CompletionError.from_exception()
        self.body = {
            "message": error_message,
            "type": error_type
        }
        
        # Set args[0] for fallback compatibility
        super().__init__(error_message)

    def __str__(self):
        return f"{self.error_type}: {self.error_message}"


async def get_response_from_mito_server(
    url: str, 
    headers: dict, 
    data: Dict[str, Any],
    timeout: int, 
    max_retries: int,
    message_type: MessageType
) -> str:
    """
    Get a response from the Mito server.
    
    Raises:
        ProviderCompletionException: When the server returns an error or invalid response
        Exception: For network/HTTP errors (let these bubble up to be handled by retry logic)
    """
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
        # TODO: Update with model name
        print(f"Mito server request completed in {time.time() - start_time:.2f} seconds")
        
        # Parse and validate response
        try:
            content = json.loads(res.body.decode("utf-8"))
            
            if "completion" in content:
                # Success! Update quota and return
                update_mito_server_quota(message_type)
                return content["completion"]
            elif "error" in content:
                # Server returned an error
                raise ProviderCompletionException(f"Server error: {content['error']}")
            else:
                # Invalid response format - this shouldn't be retried
                raise ProviderCompletionException(f"No completion found in response: {content}")
        except Exception as e:
            raise ProviderCompletionException(f"str(e)")
            
    finally:
        http_client.close()
        
    