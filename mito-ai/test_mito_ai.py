import sys
print("Python path:", sys.path)
try:
    import mito_ai
    print("mito_ai version:", mito_ai.__version__)
    print("mito_ai location:", mito_ai.__file__)
    print("Available server extension points:", hasattr(mito_ai, "_jupyter_server_extension_points"))
    if hasattr(mito_ai, "_jupyter_server_extension_points"):
        print("Points output:", mito_ai._jupyter_server_extension_points())
    print("Available load function:", hasattr(mito_ai, "_load_jupyter_server_extension"))
    if hasattr(mito_ai, "_load_jupyter_server_extension"):
        print("Function signature:", mito_ai._load_jupyter_server_extension.__code__.co_varnames)
except ImportError as e:
    print("Import error:", e)
except Exception as e:
    print("Other error:", e, type(e))
