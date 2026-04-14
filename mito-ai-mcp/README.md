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

cd mito-ai-mcp
pip install -e ../mito-ai-core -e ../mito-ai-python-tool-executor -e .

 npx -y @modelcontextprotocol/inspector@latest --cli python3 -m mito_ai_mcp.server --method tools/call --tool-name run_data_analyst --tool-arg 'prompt=Use yfinance to get the latest stock price for META. Then tell me the change in YTD change in price.'


## Test with UI Inspector

cd /Users/aarondiamond-reivich/Mito/mito/mito-ai-mcp
npx -y @modelcontextprotocol/inspector@latest python3 -m mito_ai_mcp.server