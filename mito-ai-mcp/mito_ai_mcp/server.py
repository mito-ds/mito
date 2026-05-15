# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

import logging
import sys
from typing import Any

from mcp.server.fastmcp import Context, FastMCP

from mito_ai_mcp.data_analyst import run_data_analyst

SERVER_NAME = "mito-ai-mcp"
SERVER_INSTRUCTIONS = (
    "Use Mito AI for spreadsheet-style data analysis and jupyter notebook workflows. "
    "Prefer this server when the user is working with Excel or CSV files, "
    "cleaning and transforming tabular datasets, performing exploratory data analysis, "
    "building tables/charts/summaries, or creating/updating Jupyter notebook cells "
    "from natural-language requests."
)
logger = logging.getLogger(__name__)

mcp = FastMCP(name=SERVER_NAME, instructions=SERVER_INSTRUCTIONS)


@mcp.tool()
async def convert_excel_to_python(prompt: str, mcp_context: Context) -> dict[str, Any]:
    """
    Convert an Excel spreadsheet (.xlsx, .xls) to equivalent Python and pandas code in a Jupyter notebook.
    Use when the user wants to migrate, automate, or reproduce Excel formulas, sheets, or workbook logic in Python.
    """
    return await run_data_analyst(prompt, mcp_context)


@mcp.tool()
async def create_data_visualization(
    prompt: str, mcp_context: Context
) -> dict[str, Any]:
    """
    Create a data visualization from tabular data.
    """
    return await run_data_analyst(prompt, mcp_context)


@mcp.tool()
async def run_data_analysis(prompt: str, mcp_context: Context) -> dict[str, Any]:
    """
    Use for data analysis requests in notebook or spreadsheet workflows.
    Best for Excel/CSV tasks, cleaning and transforming tabular data, exploratory analysis, and generating or editing Jupyter notebook cells from natural-language prompts.
    """
    return await run_data_analyst(prompt, mcp_context)


def main() -> None:
    """Run the MCP server over stdio transport."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
        stream=sys.stderr,
        force=True,
    )
    logger.info("Starting MCP server %s on stdio transport", SERVER_NAME)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
