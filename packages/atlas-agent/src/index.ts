// ATLAS-Fractal — Entry point
// Starts the MCP server with stdio or HTTP/SSE transport

import { startServer } from "./server.js";

const mode = process.argv.includes("--stdio") ? "stdio" : "http";

startServer(mode).catch((err) => {
  console.error("[ATLAS-Fractal] Fatal error:", err);
  process.exit(1);
});
