# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import AsyncGenerator
from google import genai
from mito_ai.models import AgentResponse


class GeminiClient:
    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def generate_content(self, contents: str) -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config={
                "response_mime_type": "application/json",
                "response_schema": AgentResponse
                }
            )
            
            if not response:
                return "No response received from Gemini API"
                
            if hasattr(response, 'text') and response.text:
                return response.text

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

    async def stream_content(self, contents: str) -> AsyncGenerator[str, None]:
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