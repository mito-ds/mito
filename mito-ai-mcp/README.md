# mito-ai-mcp

Mito AI MCP server package. Exposes tools such as `run_data_analyst` (stdio transport) for MCP-capable clients.

## Testing

Testing is a two-step process:

1. **Prerequisites** — install this package (editable) so the `python` you point clients at can import it.
2. **Environment** — pick one: [CLI](#cli), [MCP UI](#mcp-ui), [VS Code](#vs-code), [Claude Desktop](#claude-desktop), or [Claude Code (dev)](#claude-code-dev).

You do **not** need to keep `python -m mito_ai_mcp.server` running in a separate terminal before using the CLI, Inspector UI, VS Code, or Claude Desktop. Those clients start the server as a subprocess when they connect.

### Prerequisites

From the `mito-ai-mcp` directory:

```bash
cd mito-ai-mcp
source venv/bin/activate
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

### Claude Code (dev)

Add the local stdio server from your terminal. From the repo root:

```bash
cd mito-ai-mcp
claude mcp add --transport stdio mito-ai -- "$(pwd)/venv/bin/python" -m mito_ai_mcp.server
```

If your venv lives elsewhere, replace `$(pwd)/venv/bin/python` with your absolute interpreter path, like /Users/username/mito/mito-ai-mcp/venv/bin/python.

After adding, start Claude Code in this repo and ask it to call the `run_data_analyst` MCP tool.

**After code changes:** because this server is started as a subprocess by the client, restart Claude Code (or remove/re-add the server) to ensure a fresh process picks up your latest edits.

---

## MCP Client Behavior Matrix

| Client | Elicitation | Root | Sampling |
|--------|:-----------:|:----:|:--------:|
| Inspector UI (`@modelcontextprotocol/inspector`) | ✓ | ✓ | ✓ |
| Inspector CLI (`--cli`) | X | X | ✓ |
| VS Code | ✓ | ✓ | Unsure |
| Claude Desktop | X | X | X |
| Claude Code | ✓ | ✓ | Unsure |
| Cursor | Unsure | Unsure | Unsure |
| ChatGPT MCP | Unsure | Unsure | Unsure |

\* **Sampling** can vary by client/version; this server runs in direct-provider mode and does not require MCP sampling in v1. Smoke-test after client upgrades (`tools/list` + a short `run_data_analyst`).
