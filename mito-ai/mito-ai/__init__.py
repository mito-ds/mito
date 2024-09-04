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
    warnings.warn("Importing 'mito-ai' outside a proper installation.")
    __version__ = "dev"


HERE = Path(__file__).parent.resolve()


with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "mito-ai"
    }]

def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata describing
    where to find the `_load_jupyter_server_extension` function.
    """
    return [{"module": "mito-ai"}]

# Jupyter Server is the backend used by JupyterLab. A sever extension lets 
# us add new API's to the backend, so we can do some processing that we don't
# want to exist in the users's javascript. 

# For a further explanation of the Jupyter architecture watch the first 35 minutes
# of this video: https://www.youtube.com/watch?v=9_-siU-_XoI
def _load_jupyter_server_extension(server_app):
    host_pattern = ".*$"
    web_app = server_app.web_app
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "mito_ai", "completion")
    handlers = [(route_pattern, OpenAICompletionHandler)]
    web_app.add_handlers(host_pattern, handlers)
    web_app.log.info("Loaded the mito_ai server extension")
