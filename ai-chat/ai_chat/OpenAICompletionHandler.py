import os
import openai
from jupyter_server.base.handlers import APIHandler
from tornado import web
import json
from openai import OpenAI

client = OpenAI()

class OpenAICompletionHandler(APIHandler):
    @web.authenticated
    def post(self):

        print('Aaron5')
        # Retrieve the message from the request
        data = self.get_json_body()
        user_message = data.get('message', '')

        # Get the OpenAI API key from environment variables
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            self.set_status(500)
            self.finish(json.dumps({"response": "OPENAI_API_KEY not set"}))
            return

        # Set up the OpenAI client
        openai.api_key = openai_api_key

        try:
            # Query OpenAI API
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": user_message}
                ]
            )

            print('Aaron6!', response)

            response_dict = response.to_dict()

            print('Aaron7', response_dict)

            # Send the response back to the frontend
            self.finish(json.dumps(response_dict))
        except Exception as e:
            print('Aaron6', e)
            self.set_status(500)
            self.finish(json.dumps({"response": f"Error: {str(e)}"}))