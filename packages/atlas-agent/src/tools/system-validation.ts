// Task 13: Validation + EBITDA + dependency tools

import type { SessionStore } from "../session/index.js";
import type { UniversalFractalNode } from "../types/index.js";

// --- Types ---

export interface ValidationIssue {
  node_id: string;
  severity: "error" | "warning";
  category: string;
  message: string;
  suggested_fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  dependency_graph: { layers: string[][]; has_cycles: boolean };
  npv_coverage: { nodes_with_npv: number; nodes_without: number };
}

export interface DependencyResult {
  layers: string[][];
  cross_pod_flows: { from: string; to: string; data: string }[];
  has_cycles: boolean;
}

export interface EbitdaResult {
  total_impact_pct: number;
  total_impact_dollars: number;
  by_value_chain_area: { area: string; impact_pct: number; impact_dollars: number }[];
  assumptions: string[];
}

// --- Helper: collect all nodes ---

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

// --- 1. validate_fractal_system ---

export function handleValidateFractalSystem(
  sessionId: string,
  store: SessionStore,
): ValidationResult | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }
  if (!session.fractal_system) {
    return { error: "no_fractal_system", message: "No fractal system initialized." };
  }

  const allNodes = collectAllNodes(session.fractal_system.value_chain_areas);
  const issues: ValidationIssue[] = [];
  let nodesWithNpv = 0;
  let nodesWithoutNpv = 0;

  for (const node of allNodes) {
    // Check identity.name exists
    if (!node.identity.name || node.identity.name.trim().length === 0) {
      issues.push({
        node_id: node.identity.id,
        severity: "error",
        category: "missing_name",
        message: `Node "${node.identity.id}" has no name.`,
        suggested_fix: "Add a descriptive name to identity.name.",
      });
    }

    // Check io.outputs non-empty
    if (!node.io.outputs || node.io.outputs.length === 0) {
      issues.push({
        node_id: node.identity.id,
        severity: "error",
        category: "missing_outputs",
        message: `Node "${node.identity.id}" has no outputs.`,
        suggested_fix: "Every node must produce at least one output.",
      });
    }

    // Check structural_npv exists
    if (node.structural_npv && node.structural_npv.net_structural_npv !== undefined) {
      nodesWithNpv++;
    } else {
      nodesWithoutNpv++;
      issues.push({
        node_id: node.identity.id,
        severity: "warning",
        category: "missing_npv",
        message: `Node "${node.identity.id}" has no NPV score.`,
        suggested_fix: "Run score_structural_npv for this node.",
      });
    }
  }

  // Build dependency graph (simple topological sort — no explicit deps in v1, so layer by type)
  const layers = buildLayers(allNodes);
  const hasCycles = false; // In v1, no explicit dependency edges → no cycles possible

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    dependency_graph: { layers, has_cycles: hasCycles },
    npv_coverage: { nodes_with_npv: nodesWithNpv, nodes_without: nodesWithoutNpv },
  };
}

// --- 2. resolve_dependencies ---

function buildLayers(allNodes: UniversalFractalNode[]): string[][] {
  // Layer by node type hierarchy: value_chain_area → pod → agent → sub_agent
  const typeOrder: Record<string, number> = {
    value_chain_area: 0,
    pod: 1,
    agent: 2,
    sub_agent: 3,
  };

  const layerMap = new Map<number, string[]>();
  for (const node of allNodes) {
    const layer = typeOrder[node.identity.type] ?? 0;
    if (!layerMap.has(layer)) layerMap.set(layer, []);
    layerMap.get(layer)!.push(node.identity.id);
  }

  const layers: string[][] = [];
  const sortedKeys = Array.from(layerMap.keys()).sort((a, b) => a - b);
  for (const key of sortedKeys) {
    layers.push(layerMap.get(key)!);
  }

  return layers;
}

export function handleResolveDependencies(
  sessionId: string,
  store: SessionStore,
): DependencyResult | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }
  if (!session.fractal_system) {
    return { error: "no_fractal_system", message: "No fractal system initialized." };
  }

  const allNodes = collectAllNodes(session.fractal_system.value_chain_areas);
  const layers = buildLayers(allNodes);

  // Cross-pod flows: find nodes that reference other pods in their io.inputs
  const cross_pod_flows: { from: string; to: string; data: string }[] = [];
  const nodeMap = new Map(allNodes.map((n) => [n.identity.id, n]));

  for (const node of allNodes) {
    for (const input of node.io.inputs) {
      // Check if input matches another node's output name
      for (const [otherId, otherNode] of nodeMap) {
        if (otherId === node.identity.id) continue;
        for (const output of otherNode.io.outputs) {
          if (output.name.toLowerCase() === input.toLowerCase()) {
            cross_pod_flows.push({
              from: otherId,
              to: node.identity.id,
              data: output.name,
            });
          }
        }
      }
    }
  }

  return {
    layers,
    cross_pod_flows,
    has_cycles: false, // v1: no explicit dependency edges
  };
}

// --- 3. estimate_ebitda_impact ---

export function handleEstimateEbitdaImpact(
  sessionId: string,
  store: SessionStore,
): EbitdaResult | { error: string; message: string } {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }
  if (!session.company_context) {
    return { error: "no_company_context", message: "No company context set." };
  }

  const revenue = session.company_context.profile.revenue;
  const selectedProcesses = session.selected_processes ?? [];

  if (selectedProcesses.length === 0) {
    return { error: "no_selected_processes", message: "No processes selected." };
  }

  // Group by porter_activity (value chain area)
  const areaMap = new Map<string, number>();
  const areaProcessCount = new Map<string, number>();
  for (const proc of selectedProcesses) {
    const area = proc.porter_activity;
    const current = areaMap.get(area) ?? 0;
    const count = areaProcessCount.get(area) ?? 0;
    // Apply diminishing returns: each additional process in the same area
    // contributes less (factor = 1 / (1 + 0.3 * count))
    const diminishingFactor = 1 / (1 + 0.3 * count);
    areaMap.set(area, current + proc.ebitda_score * diminishingFactor);
    areaProcessCount.set(area, count + 1);
  }

  const by_value_chain_area = Array.from(areaMap.entries()).map(([area, score]) => ({
    area,
    impact_pct: Math.round(score * 100) / 100,
    impact_dollars: revenue > 0 ? Math.round((score / 100) * revenue) : 0,
  }));

  // Cap total at 15% of revenue to prevent unrealistic additive inflation
  const MAX_IMPACT_PCT = 15;
  const rawTotal = by_value_chain_area.reduce((sum, a) => sum + a.impact_pct, 0);
  const total_impact_pct = Math.min(rawTotal, MAX_IMPACT_PCT);
  const total_impact_dollars = revenue > 0 ? Math.round((total_impact_pct / 100) * revenue) : 0;

  const assumptions = [
    `Revenue: $${(revenue / 1_000_000).toFixed(0)}M`,
    `Impact percentages from APQC EBITDA scoring (${selectedProcesses.length} processes)`,
    "Diminishing returns applied when multiple processes target the same value chain area",
    `Total capped at ${MAX_IMPACT_PCT}% of revenue to prevent additive inflation${rawTotal > MAX_IMPACT_PCT ? ` (raw total: ${rawTotal.toFixed(1)}%)` : ""}`,
    "Assumes full implementation with recommended agent portfolio",
    "Actual impact depends on adoption, change management, and existing automation maturity",
  ];

  return {
    total_impact_pct,
    total_impact_dollars,
    by_value_chain_area,
    assumptions,
  };
}
