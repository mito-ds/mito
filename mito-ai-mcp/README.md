# mito-ai-mcp

Mito AI MCP server package.

## Run

```bash
python -m mito_ai_mcp.server
```

Or via script entrypoint:

```bash
mito-ai-mcp
```

### Dev Hot Reload (auto-restart on code changes)

Use `watchfiles` to restart the MCP server whenever Python files change anywhere under the `mito/` repo:

```bash
cd mito-ai-mcp
source venv/bin/activate
python -m pip install watchfiles
watchfiles --filter python "python -m mito_ai_mcp.server" ..
```

This is restart-on-change (not in-process hot module reload), but it gives the fastest dev loop when testing with clients like Claude Desktop.


## Testing

Install local editable packages:

```bash
cd mito-ai-mcp
pip install -e ../mito-ai-core -e ../mito-ai-python-tool-executor -e .
```

Run a quick terminal test with Inspector CLI:

```bash
npx -y @modelcontextprotocol/inspector@latest --cli python3 -m mito_ai_mcp.server --method tools/call --tool-name run_data_analyst --tool-arg 'prompt=Use yfinance to get the latest stock price for META. Then tell me the change in YTD change in price.'
```

## Test With UI Inspector

```bash
cd mito-ai-mcp
npx -y @modelcontextprotocol/inspector@latest python3 -m mito_ai_mcp.server
```

Open the URL printed by Inspector (typically `http://localhost:6274`), connect, and run `run_data_analyst` from the Tools tab.

## Test In Claude Desktop (MCP)

1. Ensure dependencies are installed in the `mito-ai-mcp` virtual environment.
2. Add the mcp section to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

> **Note:** Make sure to replace `<absolute path to mito>` with your local path to the mito repo!

```json
{
  "mcpServers": {
    "mito-ai": {
      "command": "/<absolute path to mito>/mito/mito-ai-mcp/venv/bin/python",
      "args": ["-m", "mito_ai_mcp.server"],
      "cwd": "/<absolute path to mito>/mito/mito-ai-mcp"
    }
  }
}
```

3. Fully quit and reopen Claude Desktop.
4. In Claude, confirm the `mito-ai` MCP server is available and run a simple check prompt such as:
   - "Use `run_data_analyst` with prompt: `Say hello in one sentence.`"

## MCP Client Behavior Matrix

Expected behavior for common MCP clients when using this server:

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