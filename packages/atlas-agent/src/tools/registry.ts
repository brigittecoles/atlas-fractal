// Task 15: Wire all 26 tools into MCP registry

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SessionStore } from "../session/index.js";

// --- Tool imports ---
import { handleSearchProcesses, handleGetProcessDetail, handleMapToValueChain } from "./apqc.js";
import {
  handleIngestDocument,
  handleSummarizeDocument,
  handleEnrichCompanyProfile,
} from "./document-ingestion.js";
import {
  handleScoreStructuralNpv,
  handleDecompositionGate,
  handleCheckRuntimePromotion,
  handleScoreOutputEconomics,
  handleValidateNode,
  handleReviewOutputQuality,
  handleCheckConsolidation,
} from "./fractal-gates/index.js";
import {
  handleDesignFractalSystem,
  handleDesignFractalPod,
  handleDesignFractalAgent,
  handleStoreFractalNode,
  handleStoreDemotedConcept,
  handleStoreFractalSystem,
} from "./agent-design.js";
import {
  handleValidateFractalSystem,
  handleResolveDependencies,
  handleEstimateEbitdaImpact,
} from "./system-validation.js";
import {
  handleSelectTargetPlatform,
  handleTranslateToPlatform,
  handleExportPackage,
} from "./export.js";

// --- Type helpers ---
import type { UniversalFractalNode } from "../types/index.js";
import type { DemotedConcept } from "../types/fractal-system.js";

export function registerAllTools(server: McpServer, store: SessionStore): void {
  // ===== SESSION (1) =====

  server.tool(
    "create_session",
    "Create a new ATLAS-Fractal session",
    {},
    async () => {
      const session = store.create();
      store.appendEvent(session.id, { type: "tool_call", tool_name: "create_session", summary: "Session created" });
      return { content: [{ type: "text", text: JSON.stringify({ session_id: session.id, status: session.status }) }] };
    }
  );

  // ===== APQC (3) =====

  server.tool(
    "search_processes",
    "Search APQC processes by industry, keywords, and type",
    {
      industry: z.string().describe("Industry name (e.g. healthcare, technology)"),
      keywords: z.array(z.string()).optional().describe("Optional keyword filters"),
      type: z.enum(["operating", "support"]).optional().describe("Process type filter"),
    },
    async (params) => {
      const result = handleSearchProcesses(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_process_detail",
    "Get full APQC process detail by ID",
    {
      process_id: z.string().describe("APQC process ID (e.g. 3.2)"),
    },
    async (params) => {
      const result = handleGetProcessDetail(params.process_id);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "map_to_value_chain",
    "Get reference data for mapping APQC L1 categories to Porter value chain activities",
    {
      process_ids: z.array(z.string()).describe("APQC process IDs to map"),
    },
    async (params) => {
      const result = handleMapToValueChain(params.process_ids);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // ===== DOCUMENT (3) =====

  server.tool(
    "ingest_document",
    "Ingest a document (base64-encoded) into the session",
    {
      session_id: z.string().describe("Session ID"),
      file_name: z.string().describe("File name"),
      file_content: z.string().describe("Base64-encoded file content"),
      file_type: z.string().describe("File type: pdf, xlsx, docx, csv, txt"),
      document_type: z.enum(["pl", "strategy", "org_chart", "general"]).optional().describe("Document type"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "ingest_document", summary: `Ingesting ${params.file_name}` });
      const result = await handleIngestDocument(params, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "summarize_document",
    "Summarize a document already ingested into the session",
    {
      session_id: z.string().describe("Session ID"),
      document_id: z.string().describe("Document ID"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "summarize_document", summary: `Summarizing document ${params.document_id}` });
      const result = await handleSummarizeDocument(params.session_id, params.document_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "enrich_company_profile",
    "Enrich company profile from ingested documents",
    {
      session_id: z.string().describe("Session ID"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "enrich_company_profile", summary: "Enriching company profile" });
      const result = await handleEnrichCompanyProfile(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // ===== FRACTAL GATES (7) =====

  server.tool(
    "score_structural_npv",
    "Score structural NPV for a proposed node — determines if it earns existence",
    {
      node_proposal: z.object({
        name: z.string(),
        purpose: z.string(),
        parent_node_id: z.string().optional(),
      }),
      per_output_scores: z.array(z.object({
        output_name: z.string(),
        importance: z.number(),
        quality_gain: z.number(),
        speed_gain: z.number(),
        reliability_gain: z.number(),
        reuse_gain: z.number(),
        governance_gain: z.number(),
        productization_gain: z.number(),
      })),
      cost_estimates: z.object({
        complexity: z.number(),
        maintenance_burden: z.number(),
        coordination_overhead: z.number(),
        semantic_duplication: z.number(),
        ontology_sprawl: z.number(),
        consolidation_risk: z.number(),
      }),
    },
    async (params) => {
      const result = handleScoreStructuralNpv(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "run_decomposition_gate",
    "Classify a proposed concept as instance, field, matrix, example, or policy",
    {
      proposed_concept: z.string(),
      has_distinct_runtime_behavior: z.boolean(),
      has_distinct_outputs: z.boolean(),
      has_distinct_reuse: z.boolean(),
    },
    async (params) => {
      const result = handleDecompositionGate(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "check_runtime_promotion",
    "Check if a node should be promoted to runtime tier",
    {
      node_id: z.string(),
      node_name: z.string(),
    },
    async (params) => {
      const result = handleCheckRuntimePromotion(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "score_output_economics",
    "Score output economics for a set of outputs — portfolio value and risk flagging",
    {
      outputs: z.array(z.object({
        name: z.string(),
        owner_node_id: z.string(),
        consumers: z.array(z.string()),
        value_type: z.string(),
        importance: z.number(),
        quality_criteria: z.array(z.string()),
        risk_sensitivity: z.string(),
        blast_radius: z.string(),
      })),
    },
    async (params) => {
      const result = handleScoreOutputEconomics(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "validate_node",
    "Run acceptance tests on a UniversalFractalNode",
    {
      node: z.record(z.string(), z.unknown()).describe("UniversalFractalNode as JSON"),
    },
    async (params) => {
      const result = handleValidateNode(params.node as unknown as UniversalFractalNode);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "review_output_quality",
    "9-dimension quality scoring for an output",
    {
      output_name: z.string(),
      scores: z.object({
        purpose_alignment: z.number(),
        accuracy: z.number(),
        completeness: z.number(),
        relevance: z.number(),
        clarity: z.number(),
        depth: z.number(),
        tone_consistency: z.number(),
        bias_ethics: z.number(),
        aeo_geo_readiness: z.number(),
      }),
    },
    async (params) => {
      const result = handleReviewOutputQuality(params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "check_consolidation",
    "Detect overlap between nodes and recommend consolidation actions",
    {
      nodes: z.array(z.record(z.string(), z.unknown())).describe("Array of UniversalFractalNode as JSON"),
    },
    async (params) => {
      const result = handleCheckConsolidation(params.nodes as unknown as UniversalFractalNode[]);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // ===== DESIGN (6) =====

  server.tool(
    "design_fractal_system",
    "Get full context for designing a fractal agent system — company, processes, doctrine",
    {
      session_id: z.string().describe("Session ID"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "design_fractal_system", summary: "Assembling system design context" });
      const result = handleDesignFractalSystem(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "design_fractal_pod",
    "Get scoped context for designing one value chain area pod",
    {
      session_id: z.string(),
      value_chain_area: z.string(),
      process_ids: z.array(z.string()),
      constraints: z.record(z.string(), z.unknown()).optional(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "design_fractal_pod", summary: `Designing pod for ${params.value_chain_area}` });
      const result = handleDesignFractalPod(params.session_id, params.value_chain_area, params.process_ids, params.constraints ?? {}, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "design_fractal_agent",
    "Get scoped context for designing one agent within a pod",
    {
      session_id: z.string(),
      pod_id: z.string(),
      required_outputs: z.array(z.string()),
      constraints: z.record(z.string(), z.unknown()).optional(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "design_fractal_agent", summary: `Designing agent for pod ${params.pod_id}` });
      const result = handleDesignFractalAgent(params.session_id, params.pod_id, params.required_outputs, params.constraints ?? {}, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "store_fractal_node",
    "Store a designed fractal node into the session",
    {
      session_id: z.string(),
      node: z.record(z.string(), z.unknown()).describe("UniversalFractalNode as JSON"),
      parent_node_id: z.string().nullable().describe("Parent node ID, or null for top-level"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "store_fractal_node", summary: "Storing fractal node" });
      const result = handleStoreFractalNode(params.session_id, params.node as unknown as UniversalFractalNode, params.parent_node_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "store_demoted_concept",
    "Store a concept that was demoted (did not pass gates)",
    {
      session_id: z.string(),
      concept: z.record(z.string(), z.unknown()).describe("DemotedConcept as JSON"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "store_demoted_concept", summary: "Storing demoted concept" });
      const result = handleStoreDemotedConcept(params.session_id, params.concept as unknown as DemotedConcept, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "store_fractal_system",
    "Finalize the fractal system — checks NPV coverage and advances status",
    {
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "store_fractal_system", summary: "Finalizing fractal system" });
      const result = handleStoreFractalSystem(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // ===== VALIDATION (3) =====

  server.tool(
    "validate_fractal_system",
    "Validate the full fractal system — check node completeness, detect cycles, NPV coverage",
    {
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "validate_fractal_system", summary: "Validating fractal system" });
      const result = handleValidateFractalSystem(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "resolve_dependencies",
    "Build execution layers from the fractal dependency graph",
    {
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "resolve_dependencies", summary: "Resolving dependencies" });
      const result = handleResolveDependencies(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "estimate_ebitda_impact",
    "Estimate EBITDA impact from the agent portfolio based on company financials",
    {
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "estimate_ebitda_impact", summary: "Estimating EBITDA impact" });
      const result = handleEstimateEbitdaImpact(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // ===== EXPORT (3) =====

  server.tool(
    "select_target_platform",
    "Select and validate the target deployment platform",
    {
      platform: z.string().describe("Platform name (e.g. claude_agent_sdk)"),
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "select_target_platform", summary: `Selecting platform: ${params.platform}` });
      const result = handleSelectTargetPlatform(params.platform, params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "translate_to_platform",
    "Translate the fractal system to platform-specific artifacts",
    {
      session_id: z.string(),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "translate_to_platform", summary: "Translating to platform" });
      const result = handleTranslateToPlatform(params.session_id, store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "export_package",
    "Export all artifacts as a deployable package",
    {
      session_id: z.string(),
      format: z.string().optional().describe("Package format (default: json)"),
    },
    async (params) => {
      store.appendEvent(params.session_id, { type: "tool_call", tool_name: "export_package", summary: "Exporting package" });
      const result = handleExportPackage(params.session_id, params.format ?? "json", store);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  console.log("[ATLAS-Fractal] 26 tools registered");
}

// --- HTTP /tool endpoint dispatch ---

export async function handleToolCall(
  toolName: string,
  params: Record<string, unknown>,
  store: SessionStore
): Promise<unknown> {
  const sessionId = params.session_id as string | undefined;

  switch (toolName) {
    // Session
    case "create_session": {
      const session = store.create();
      return { session_id: session.id, status: session.status };
    }

    // APQC
    case "search_processes":
      return handleSearchProcesses(params as unknown as Parameters<typeof handleSearchProcesses>[0]);
    case "get_process_detail":
      return handleGetProcessDetail(params.process_id as string);
    case "map_to_value_chain":
      return handleMapToValueChain(params.process_ids as string[]);

    // Document
    case "ingest_document":
      return handleIngestDocument(params as unknown as Parameters<typeof handleIngestDocument>[0], store);
    case "summarize_document":
      return handleSummarizeDocument(params.session_id as string, params.document_id as string, store);
    case "enrich_company_profile":
      return handleEnrichCompanyProfile(params.session_id as string, store);

    // Fractal gates
    case "score_structural_npv":
      return handleScoreStructuralNpv(params as unknown as Parameters<typeof handleScoreStructuralNpv>[0]);
    case "run_decomposition_gate":
      return handleDecompositionGate(params as unknown as Parameters<typeof handleDecompositionGate>[0]);
    case "check_runtime_promotion":
      return handleCheckRuntimePromotion(params as unknown as Parameters<typeof handleCheckRuntimePromotion>[0]);
    case "score_output_economics":
      return handleScoreOutputEconomics(params as unknown as Parameters<typeof handleScoreOutputEconomics>[0]);
    case "validate_node":
      return handleValidateNode(params.node as unknown as UniversalFractalNode);
    case "review_output_quality":
      return handleReviewOutputQuality(params as unknown as Parameters<typeof handleReviewOutputQuality>[0]);
    case "check_consolidation":
      return handleCheckConsolidation(params.nodes as unknown as UniversalFractalNode[]);

    // Design
    case "design_fractal_system":
      return handleDesignFractalSystem(sessionId!, store);
    case "design_fractal_pod":
      return handleDesignFractalPod(sessionId!, params.value_chain_area as string, params.process_ids as string[], (params.constraints as Record<string, unknown>) ?? {}, store);
    case "design_fractal_agent":
      return handleDesignFractalAgent(sessionId!, params.pod_id as string, params.required_outputs as string[], (params.constraints as Record<string, unknown>) ?? {}, store);
    case "store_fractal_node":
      return handleStoreFractalNode(sessionId!, params.node as unknown as UniversalFractalNode, params.parent_node_id as string | null, store);
    case "store_demoted_concept":
      return handleStoreDemotedConcept(sessionId!, params.concept as unknown as DemotedConcept, store);
    case "store_fractal_system":
      return handleStoreFractalSystem(sessionId!, store);

    // Validation
    case "validate_fractal_system":
      return handleValidateFractalSystem(sessionId!, store);
    case "resolve_dependencies":
      return handleResolveDependencies(sessionId!, store);
    case "estimate_ebitda_impact":
      return handleEstimateEbitdaImpact(sessionId!, store);

    // Export
    case "select_target_platform":
      return handleSelectTargetPlatform(params.platform as string, sessionId!, store);
    case "translate_to_platform":
      return handleTranslateToPlatform(sessionId!, store);
    case "export_package":
      return handleExportPackage(sessionId!, (params.format as string) ?? "json", store);

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
