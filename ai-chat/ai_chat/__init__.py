from jupyter_server.utils import url_path_join
from .OpenAICompletionHandler import OpenAICompletionHandler
from pathlib import Path
import json

try:
    from _version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'ai_chat' outside a proper installation.")
    __version__ = "dev"


HERE = Path(__file__).parent.resolve()

print("RUNNING THIS CODE")

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)
    print("HERE1")
    print(data)

def _jupyter_labextension_paths():
    print("HERE2")
    return [{
        "src": "labextension",
        "dest": "ai_chat"
    }]

def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata describing
    where to find the `_load_jupyter_server_extension` function.
    """
    print("HERE3")
    return [{"module": "ai_chat"}]

# Jupyter Lab uses Jupyter Server -- it is the backend the handles all the API's 
# and does all the backend work that we don't want to do in JS. 
# This video is a great explanation of the Jupyter architecture: https://www.youtube.com/watch?v=9_-siU-_XoI
def _load_jupyter_server_extension(server_app):
    # server_app.log.info("Loading AI Chat extension!!!!")
    # print("Loading AI Chat extension!!!!")
    # host_pattern = ".*$"
    # route_pattern = url_path_join(server_app.settings['base_url'], 'ai_chat', 'completion')
    # server_app.add_handlers(host_pattern, [(route_pattern, OpenAICompletionHandler)])
    host_pattern = ".*$"

    web_app = server_app.web_app

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "ai_chat", "completion")
    handlers = [(route_pattern, OpenAICompletionHandler)]
    web_app.add_handlers(host_pattern, handlers)
