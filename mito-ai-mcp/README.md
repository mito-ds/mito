# Mito AI MCP Server

This server enables LLMs to perfom better data analysis and visualization, including best-in-class Excel-to-Python workflows. 

## Available Tools

- `run_data_analyst` - Run one-shot Mito AI analysis for notebook/spreadsheet workflows (Excel/CSV, cleaning/transforms, EDA, and Jupyter cell generation/edits).
  - Required arguments:
    - `prompt` (string): Natural-language instruction describing the analysis task.

## Installation

uv is recommended for installation. 

When using `[uv](https://docs.astral.sh/uv/)` no specific installation is needed. We will use `[uvx](https://docs.astral.sh/uv/guides/tools/)` to directly run *mito-ai-mcp*.

```bash
uvx mito-ai-mcp
```

Alternatively, you can install `mito-ai-mcp` via pip. However, this is not reccomended as the package needs to be installed globally.

## Configuration

The Mito AI MCP server works with any application that supports MCP. Below are setup instructions for a few popular tools. If yours isn’t listed, see *Other Applications* at the end.

### Cursor

For quick installation, use the one-click install below:

[Install in Cursor](https://trymito.io/install/cursor?method=uv)

Manual install instructions

To manually add the server to Cursor, open the Command Palette (`Ctrl + Shift + P`) and go to `Cursor Settings: Tools & MCPs`. Scroll to *Install MCP Server* and select *Add Custom MCP*. This will open a JSON file with an `mcpServers` object, add the appropriate config there:

```json
{
  "mcpServers": {
    "mito-ai": {
      "command": "uvx",
      "args": [
        "mito-ai-mcp"
      ]
    }
  }
}
```

### VS Code

For quick installation, use one of the one-click install buttons below:

[Install with UV in VS Code](https://trymito.io/install/vs-code?method=uv)

Manual install instructions

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is needed when using the `mcp.json` file.

Add the following MCP config:

```json
{
  "mcp": {
    "servers": {
      "mito-ai": {
        "command": "uvx",
        "args": ["mito-ai-mcp"]
      }
    }
  }
}
```

### Other Applications

To set this up in another MCP-compatible app, find its MCP settings page in the docs.

Then add:

- Name: mito-ai
- Type: stdio
- Command: uvx
- Arguments: mito-ai-mcp

## Development

Developers should consult the [dev guide](./DEV.md).