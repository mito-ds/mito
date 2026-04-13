# Avoid jupyter_server_mcp port conflict on some machines.
c.ServerApp.jpserver_extensions = {"jupyter_server_mcp": False}
