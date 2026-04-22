export const MCP_NAME = "mito-ai";

export type InstallMethod = "uv" | "pip";

export type McpConfig = {
  command: string;
  args?: string[];
};

export const MCP_CONFIGS: Record<InstallMethod, McpConfig> = {
  uv: {
    command: "uvx",
    args: ["mito-ai-mcp"],
  },
  pip: {
    command: "mito-ai-mcp",
  },
};
