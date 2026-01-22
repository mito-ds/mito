# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from typing import List
from jupyter_server.base.handlers import APIHandler
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.provider_manager import ProviderManager
from mito_ai.completions.models import MessageType
from mito_ai.completions.prompt_builders.chart_conversion_prompt import (
    create_chart_conversion_prompt,
)
from mito_ai.completions.prompt_builders.chart_add_field_prompt import (
    create_chart_add_field_prompt,
)


class ConvertChartHandler(APIHandler):
    def initialize(self, llm: ProviderManager) -> None:
        """Initialize the handler with the LLM provider."""
        super().initialize()
        self._llm = llm

    @tornado.web.authenticated
    async def post(self) -> None:
        """POST endpoint that receives code from the frontend and sends it to LLM."""
        try:
            data = json.loads(self.request.body.decode("utf-8"))
            code = data.get("code", "")

            # Create prompt using the prompt builder
            prompt = create_chart_conversion_prompt(code)

            # Call LLM
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": prompt}
            ]
            converted_code = await self._llm.request_completions(
                messages=messages,
                message_type=MessageType.CHAT,
                thread_id=None,
                use_fast_model=True,
            )

            # Return the converted code
            self.write(
                {
                    "message": "Code converted successfully",
                    "converted_code": converted_code,
                }
            )
            self.finish()
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
            self.finish()


class AddFieldHandler(APIHandler):
    def initialize(self, llm: ProviderManager) -> None:
        """Initialize the handler with the LLM provider."""
        super().initialize()
        self._llm = llm

    @tornado.web.authenticated
    async def post(self) -> None:
        """POST endpoint that adds a new field to the chart configuration."""
        try:
            data = json.loads(self.request.body.decode("utf-8"))
            code = data.get("code", "")
            user_description = data.get("user_description", "")
            existing_variables = data.get("existing_variables", [])

            if not user_description:
                self.set_status(400)
                self.write({"error": "user_description is required"})
                self.finish()
                return

            # Create prompt using the prompt builder
            prompt = create_chart_add_field_prompt(
                code, user_description, existing_variables
            )

            # Call LLM
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": prompt}
            ]
            updated_code = await self._llm.request_completions(
                messages=messages,
                message_type=MessageType.CHAT,
                thread_id=None,
                use_fast_model=True,
            )

            # Return the updated code
            self.write(
                {"message": "Field added successfully", "updated_code": updated_code}
            )
            self.finish()
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
            self.finish()
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
            self.finish()
