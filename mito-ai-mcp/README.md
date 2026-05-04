# Mito AI MCP Server

This server enables LLMs to perform better data analysis and visualization, including best-in-class Excel-to-Python workflows.

## Available Tools

- `run_data_analyst` - Run one-shot Mito AI analysis for notebook/spreadsheet workflows (Excel/CSV, cleaning/transforms, EDA, and Jupyter cell generation/edits).
  - Required arguments:
    - `prompt` (string): Natural-language instruction describing the analysis task.

## Installation

The Mito AI MCP server works with any application that supports MCP. Below are setup instructions for a few popular tools: [Cursor](#cursor), [VS Code](#vs-code), [Claude Desktop](#claude-desktop). If yours isn’t listed, see *Other Applications* at the end.

> [!TIP]
> To use the Mito AI MCP server the only requirement is uv. You can find installation instructions [here](https://docs.astral.sh/uv/getting-started/installation/).

### Cursor

#### One-click install

For quick installation, use the one-click install: 

[![Install in Cursor](https://img.shields.io/badge/Cursor-UV-000000?style=flat-square&logo=cursor&logoColor=white)](https://trymito.io/install/cursor?method=uv)

#### Manual install

<details>
<summary>Manual install instructions</summary>

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
</details>

### VS Code

#### One-click install

For quick installation, use one of the one-click install buttons below: 

[![Install with UV in VS Code](https://img.shields.io/badge/VS_Code-UV-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://trymito.io/install/vs-code?method=uv)

#### Manual install

<details>
<summary>Manual install instructions</summary>

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
</details>

### Claude Desktop

#### One-click install

1. Download the mcp bundle: 

[![mito-ai-mcp.mcpb](https://img.shields.io/badge/Claude-mcpb-DE7356?style=flat-square&logo=claude&logoColor=white)](https://github.com/mito-ds/mito/releases/latest/download/mito-ai-mcp.mcpb)

2. Double-click the `.mcpb` file. This should open Claude; follow the directions on screen.

### Claude Code

In your terminal enter:

```bash
claude mcp add --transport stdio mito-ai -- uvx mito-ai-mcp
```

You should see a success message on submit. You can also enter `claude` from the terminal, and use the `/mcp` command to make sure the mito-ai MCP server is connected. 

### Other Applications

To set this up in another MCP-compatible app, find its MCP settings page in the docs.

Then add:

- Name: mito-ai
- Type: stdio
- Command: uvx
- Arguments: mito-ai-mcp

## Development

Developers should consult the [dev guide](./DEV.md).
