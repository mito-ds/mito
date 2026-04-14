"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

SERVER_NAME = "mito-ai-mcp"

mcp = FastMCP(name=SERVER_NAME)


@mcp.tool(
    name="run_data_analyst",
    description="Run a natural language data analyst request with Mito AI.",
)
async def run_data_analyst(prompt: str) -> str:
    """Placeholder tool implementation for MCP bootstrap."""
    return (
        "Mito AI MCP server is running. "
        "Tool execution bridge is not wired yet. "
        f"Received prompt: {prompt}"
    )


def main() -> None:
    """Run the MCP server over stdio transport."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

