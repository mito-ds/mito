"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from mito_ai_mcp.request_agent_execution import AgentRunnerBridge

SERVER_NAME = "mito-ai-mcp"

mcp = FastMCP(name=SERVER_NAME)
request_agent_execution = AgentRunnerBridge()


@mcp.tool(
    name="run_data_analyst",
    description="Run a natural language data analyst request with Mito AI.",
)
async def run_data_analyst(prompt: str) -> str:
    """Run a one-shot Mito AI analysis and return final text output."""
    result = await request_agent_execution.run_prompt(prompt)
    return result.final_text


def main() -> None:
    """Run the MCP server over stdio transport."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

