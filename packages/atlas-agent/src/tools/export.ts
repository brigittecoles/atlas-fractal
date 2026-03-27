// Task 14: Export tools

import { randomUUID } from "node:crypto";
import type { SessionStore } from "../session/index.js";
import type { TranslatedFractalSystem } from "../types/fractal-system.js";
import { translateToClaudeAgentSdk } from "../translators/claude-agent-sdk.js";

const SUPPORTED_PLATFORMS = ["claude_agent_sdk"] as const;

// --- 1. select_target_platform ---

export function handleSelectTargetPlatform(
  platform: string,
  sessionId: string,
  store: SessionStore,
): Record<string, unknown> {
  if (!SUPPORTED_PLATFORMS.includes(platform as typeof SUPPORTED_PLATFORMS[number])) {
    return {
      error: "unsupported_platform",
      message: `Platform "${platform}" is not supported. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      supported_platforms: [...SUPPORTED_PLATFORMS],
    };
  }

  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  // Store platform selection in fractal_system if it exists
  if (session.fractal_system) {
    session.fractal_system.target_platform = platform;
    store.update(sessionId, { fractal_system: session.fractal_system });
  }

  return {
    platform,
    capabilities: [
      "Multi-agent orchestration via Claude Agent SDK",
      "Tool use with structured outputs",
      "MCP server integration",
      "Memory persistence (working, episodic, semantic, procedural)",
      "System prompt generation from sections A-D",
      "Docker Compose deployment",
    ],
    limitations: [
      "Single model provider (Anthropic Claude)",
      "No built-in GUI — agents are API-driven",
      "Memory layer implementations are stubs (require integration)",
    ],
  };
}

// --- 2. translate_to_platform ---

export function handleTranslateToPlatform(
  sessionId: string,
  store: SessionStore,
): { translated_system: TranslatedFractalSystem; artifact_count: number; warnings: string[] } | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }
  if (!session.fractal_system) {
    return { error: "no_fractal_system", message: "No fractal system initialized." };
  }

  const platform = session.fractal_system.target_platform || "claude_agent_sdk";

  if (platform !== "claude_agent_sdk") {
    return { error: "unsupported_platform", message: `Platform "${platform}" not supported.` };
  }

  const result = translateToClaudeAgentSdk(session.fractal_system);

  const translatedSystem: TranslatedFractalSystem = {
    ...session.fractal_system,
    target_platform: platform,
    platform_constraints: [
      "Anthropic Claude models only",
      "Tool schemas must be JSON Schema compatible",
      "Max 128 tools per agent call",
    ],
    artifacts: result.artifacts.map((a) => a.path),
  };

  // Store translated system in session
  store.update(sessionId, { translated_system: translatedSystem });

  return {
    translated_system: translatedSystem,
    artifact_count: result.artifacts.length,
    warnings: result.warnings,
  };
}

// --- 3. export_package ---

export function handleExportPackage(
  sessionId: string,
  format: string,
  store: SessionStore,
): { package_id: string; artifacts: { path: string; type: string }[]; package_content: string } | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }
  if (!session.fractal_system) {
    return { error: "no_fractal_system", message: "No fractal system initialized." };
  }

  const platform = session.fractal_system.target_platform || "claude_agent_sdk";
  const result = translateToClaudeAgentSdk(session.fractal_system);

  const packageId = randomUUID();

  // Package all artifacts
  const packageData = {
    package_id: packageId,
    platform,
    format,
    generated_at: new Date().toISOString(),
    artifacts: result.artifacts.map((a) => ({
      path: a.path,
      type: a.type,
      content: a.content,
    })),
  };

  const packageContent = Buffer.from(JSON.stringify(packageData, null, 2)).toString("base64");

  return {
    package_id: packageId,
    artifacts: result.artifacts.map((a) => ({ path: a.path, type: a.type })),
    package_content: packageContent,
  };
}
