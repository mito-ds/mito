# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from typing import List
from jupyter_server.base.handlers import APIHandler
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.utils.anthropic_utils import FAST_ANTHROPIC_MODEL
from mito_ai.completions.models import MessageType
from mito_ai.completions.prompt_builders.chart_conversion_prompt import create_chart_conversion_prompt

class ChartWizardHandler(APIHandler):
    def initialize(self, llm: OpenAIProvider) -> None:
        """Initialize the handler with the LLM provider."""
        super().initialize()
        self._llm = llm

    @tornado.web.authenticated
    async def post(self) -> None:
        """POST endpoint that receives code from the frontend and sends it to LLM."""
        try:
            data = json.loads(self.request.body.decode('utf-8'))
            code = data.get('code', '')
            
            # Create prompt using the prompt builder
            prompt = create_chart_conversion_prompt(code)
            
            # Call LLM
            messages: List[ChatCompletionMessageParam] = [{"role": "user", "content": prompt}]
            converted_code = await self._llm.request_completions(
                messages=messages,
                model=FAST_ANTHROPIC_MODEL,
                message_type=MessageType.CHAT,
                thread_id=None
            )
            
            # Return the converted code
            self.write({
                "message": "Code converted successfully",
                "converted_code": converted_code
            })
            self.finish()
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
            self.finish()
