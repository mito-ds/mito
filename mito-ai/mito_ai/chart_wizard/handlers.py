# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import MessageType


class ChartWizardHandler(APIHandler):
    def initialize(self, llm: OpenAIProvider) -> None:
        """Initialize the handler with the LLM provider."""
        super().initialize()
        self._llm = llm

    @tornado.web.authenticated
    def get(self) -> None:
        """Simple GET endpoint that returns hello world."""
        self.write({"message": "hello world"})
        self.finish()

    @tornado.web.authenticated
    async def post(self) -> None:
        """POST endpoint that receives code from the frontend and sends it to LLM."""
        try:
            data = json.loads(self.request.body.decode('utf-8'))
            code = data.get('code', '')
            
            # Hardcoded values for now
            model = "gpt-4.1"  # Default model
            prompt = f"""Convert the following matplotlib chart code to use configurable variables that can be edited in a UI.
The chart should remain visually unchanged, but the code should be refactored to use variables for customizable parameters.

Here is the code:
```python
{code}
```

Return only the converted Python code, with no explanations or markdown formatting."""
            
            # Call LLM
            messages = [{"role": "user", "content": prompt}]
            converted_code = await self._llm.request_completions(
                messages=messages,
                model=model,
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
