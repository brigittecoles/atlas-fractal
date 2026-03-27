// Task 12: Fractal-aware agent design tools — DATA PROVIDERS for Claude to reason with

import type { SessionStore } from "../session/index.js";
import type { UniversalFractalNode } from "../types/index.js";
import type { DemotedConcept } from "../types/fractal-system.js";

// --- Fractal Doctrine (constant reference text) ---

const FRACTAL_DOCTRINE = `## Core Laws

1. Everything is fractal in possibility — any meaningful unit uses the same Universal Node Schema (sections A-K).
2. Not everything should become a node — use the fewest nodes needed.
3. Outputs/products are the value unit — node justification is tied to measurable output improvement.
4. Runtime is earned, not assumed — a node must pass gates to exist.
5. Stop at semantic saturation — if children are near-synonyms, consolidate.

## Structural NPV Formula

NPV(node) = sum(importance * mean(quality_gain, speed_gain, reliability_gain, reuse_gain, governance_gain, productization_gain) per output) - sum(complexity + maintenance + coordination + duplication + sprawl + consolidation_risk)

Create a node only when NPV > 0 or strategic option value is exceptionally high.

## Decomposition Gate Rules

Before creating any child node, determine its form:
- instance: distinct runtime, outputs, or reuse → create as child node
- field: no distinct runtime, outputs, or reuse → add as field on parent
- matrix: distinct outputs but shared runtime/reuse → add as matrix entry
- example: illustrative only → add as example
- policy: distinct reuse only → add as policy note`;

// --- Helper: count all nodes recursively ---

function countNodes(nodes: UniversalFractalNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
}

// --- 1. design_fractal_system ---

export function handleDesignFractalSystem(
  sessionId: string,
  store: SessionStore,
): Record<string, unknown> {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  if (!session.company_context) {
    return { error: "no_company_context", message: "No company context set. Ingest documents and enrich profile first." };
  }

  if (!session.selected_processes || session.selected_processes.length === 0) {
    return { error: "no_selected_processes", message: "No processes selected. Run process search and selection first." };
  }

  const profile = session.company_context.profile;

  // Build Porter mapping from selected processes
  const porterMap = new Map<string, { process_id: string; process_name: string }[]>();
  for (const proc of session.selected_processes) {
    const area = proc.porter_activity;
    if (!porterMap.has(area)) porterMap.set(area, []);
    porterMap.get(area)!.push({ process_id: proc.process_id, process_name: proc.process_name });
  }

  const porter_mapping = Array.from(porterMap.entries()).map(([area, processes]) => ({
    area,
    processes,
  }));

  return {
    company_summary: {
      name: profile.name,
      industry: profile.gics_industry,
      revenue: profile.revenue,
      employees: profile.employees,
      strategic_context: profile.strategic_context,
    },
    selected_processes: session.selected_processes.map((p) => ({
      id: p.process_id,
      name: p.process_name,
      l1_name: p.l1_name,
      work_products: [],
      ebitda: p.ebitda_score,
    })),
    porter_mapping,
    fractal_doctrine: FRACTAL_DOCTRINE,
    design_guidelines:
      "Minimum viable agents. Stop at semantic saturation. Every node must pass NPV and decomposition gates.",
  };
}

// --- 2. design_fractal_pod ---

export function handleDesignFractalPod(
  sessionId: string,
  valueChainArea: string,
  processIds: string[],
  constraints: Record<string, unknown>,
  store: SessionStore,
): Record<string, unknown> {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  const profile = session.company_context?.profile;
  const scopedProcesses = (session.selected_processes ?? []).filter((p) =>
    processIds.includes(p.process_id)
  );

  return {
    value_chain_area: valueChainArea,
    scoped_processes: scopedProcesses,
    company_context: profile
      ? { name: profile.name, industry: profile.gics_industry, strategic_context: profile.strategic_context }
      : null,
    constraints,
    fractal_doctrine: FRACTAL_DOCTRINE,
    design_guidelines:
      "Design the minimum set of agents for this value chain area. Each agent must produce distinct outputs that justify its existence via positive NPV.",
  };
}

// --- 3. design_fractal_agent ---

export function handleDesignFractalAgent(
  sessionId: string,
  podId: string,
  requiredOutputs: string[],
  constraints: Record<string, unknown>,
  store: SessionStore,
): Record<string, unknown> {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  const profile = session.company_context?.profile;

  return {
    pod_id: podId,
    required_outputs: requiredOutputs,
    company_context: profile
      ? { name: profile.name, industry: profile.gics_industry, strategic_context: profile.strategic_context }
      : null,
    constraints,
    fractal_doctrine: FRACTAL_DOCTRINE,
    design_guidelines:
      "Fill all sections A-K of the Universal Node Schema. Every output must have an importance score and value thesis. Tools and MCP servers must be specific to what this agent needs.",
  };
}

// --- 4. store_fractal_node ---

export function handleStoreFractalNode(
  sessionId: string,
  node: UniversalFractalNode,
  parentNodeId: string | null,
  store: SessionStore,
): { stored_node_id: string; system_node_count: number } | { error: string; message: string } {
  try {
    store.addNode(sessionId, node, parentNodeId);
  } catch (err) {
    return {
      error: "store_failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const session = store.get(sessionId)!;
  const systemNodeCount = session.fractal_system
    ? countNodes(session.fractal_system.value_chain_areas)
    : 0;

  return {
    stored_node_id: node.identity.id,
    system_node_count: systemNodeCount,
  };
}

// --- 5. store_demoted_concept ---

export function handleStoreDemotedConcept(
  sessionId: string,
  concept: DemotedConcept,
  store: SessionStore,
): { stored: true; total_demoted: number } | { error: string; message: string } {
  try {
    store.addDemotedConcept(sessionId, concept);
  } catch (err) {
    return {
      error: "store_failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const session = store.get(sessionId)!;
  const totalDemoted = session.fractal_system?.demoted_concepts.length ?? 0;

  return {
    stored: true,
    total_demoted: totalDemoted,
  };
}

// --- 6. store_fractal_system ---

export function handleStoreFractalSystem(
  sessionId: string,
  store: SessionStore,
): { success: boolean; total_nodes: number; total_demoted: number; status: string; warnings?: string[] } | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  if (!session.fractal_system) {
    return { error: "no_fractal_system", message: "No fractal system initialized. Store at least one node first." };
  }

  const warnings: string[] = [];

  // Check all nodes have NPV scores
  function checkNpv(nodes: UniversalFractalNode[]): void {
    for (const node of nodes) {
      if (node.structural_npv.net_structural_npv === undefined) {
        warnings.push(`Node "${node.identity.name}" (${node.identity.id}) has no NPV score.`);
      }
      if (node.children.length > 0) {
        checkNpv(node.children);
      }
    }
  }

  checkNpv(session.fractal_system.value_chain_areas);

  const totalNodes = countNodes(session.fractal_system.value_chain_areas);
  const totalDemoted = session.fractal_system.demoted_concepts.length;

  // Advance status to "design"
  store.update(sessionId, { status: "design" });

  return {
    success: true,
    total_nodes: totalNodes,
    total_demoted: totalDemoted,
    status: "design",
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
