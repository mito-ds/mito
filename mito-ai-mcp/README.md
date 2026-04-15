# mito-ai-mcp

Mito AI MCP server package. Exposes tools such as `run_data_analyst` (stdio transport) for MCP-capable clients.

## Testing

Testing is a two-step process:

1. **Prerequisites** — install this package (editable) so the `python` you point clients at can import it.
2. **Environment** — pick one: [CLI](#cli), [MCP UI](#mcp-ui), [VS Code](#vs-code), or [Claude Desktop](#claude-desktop).

You do **not** need to keep `python -m mito_ai_mcp.server` running in a separate terminal before using the CLI, Inspector UI, VS Code, or Claude Desktop. Those clients start the server as a subprocess when they connect.

### Prerequisites

From the `mito-ai-mcp` directory:

```bash
cd mito-ai-mcp
pip install -e ../mito-ai-core -e ../mito-ai-python-tool-executor -e .
```

Optional: run the server alone only to confirm the module loads (not required for the sections below):

```bash
python -m mito_ai_mcp.server
# or: mito-ai-mcp
```

**Dev only — hot reload** (auto-restart on changes under `mito/`; use instead of manually restarting while iterating):

```bash
cd mito-ai-mcp
source venv/bin/activate
python -m pip install watchfiles
watchfiles --filter python "python -m mito_ai_mcp.server" ..
```

### CLI

One-shot `tools/call` with the Inspector CLI:

```bash
cd mito-ai-mcp
npx -y @modelcontextprotocol/inspector@latest --cli python3 -m mito_ai_mcp.server --method tools/call --tool-name run_data_analyst --tool-arg 'prompt=Say hello in one sentence.'
```

### MCP UI

```bash
cd mito-ai-mcp
npx -y @modelcontextprotocol/inspector@latest python3 -m mito_ai_mcp.server
```

Open the URL Inspector prints (often `http://localhost:6274`), connect, and run `run_data_analyst` from the Tools tab.

### VS Code

Configure a stdio MCP server with the `python` from your editable install and `cwd` set to `mito-ai-mcp`. Exact file location depends on your VS Code version (e.g. project `.vscode/mcp.json`). Example:

```json
{
  "servers": {
    "mito-ai": {
      "type": "stdio",
      "command": "/ABSOLUTE/PATH/TO/mito/mito-ai-mcp/venv/bin/python",
      "args": ["-m", "mito_ai_mcp.server"],
      "cwd": "/ABSOLUTE/PATH/TO/mito/mito-ai-mcp"
    }
  }
}
```

Reload the window if needed, then use the MCP tools UI to list tools and run `run_data_analyst`.

### Claude Desktop

Config file (typical paths): **macOS** `~/Library/Application Support/Claude/claude_desktop_config.json`, **Windows** `%APPDATA%\Claude\claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "mito-ai": {
      "command": "/ABSOLUTE/PATH/TO/mito/mito-ai-mcp/venv/bin/python",
      "args": ["-m", "mito_ai_mcp.server"],
      "cwd": "/ABSOLUTE/PATH/TO/mito/mito-ai-mcp"
    }
  }
}
```

Fully quit and reopen Claude Desktop. In chat, confirm **mito-ai** is connected and invoke `run_data_analyst` (e.g. prompt: “Say hello in one sentence.”).

**After you edit this package’s code:** With `pip install -e .`, you do not need to reinstall. Claude keeps the MCP server process running, so **restart that process** to pick up changes — usually by **fully quitting Claude Desktop** and reopening it, or using the app’s MCP / developer control to restart the server if your build exposes one. Re-run `pip install -e .` only if you change dependencies or install mode.

---

## MCP Client Behavior Matrix

| MCP Client | Sampling Behavior | Progress Update Behavior |
|---|---|---|
| Inspector UI (`@modelcontextprotocol/inspector`) | Sampling capability can be negotiated at protocol level, but this server currently runs direct-provider mode and does not require MCP sampling. | Shows `notifications/progress` in the UI while the tool is running. |
| Inspector CLI (`@modelcontextprotocol/inspector --cli`) | Same as above; sampling support is client capability, but this server does not depend on it in v1. | Usually prints final `tools/call` output only; progress notifications are not shown inline in normal CLI output. |
| Claude Desktop | Sampling support may vary by version/client internals; this server does not require it in v1. | Tool works, but progress notifications are generally not shown in chat UI (final output still returns normally). |
| Cursor | Sampling capability may be client/version dependent; this server does not require it in v1. | Progress notifications are typically visible during long-running tool calls. |
| ChatGPT MCP connectors | Connector/runtime dependent; treat sampling as optional and not required for this server in v1. | Progress UI is generally limited; expect reliable final output, but not always streaming progress visibility. |

Notes:

- This server currently targets direct-provider execution; MCP sampling integration is planned as a later enhancement.
- Client behavior can change across releases, so prefer quick smoke tests (`tools/list` + a short `run_data_analyst` call) when upgrading clients.
