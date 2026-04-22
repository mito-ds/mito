# Mito AI MCP Server

This server enables LLMs to perfom better data analysis and visualization, including best-in-class Excel-to-Python workflows. 

## Available Tools

- `run_data_analyst` - Run one-shot Mito AI analysis for notebook/spreadsheet workflows (Excel/CSV, cleaning/transforms, EDA, and Jupyter cell generation/edits).
  - Required arguments:
    - `prompt` (string): Natural-language instruction describing the analysis task.

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

### Claude Desktop

Use the MCP bundle (`.mcpb`) for one-click installation in Claude Desktop.

Build it from this directory:

```bash
mcpb pack
```

This command produces a file named `mito-ai-<version>.mcpb` in the current directory.

Users can then install it in Claude Desktop by:

- Double-clicking the `.mcpb` file
- Dragging the `.mcpb` file into Claude Desktop
- Going to **Settings → Extensions → Advanced settings → Install Extension...**

### Other Applications

To set this up in another MCP-compatible app, find its MCP settings page in the docs.

Then add:

- Name: mito-ai
- Type: stdio
- Command: uvx
- Arguments: mito-ai-mcp

## Development

Developers should consult the [dev guide](./DEV.md).

## Packaging for Claude Desktop (`.mcpb`)

This repository includes `manifest.json` and `.mcpbignore` so you can package the server with [mcpb](https://github.com/modelcontextprotocol/mcpb).

To build:

```bash
mcpb pack
```

This bundle uses `server.type = "uv"` and `entry_point = "mito_ai_mcp/server.py"`, so Claude Desktop installs dependencies from `pyproject.toml` automatically at install time.