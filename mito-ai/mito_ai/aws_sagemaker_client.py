# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import re
import boto3
import asyncio
from typing import Dict, Any, Optional, Union, Callable, List
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.completions.models import (
    CompletionError, 
    CompletionItemError,
    ResponseFormatInfo, 
    CompletionReply, 
    CompletionStreamChunk, 
    CompletionItem, 
    MessageType
)
from mito_ai.logger import get_logger

class AWSSageMakerClient:
    """AWS SageMaker client for DeepSeek model completions."""
    
    def __init__(self, region_name: str = "us-east-2", endpoint_name: str = "jumpstart-dft-deepseek-llm-r1-disti-20250811-175834"):
        """
        Initialize the AWS SageMaker client.
        
        Args:
            region_name: AWS region where the SageMaker endpoint is deployed
            endpoint_name: Name of the SageMaker endpoint
        """
        self.region_name = region_name
        self.endpoint_name = endpoint_name
        self.sagemaker_client = boto3.client("sagemaker-runtime", region_name=region_name)
        self.log = get_logger()
        
    def _convert_messages_to_sagemaker_format(self, messages: List[ChatCompletionMessageParam]) -> List[Dict[str, str]]:
        """
        Convert OpenAI-style messages to SageMaker format.
        SageMaker format expects system messages to be included in the conversation flow.
        
        Args:
            messages: List of OpenAI ChatCompletionMessageParam
            
        Returns:
            List of messages in SageMaker format
        """
        sagemaker_messages = []
        
        for message in messages:
            if 'content' not in message:
                continue
                
            role = message.get('role', 'user')
            content = message.get('content', '')
            
            # Handle content that might be a list (for images, etc.)
            if isinstance(content, list):
                # Extract text content from mixed content
                text_parts = []
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        text_parts.append(item.get('text', ''))
                content = ' '.join(text_parts)
            
            # Convert system messages to user messages with clear indication
            # This is because SageMaker/DeepSeek expects system prompts as part of conversation
            if role == 'system':
                sagemaker_messages.append({
                    "role": "user", 
                    "content": f"<system>\n{str(content)}\n</system>"
                })
            else:
                sagemaker_messages.append({
                    "role": role,
                    "content": str(content)
                })
            
        return sagemaker_messages
    
    def _clean_json_response(self, response: str) -> str:
        """
        Clean and extract JSON from the response.
        Sometimes models include extra text before/after the JSON and use single quotes.
        """
        # Try to find the first complete JSON object in the response
        start_idx = response.find('{')
        if start_idx == -1:
            return response
        
        # Find the matching closing brace
        brace_count = 0
        end_idx = start_idx
        
        for i, char in enumerate(response[start_idx:], start_idx):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        if brace_count == 0:  # Found complete JSON object
            json_candidate = response[start_idx:end_idx + 1].strip()
            
            # Fix common JSON issues
            # 1. Replace single quotes with double quotes (but not inside strings)
            fixed_json = self._fix_json_quotes(json_candidate)
            
            # 2. Remove duplicate keys (common issue with the model)
            fixed_json = self._remove_duplicate_keys(fixed_json)
            
            try:
                # Validate that it's valid JSON
                json.loads(fixed_json)
                self.log.debug(f"Extracted and fixed JSON: {fixed_json}")
                return fixed_json
            except json.JSONDecodeError as e:
                self.log.debug(f"Could not fix JSON: {e}, original: {json_candidate}")
                pass
        
        # If we can't find valid JSON, return the original response
        self.log.warning(f"Could not extract valid JSON from response: {response}")
        return response
    
    def _fix_json_quotes(self, json_str: str) -> str:
        """Fix single quotes to double quotes in JSON string."""
        # Simple approach: replace single quotes with double quotes
        # This works for most cases but might fail with strings containing quotes
        return json_str.replace("'", '"')
    
    def _remove_duplicate_keys(self, json_str: str) -> str:
        """Remove duplicate keys from JSON string and fix formatting."""
        try:
            # First, let's try to parse the structure manually for common patterns
            # The model often returns: { type: 'value', message: 'value', type: 'value', message: 'value' }
            # We want to extract the last occurrence of each key
            
            # Extract key-value pairs using regex
            # This pattern matches: key: 'value' or key: "value"
            pattern = r'(\w+):\s*["\']([^"\']*)["\']'
            matches = re.findall(pattern, json_str)
            
            if matches:
                # Build a clean JSON object with unique keys (last occurrence wins)
                unique_pairs = {}
                for key, value in matches:
                    unique_pairs[key] = value
                
                # Construct clean JSON
                clean_json = json.dumps(unique_pairs)
                self.log.debug(f"Rebuilt JSON from pairs: {clean_json}")
                return clean_json
            
            # Fallback: try the original approach
            cleaned = json_str.replace("'", '"')
            # Remove extra spaces after braces
            cleaned = re.sub(r'{\s+', '{', cleaned)
            cleaned = re.sub(r'\s+}', '}', cleaned)
            
            try:
                parsed = json.loads(cleaned)
                return json.dumps(parsed)
            except:
                return cleaned
                
        except Exception as e:
            self.log.debug(f"Error in _remove_duplicate_keys: {e}")
            return json_str.replace("'", '"')
    
    async def request_completions(
        self, 
        messages: List[ChatCompletionMessageParam], 
        model: str, 
        response_format_info: Optional[ResponseFormatInfo] = None, 
        message_type: MessageType = MessageType.CHAT
    ) -> str:
        """
        Request completions from AWS SageMaker endpoint.
        
        Args:
            messages: List of conversation messages
            model: Model name (will use the configured endpoint)
            response_format_info: Optional response format information
            message_type: Type of message being processed
            
        Returns:
            The completion response as a string
        """
        try:
            # Convert messages to SageMaker format
            sagemaker_messages = self._convert_messages_to_sagemaker_format(messages)
            
            # Add structured response instructions if needed
            if response_format_info and response_format_info.name == 'agent_response':
                # Add JSON format instruction to the last user message
                if sagemaker_messages and sagemaker_messages[-1]['role'] == 'user':
                    sagemaker_messages[-1]['content'] += (
                        "\n\nCRITICAL INSTRUCTIONS FOR RESPONSE FORMAT:\n"
                        "1. Respond with ONLY a JSON object, no other text\n"
                        "2. Use exactly this structure:\n"
                        '   {"type": "cell_update", "message": "your explanation", "cell_update": {"type": "modification", "index": 0, "code": "your code"}}\n'
                        "3. For the 'type' field, use only: 'cell_update', 'get_cell_output', or 'finished_task'\n"
                        "4. Write high-quality, professional Python code\n"
                        "5. Make your code comprehensive and well-commented\n"
                        "6. Start response with { and end with }\n"
                        "7. Use double quotes for all JSON strings\n"
                        "8. No duplicate keys allowed\n"
                        "9. Think step by step about the data analysis task"
                    )
            
            # Prepare the payload for SageMaker
            payload = {
                "messages": sagemaker_messages,
                "max_tokens": 8192,
                "temperature": 0.1  # Lower temperature for more consistent responses
            }
            
            self.log.info(f"Sending request to AWS SageMaker endpoint: {self.endpoint_name}")
            self.log.debug(f"Payload: {json.dumps(payload, indent=2)}")
            
            # Make the request to SageMaker
            response = self.sagemaker_client.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType="application/json",
                Body=json.dumps(payload)
            )
            
            # Parse the response
            full_response = response["Body"].read().decode("utf-8")
            self.log.debug(f"Raw response: {full_response}")
            
            try:
                full_response_json = json.loads(full_response)
            except json.JSONDecodeError as e:
                self.log.error(f"Failed to parse JSON response: {e}")
                self.log.error(f"Raw response was: {full_response}")
                raise Exception(f"Invalid JSON response from SageMaker: {e}")
            
            # Extract the completion from the response
            try:
                completion = full_response_json["choices"][0]["message"]["content"]
            except (KeyError, IndexError, TypeError) as e:
                self.log.error(f"Unexpected response structure: {e}")
                self.log.error(f"Response structure: {full_response_json}")
                raise Exception(f"Unexpected response format from SageMaker: {e}")
            
            # If we expected a structured response, try to clean it up
            if response_format_info and response_format_info.name == 'agent_response':
                completion = self._clean_json_response(completion)
            
            self.log.info("Successfully received response from AWS SageMaker")
            self.log.debug(f"Final completion: {completion}")
            return completion
            
        except Exception as e:
            self.log.error(f"Error in AWS SageMaker request_completions: {e}")
            raise Exception(f"AWS SageMaker completion failed: {str(e)}")
    
    async def stream_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        message_id: str,
        message_type: MessageType,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]
    ) -> str:
        """
        Stream completions from AWS SageMaker endpoint.
        Note: SageMaker doesn't support streaming by default, so we'll simulate it
        by getting the full response and sending it as a single chunk.
        
        Args:
            messages: List of conversation messages
            model: Model name
            message_id: Unique message identifier
            message_type: Type of message being processed
            reply_fn: Callback function to send streaming chunks
            
        Returns:
            The complete response as a string
        """
        try:
            # Get the full completion (SageMaker doesn't support streaming)
            completion = await self.request_completions(messages, model, None, message_type)
            
            # Send the completion as a single streaming chunk
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content=completion,
                    isIncomplete=False,
                    token=message_id
                ),
                done=True
            ))
            
            return completion
            
        except Exception as e:
            self.log.error(f"Error in AWS SageMaker stream_completions: {e}")
            # Send error chunk
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="",
                    isIncomplete=True,
                    error=CompletionItemError(message=f"AWS SageMaker error: {str(e)}"),
                    token=message_id
                ),
                done=True,
                error=CompletionError.from_exception(e)
            ))
            raise
