# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import AsyncGenerator, Optional
from google import genai
from mito_ai.models import AgentResponse, ResponseFormatInfo


class GeminiClient:
    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def request_completions(self, contents: str, response_format_info: Optional[ResponseFormatInfo] = None) -> str:
        print("Gemini")
        try:
            if response_format_info:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": AgentResponse
                    }
                )
            else:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents
                )
            
            if not response:
                return "No response received from Gemini API"
                
            if hasattr(response, 'text') and response.text:
                return response.text

            # Attempt to handle different possible response types from the Gemini API:
            # 1. If the response is iterable (e.g., a streaming response), collect and concatenate all chunks.
            # 2. If the response contains 'candidates', extract the first candidate's content, handling both 'parts' and direct content.
            # 3. If neither of the above, return the string representation of the response.

            # Handle streaming response
            if hasattr(response, '__iter__'):
                collected_response = ""
                for chunk in response:
                    if isinstance(chunk, str):
                        collected_response += chunk
                    elif hasattr(chunk, 'text') and chunk.text:
                        collected_response += chunk.text
                    else:
                        collected_response += str(chunk)
                return collected_response

            # Handle candidates response
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    content = candidate.content
                    if hasattr(content, 'parts') and content.parts:
                        return " ".join(str(part) for part in content.parts)
                    return str(content)
                return str(candidate)

            return str(response)

        except Exception as e:
            return f"Error generating content: {str(e)}"

    async def stream_completions(self, contents: str) -> AsyncGenerator[str, None]:
        print("GEMINI")
        try:
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
            ):
                if hasattr(chunk, 'text'):
                    yield chunk.text
                else:
                    yield str(chunk)

        except Exception as e:
            yield f"Error streaming content: {str(e)}"