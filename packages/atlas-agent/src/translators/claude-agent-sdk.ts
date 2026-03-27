// Task 14: Claude Agent SDK translator
// Takes a FractalAgentSystem and generates deployable artifacts

import type { FractalAgentSystem, TranslatedFractalSystem } from "../types/fractal-system.js";
import type { UniversalFractalNode } from "../types/fractal-node.js";

export interface TranslationArtifact {
  path: string;
  type: "agent" | "tool" | "memory" | "mcp_config" | "orchestration" | "docker" | "env";
  content: string;
}

export interface TranslationResult {
  artifacts: TranslationArtifact[];
  warnings: string[];
}

// --- Helpers ---

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function collectAllNodes(nodes: UniversalFractalNode[]): UniversalFractalNode[] {
  const result: UniversalFractalNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...collectAllNodes(node.children));
    }
  }
  return result;
}

function generateSystemPrompt(node: UniversalFractalNode): string {
  const sections: string[] = [];

  // Section A: Identity
  sections.push(`# ${node.identity.name}\nType: ${node.identity.type}\nID: ${node.identity.id}`);

  // Section B: Purpose
  sections.push(`## Purpose\n${node.purpose_context.purpose}`);
  sections.push(`Domain: ${node.purpose_context.domain} > ${node.purpose_context.subdomain}`);

  // Section C: I/O
  if (node.io.outputs.length > 0) {
    const outputList = node.io.outputs.map((o) => `- ${o.name}: ${o.description}`).join("\n");
    sections.push(`## Outputs\n${outputList}`);
  }

  // Section D: Value Thesis
  sections.push(
    `## Value Thesis\nQuality: ${node.output_value_thesis.quality}\nSpeed: ${node.output_value_thesis.speed}\nReliability: ${node.output_value_thesis.reliability}`
  );

  return sections.join("\n\n");
}

function generateAgentFile(node: UniversalFractalNode): string {
  const slug = slugify(node.identity.name);
  const systemPrompt = generateSystemPrompt(node);
  const toolNames = node.tools_memory_policies.tools.map((t) => `"${t.name}"`).join(", ");

  return `// Auto-generated agent: ${node.identity.name}
// ID: ${node.identity.id}

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = \`${systemPrompt.replace(/`/g, "\\`")}\`;

const TOOLS = [${toolNames}];

export const ${slug}_agent = {
  name: "${node.identity.name}",
  id: "${node.identity.id}",
  system_prompt: SYSTEM_PROMPT,
  tools: TOOLS,
  model: "claude-sonnet-4-20250514",
};
`;
}

function generateToolFile(tool: { name: string; description: string; parameters: { name: string; type: string; required: boolean }[]; returns: string }): string {
  const params = tool.parameters.map((p) => `    ${p.name}: { type: "${p.type}", required: ${p.required} }`).join(",\n");
  return `// Auto-generated tool: ${tool.name}

export const ${tool.name}_definition = {
  name: "${tool.name}",
  description: "${tool.description}",
  input_schema: {
    type: "object",
    properties: {
${params}
    },
  },
};

export async function ${tool.name}(params: Record<string, unknown>): Promise<unknown> {
  // TODO: Implement ${tool.name}
  throw new Error("Not implemented: ${tool.name}");
}
`;
}

function generateMemoryConfig(node: UniversalFractalNode): string {
  const mem = node.tools_memory_policies.memory;
  return `// Memory config for: ${node.identity.name}

export const memory_config = {
  working: { storage_type: "${mem.working.storage_type}", retention: "${mem.working.retention_policy}" },
  episodic: { storage_type: "${mem.episodic.storage_type}", retention: "${mem.episodic.retention_policy}" },
  semantic: { storage_type: "${mem.semantic.storage_type}", retention: "${mem.semantic.retention_policy}" },
  procedural: { storage_type: "${mem.procedural.storage_type}", retention: "${mem.procedural.retention_policy}" },
};
`;
}

function generateMcpConfig(servers: { name: string; transport: string; url_or_command: string; tools_provided: string[] }[]): string {
  if (servers.length === 0) return "";
  const entries = servers.map((s) => `  {
    name: "${s.name}",
    transport: "${s.transport}",
    url_or_command: "${s.url_or_command}",
    tools: ${JSON.stringify(s.tools_provided)},
  }`).join(",\n");

  return `// MCP server configurations

export const mcp_servers = [
${entries}
];
`;
}

function generateOrchestrationScript(podNode: UniversalFractalNode): string {
  const slug = slugify(podNode.identity.name);
  const agentImports = podNode.children
    .filter((c) => c.identity.type === "agent" || c.identity.type === "sub_agent")
    .map((c) => {
      const agentSlug = slugify(c.identity.name);
      return `import { ${agentSlug}_agent } from "./agents/${agentSlug}.js";`;
    })
    .join("\n");

  const agentNames = podNode.children
    .filter((c) => c.identity.type === "agent" || c.identity.type === "sub_agent")
    .map((c) => `  "${c.identity.name}"`)
    .join(",\n");

  return `// Orchestration for pod: ${podNode.identity.name}
// ID: ${podNode.identity.id}

${agentImports}

export const ${slug}_orchestration = {
  pod_name: "${podNode.identity.name}",
  pod_id: "${podNode.identity.id}",
  agents: [
${agentNames}
  ],
};
`;
}

function generateDockerCompose(system: FractalAgentSystem): string {
  return `# Auto-generated Docker Compose for ${system.company_context.profile.name}
# Platform: ${system.target_platform}

version: "3.8"

services:
  atlas-agent:
    build: .
    environment:
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    ports:
      - "3001:3001"
    volumes:
      - ./sessions:/app/sessions
`;
}

function generateEnvTemplate(): string {
  return `# Environment configuration
ANTHROPIC_API_KEY=your_api_key_here
NODE_ENV=production
ATLAS_SESSION_DIR=./sessions
ATLAS_PORT=3001
`;
}

// --- Main translator ---

export function translateToClaudeAgentSdk(system: FractalAgentSystem): TranslationResult {
  const artifacts: TranslationArtifact[] = [];
  const warnings: string[] = [];

  const allNodes = collectAllNodes(system.value_chain_areas);

  // Generate agent files for agent/sub_agent nodes
  for (const node of allNodes) {
    if (node.identity.type === "agent" || node.identity.type === "sub_agent") {
      const slug = slugify(node.identity.name);
      artifacts.push({
        path: `agents/${slug}.ts`,
        type: "agent",
        content: generateAgentFile(node),
      });

      // Generate tool files
      for (const tool of node.tools_memory_policies.tools) {
        artifacts.push({
          path: `tools/${tool.name}.ts`,
          type: "tool",
          content: generateToolFile(tool),
        });
      }

      // Generate memory config
      artifacts.push({
        path: `config/${slug}_memory.ts`,
        type: "memory",
        content: generateMemoryConfig(node),
      });

      // Generate MCP configs
      if (node.tools_memory_policies.mcp_servers.length > 0) {
        artifacts.push({
          path: `config/${slug}_mcp.ts`,
          type: "mcp_config",
          content: generateMcpConfig(node.tools_memory_policies.mcp_servers),
        });
      }
    }
  }

  // Generate orchestration scripts for pods
  for (const node of allNodes) {
    if (node.identity.type === "pod") {
      const slug = slugify(node.identity.name);
      artifacts.push({
        path: `orchestration/${slug}.ts`,
        type: "orchestration",
        content: generateOrchestrationScript(node),
      });
    }
  }

  // Generate Docker Compose
  artifacts.push({
    path: "docker-compose.yml",
    type: "docker",
    content: generateDockerCompose(system),
  });

  // Generate .env template
  artifacts.push({
    path: ".env.template",
    type: "env",
    content: generateEnvTemplate(),
  });

  if (allNodes.filter((n) => n.identity.type === "agent" || n.identity.type === "sub_agent").length === 0) {
    warnings.push("No agent nodes found in fractal system. Only infrastructure artifacts generated.");
  }

  return { artifacts, warnings };
}
