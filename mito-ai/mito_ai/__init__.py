from jupyter_server.utils import url_path_join
from .handlers import CompletionHandler
from .providers import OpenAIProvider

try:
    from _version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings

    warnings.warn("Importing 'mito_ai' outside a proper installation.")
    __version__ = "dev"


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "mito-ai"}]


def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata describing
    where to find the `_load_jupyter_server_extension` function.
    """
    return [{"module": "mito_ai"}]


# Jupyter Server is the backend used by JupyterLab. A sever extension lets
# us add new API's to the backend, so we can do some processing that we don't
# want to exist in the users's javascript.


# For a further explanation of the Jupyter architecture watch the first 35 minutes
# of this video: https://www.youtube.com/watch?v=9_-siU-_XoI
def _load_jupyter_server_extension(server_app):
    host_pattern = ".*$"
    web_app = server_app.web_app
    base_url = web_app.settings["base_url"]

    open_ai_provider = OpenAIProvider(config=server_app.config)

    handlers = [
        (
            url_path_join(base_url, "mito-ai", "completions"),
            CompletionHandler,
            {"llm": open_ai_provider},
        ),
    ]
    web_app.add_handlers(host_pattern, handlers)
    server_app.log.info("Loaded the mito_ai server extension")
