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
python -m mito-ai-mcp
```

## Configuration

### VS Code

For quick installation, use one of the one-click install buttons below:

[![Install with UV in VS Code](https://img.shields.io/badge/VS_Code-UV-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mito-ai&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mito-ai-mcp%22%5D%7D) [![Install with UV in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-UV-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mito-ai&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mito-ai-mcp%22%5D%7D&quality=insiders)

[![Install with Python in VS Code](https://img.shields.io/badge/VS_Code-PIP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=time&config=%7B%22command%22%3A%22python%22%2C%22args%22%3A%5B%22-m%22%2C%22mito-ai-mcp%22%5D%7D) [![Install with Python in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-PIP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=time&config=%7B%22command%22%3A%22python%22%2C%22args%22%3A%5B%22-m%22%2C%22mito-ai-mcp%22%5D%7D&quality=insiders)

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is needed when using the `mcp.json` file.

<details>
<summary>Using uvx</summary>

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

<details>
<summary>Using PIP</summary>

```json
{
  "mcp": {
    "servers": {
      "mito-ai": {
        "command": "python",
        "args": ["-m", "mito-ai-mcp"]
      }
    }
  }
}
```
</details>


## Development

Developers should consult the [dev guide](./DEV.md).