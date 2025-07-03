from tornado.httpclient import HTTPResponse
import time
import json
from typing import Any, Dict, Optional

from mito_ai.constants import MITO_GEMINI_URL
from mito_ai.utils.utils import _create_http_client


class MitoServerException(Exception):
    """Custom exception for Mito server errors."""
    error_message: str

    def __init__(self, error_message: str):
        self.error_message = error_message

    def __str__(self):
        return self.error_message

async def get_response_from_mito_server(
    url: str, 
    headers: dict, 
    data: Dict[str, Any],
    timeout: int, 
    max_retries: int
) -> str:
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
        print(f"Gemini request completed in {time.time() - start_time:.2f} seconds")
        
        content = json.loads(res.body.decode("utf-8"))
        if "completion" in content:
            return content["completion"]
        elif "error" in content:
            raise MitoServerException(f"{content['error']}")
        else:
            raise MitoServerException(f"No completion found in response: {content}")
    except MitoServerException as e:
        raise e
    except Exception as e:
        raise Exception(f"Error getting response from Mito server: {str(e)}")
    finally:
        http_client.close()
        
    