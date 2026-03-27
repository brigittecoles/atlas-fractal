import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SessionStore } from "../session/index.js";

export function registerAllTools(server: McpServer, store: SessionStore): void {
  console.log("[ATLAS-Fractal] Tool registry initialized (0 tools registered)");
}

export async function handleToolCall(
  toolName: string,
  params: Record<string, unknown>,
  store: SessionStore
): Promise<unknown> {
  return { error: `Unknown tool: ${toolName}` };
}
