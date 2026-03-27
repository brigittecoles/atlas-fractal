import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { registerAllTools, handleToolCall } from "./tools/registry.js";
import { SessionStore } from "./session/index.js";

/**
 * Creates and returns a configured ATLAS-Fractal MCP server instance.
 * Tools are registered but no transport is connected yet.
 * Accepts an external SessionStore so both MCP and HTTP paths share one store.
 */
export function createAtlasServer(store: SessionStore): McpServer {
  const server = new McpServer(
    { name: "atlas-fractal", version: "6.0.0-fractal" },
    { capabilities: { tools: {} } }
  );

  registerAllTools(server, store);

  return server;
}

/**
 * Starts the ATLAS-Fractal MCP server with the specified transport mode.
 *
 * - "stdio": Connects via stdin/stdout (for Claude Desktop integration)
 * - "http": Starts an Express server on port 3001 with SSE at /sse
 */
export async function startServer(mode: "stdio" | "http"): Promise<void> {
  const sessionDir = process.env.ATLAS_SESSION_DIR ?? path.join(process.cwd(), ".atlas-sessions");
  const store = new SessionStore(sessionDir);
  const server = createAtlasServer(store);

  if (mode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[ATLAS-Fractal] Server running on stdio transport");
    return;
  }

  // HTTP/SSE mode — reuses the same store created above
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  const PORT = parseInt(process.env.ATLAS_PORT ?? "3001", 10);

  // Track active SSE transports by session ID
  const transports = new Map<string, SSEServerTransport>();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", name: "atlas-fractal", version: "6.0.0-fractal" });
  });

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(400).json({ error: "Unknown session ID" });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  // HTTP tool endpoint — allows the wizard to call tools directly via POST
  app.post("/tool", async (req, res) => {
    const { tool, params } = req.body as {
      tool: string;
      params: Record<string, unknown>;
    };

    if (!tool) {
      res.status(400).json({ error: "Missing 'tool' in request body" });
      return;
    }

    try {
      const result = await handleToolCall(tool, params ?? {}, store);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: message });
    }
  });

  app.listen(PORT, () => {
    console.log(`[ATLAS-Fractal] Server running on http://localhost:${PORT}`);
    console.log(`[ATLAS-Fractal] SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`[ATLAS-Fractal] Tool endpoint: http://localhost:${PORT}/tool`);
    console.log(`[ATLAS-Fractal] Health check: http://localhost:${PORT}/health`);
  });
}
