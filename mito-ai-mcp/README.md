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