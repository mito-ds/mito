from jupyter_server.base.handlers import APIHandler
from tornado import web
import json
from .utils.open_ai_utils import get_open_ai_completion


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

        try:
            # Query OpenAI API
            response = get_open_ai_completion(messages)
            self.finish(json.dumps(response))
        except PermissionError as e:
            # Raise a PermissionError when the user has 
            # reached the free tier limit for Mito AI.
            self.set_status(403)
            self.finish()
        except Exception as e:
            # Catch all other exceptions and return a 500 error
            self.set_status(500)
            self.finish()
