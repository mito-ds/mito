# Mito AI MCP Server

This server enables LLMs to perfom better data analysis and visualization, including best-in-class Excel-to-Python workflows. 

## Available Tools

- `run_data_analyst` - Run one-shot Mito AI analysis for notebook/spreadsheet workflows (Excel/CSV, cleaning/transforms, EDA, and Jupyter cell generation/edits).
  - Required arguments:
    - `prompt` (string): Natural-language instruction describing the analysis task.

## Installation

### Using uv (recommended)

When using [`uv`](https://docs.astral.sh/uv/) no specific installation is needed. We will use [`uvx`](https://docs.astral.sh/uv/guides/tools/) to directly run *mito-ai-mcp*.

```bash
uvx mito-ai-mcp
```

### Using PIP

Alternatively you can install `mito-ai-mcp` via pip:

```bash
pip install mito-ai-mcp
```

After installation, you can run it as a script using:

```bash
mito-ai-mcp
```

## Configuration

The Mito AI MCP server works with any application that supports MCP. Below are setup instructions for a few popular tools. If yours isn’t listed, see *Other Applications* at the end.

### Cursor 

For quick installation, use one of the one-click install buttons below:

[![Install in Cursor](https://img.shields.io/badge/Cursor-UV-000000?style=flat-square&logo=cursor&logoColor=white)](https://trymito.io/install/cursor?method=uv)

[![Install in Cursor](https://img.shields.io/badge/Cursor-PIP-000000?style=flat-square&logo=cursor&logoColor=white)](https://trymito.io/install/cursor?method=pip)

<details>
<summary>Manual install instructions</summary>

To manually add the server to Cursor, open the Command Palette (`Ctrl + Shift + P`) and go to `Cursor Settings: Tools & MCPs`. Scroll to *Install MCP Server* and select *Add Custom MCP*. This will open a JSON file with an `mcpServers` object, add the appropriate config there:

If using uvx:

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

If using pip:

```json
{
  "mcpServers": {
    "mito-ai": {
      "command": "mito-ai-mcp"
    }
  }
}
```

</details>

### VS Code

For quick installation, use one of the one-click install buttons below:

[![Install with UV in VS Code](https://img.shields.io/badge/VS_Code-UV-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://trymito.io/install/vs-code?method=uv)

[![Install with Python in VS Code](https://img.shields.io/badge/VS_Code-PIP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://trymito.io/install/vs-code?method=pip)

<details>
<summary>Manual install instructions</summary>

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is needed when using the `mcp.json` file.

If using uvx:

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

If using pip:

```json
{
  "mcp": {
    "servers": {
      "mito-ai": {
        "command": "mito-ai-mcp"
      }
    }
  }
}
```
</details>

### Other Applications

To set this up in another MCP-compatible app, find its MCP settings page in the docs.

Then add:

<details>
<summary>Using uvx</summary>

- Name: mito-ai
- Type: stdio
- Command: uvx
- Arguments: mito-ai-mcp

</details>

<details>
<summary>Using PIP</summary>

- Name: mito-ai
- Type: stdio
- Command: mito-ai-mcp

</details>

## Development

Developers should consult the [dev guide](./DEV.md).