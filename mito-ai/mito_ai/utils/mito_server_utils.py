# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import time
from typing import Any, Dict, Optional, Callable, Union, AsyncGenerator
from mito_ai.completions.models import MessageType, CompletionReply, CompletionStreamChunk, CompletionItem
from mito_ai.utils.server_limits import check_mito_server_quota, update_mito_server_quota
from tornado.httpclient import HTTPResponse
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


async def stream_response_from_mito_server(
    url: str,
    headers: Dict[str, str],
    data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
    message_id: str,
    chunk_processor: Optional[Callable[[str], str]] = None,
    provider_name: str = "Mito Server",
) -> AsyncGenerator[str, None]:
    """
    Stream responses from the Mito server.
    
    This is a unified streaming function that can be used by all providers (OpenAI, Anthropic, Gemini).
    
    Args:
        url: The Mito server URL to stream from
        headers: Request headers
        data: Request data
        timeout: Request timeout in seconds
        max_retries: Maximum number of retries
        message_type: The message type for quota tracking
        provider_name: Name of the provider for error messages
        reply_fn: Optional function to call with each chunk for streaming replies
        message_id: The message ID to track the request
        chunk_processor: Optional function to process chunks before yielding (e.g., for Gemini's special processing)
        
    Yields:
        Chunks of text from the streaming response
    """
    # Check the mito server quota
    check_mito_server_quota(message_type)
    
    # Create HTTP client with appropriate timeout settings
    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    
    # Set up streaming infrastructure
    start_time = time.time()
    chunk_queue: asyncio.Queue[str] = asyncio.Queue()
    fetch_complete = False
    
    # Define a callback to process chunks and add them to the queue
    def chunk_callback(chunk: bytes) -> None:
        try:
            chunk_str = chunk.decode('utf-8')
            asyncio.create_task(chunk_queue.put(chunk_str))
        except Exception as e:
            print(f"Error processing {provider_name} streaming chunk: {str(e)}")
    
    # Execute the streaming request
    fetch_future = None
    try:
        fetch_future = http_client.fetch(
            url, 
            method="POST", 
            headers=headers, 
            body=json.dumps(data), 
            request_timeout=http_client_timeout,
            streaming_callback=chunk_callback
        )
        
        # Create a task to wait for the fetch to complete
        async def wait_for_fetch() -> None:
            try:
                await fetch_future
                nonlocal fetch_complete
                fetch_complete = True
                print(f"{provider_name} fetch completed")
            except Exception as e:
                print(f"Error in {provider_name} fetch: {str(e)}")
                raise
        
        # Start the task to wait for fetch completion
        fetch_task = asyncio.create_task(wait_for_fetch())
        
        # Yield chunks as they arrive
        while not (fetch_complete and chunk_queue.empty()):
            try:
                # Wait for a chunk with a timeout to prevent deadlocks
                chunk = await asyncio.wait_for(chunk_queue.get(), timeout=0.1)
                
                # Process chunk if processor is provided
                processed_chunk = chunk
                if chunk_processor:
                    processed_chunk = chunk_processor(chunk)

                if reply_fn is not None and message_id is not None:
                    # Send the chunk directly to the frontend
                    reply_fn(CompletionStreamChunk(
                        parent_id=message_id,
                        chunk=CompletionItem(
                            content=processed_chunk,
                            isIncomplete=True,
                            token=message_id,
                        ),
                        done=False,
                    ))
                
                yield chunk
            except asyncio.TimeoutError:
                # No chunk available within timeout, check if fetch is complete
                if fetch_complete and chunk_queue.empty():
                    break
                
                # Otherwise continue waiting for chunks
                continue
                
        print(f"\n{provider_name} stream completed in {time.time() - start_time:.2f} seconds")
        
        if reply_fn is not None and message_id is not None:
            # Send a final chunk to indicate completion
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="",
                    isIncomplete=False,
                    token=message_id,
                ),
                done=True,
            ))
    except Exception as e:
        print(f"\n{provider_name} stream failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        # If an exception occurred, ensure the fetch future is awaited to properly clean up
        if fetch_future:
            try:
                await fetch_future
            except Exception:
                pass
        raise
    finally:
        # Clean up resources
        try:
            # We always update the quota, even if there is an error
            update_mito_server_quota(message_type)
        except Exception as e:
            pass
        
        http_client.close()
        
    