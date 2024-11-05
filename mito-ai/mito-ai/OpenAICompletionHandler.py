import os
import openai
from jupyter_server.base.handlers import APIHandler
from tornado import web
import json
from openai import OpenAI


# This handler is responsible for the mito_ai/completion endpoint. 
# It takes a message from the user, sends it to the OpenAI API, and returns the response.
# Important: Because this is a server extension, print statements are sent to the 
# jupyter server terminal by default (ie: the terminal you ran `jupyter lab`)
class OpenAICompletionHandler(APIHandler):
    @web.authenticated
    def post(self):
        # Retrieve the message from the request
        data = self.get_json_body()
        messages = data.get('messages', '')

        # Get the OpenAI API key from environment variables
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            # If the API key is not set, return a 401 unauthorized error
            self.set_status(401)
            self.finish(json.dumps({"response": "OPENAI_API_KEY not set"}))
            return

        # Set up the OpenAI client
        openai.api_key = openai_api_key
        client = OpenAI()

        try:
            # Query OpenAI API
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )

            response_dict = response.to_dict()

            # Send the response back to the frontend
            # TODO: In the future, instead of returning the raw response, 
            # return a cleaned up version of the response so we can support
            # multiple models 

            self.finish(json.dumps(response_dict))
        except Exception as e:
            self.set_status(500)
            self.finish(json.dumps({"response": f"Error: {str(e)}"}))