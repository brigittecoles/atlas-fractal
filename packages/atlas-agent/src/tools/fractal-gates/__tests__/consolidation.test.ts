import { describe, it, expect } from "vitest";
import { handleCheckConsolidation, jaccardSimilarity } from "../consolidation.js";
import type { UniversalFractalNode } from "../../../types/index.js";

function makeNode(overrides: {
  name: string;
  id: string;
  type: UniversalFractalNode["identity"]["type"];
  purpose: string;
  outputs?: { output_id: string; name: string; description: string }[];
}): UniversalFractalNode {
  const defaultMemoryLayer = { description: "", storage_type: "in-memory", retention_policy: "session" };
  return {
    identity: {
      name: overrides.name,
      id: overrides.id,
      type: overrides.type,
      parent_context: "",
      candidate_child_concepts: [],
      stopping_condition: "",
    },
    purpose_context: {
      purpose: overrides.purpose,
      domain: "",
      subdomain: "",
      surfaces: [],
      primary_users: [],
      primary_route: "",
      mad_lib: "",
    },
    io: {
      inputs: [],
      outputs: overrides.outputs ?? [{ output_id: "o1", name: "Default Output", description: "" }],
      why_outputs_matter: "",
      downstream_consumers: [],
      blast_radius: "",
    },
    output_value_thesis: { quality: "", speed: "", reliability: "", reuse: "", governance: "", productization: "" },
    runtime_shape: { object_types: [], resolvers: [], states: [], triggers: [], actions: [], output_destinations: [], runtime_tier: "runtime" },
    tools_memory_policies: {
      tools: [], memory: { working: defaultMemoryLayer, episodic: defaultMemoryLayer, semantic: defaultMemoryLayer, procedural: defaultMemoryLayer },
      skills: [], mcp_servers: [], data_sources: [], policies: [], handoffs: [], owner: "", lifecycle_status: "",
    },
    structural_npv: {
      output_value_scores: [], total_output_value: 0,
      cost_scores: { complexity: 0, maintenance_burden: 0, coordination_overhead: 0, semantic_duplication: 0, ontology_sprawl: 0, consolidation_risk: 0 },
      total_structural_cost: 0, net_structural_npv: 0, recommendation: "create",
    },
    decomposition_gate: { proposed_children: [] },
    ontology_linkage: {},
    capability_linkage: {},
    aeo_geo_linkage: {},
    children: [],
  };
}

describe("jaccardSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(jaccardSimilarity("hello world", "hello world")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(jaccardSimilarity("hello world", "foo bar")).toBe(0);
  });
});

describe("handleCheckConsolidation", () => {
  it('detects near-synonym overlap between "Budget Forecaster" / "Financial Forecaster"', () => {
    const nodes: UniversalFractalNode[] = [
      makeNode({ name: "Budget Forecaster", id: "a1", type: "agent", purpose: "Forecast quarterly budgets" }),
      makeNode({ name: "Financial Forecaster", id: "a2", type: "agent", purpose: "Forecast quarterly financial plans" }),
    ];

    const result = handleCheckConsolidation(nodes);
    expect(result.overlap_candidates.length).toBeGreaterThan(0);
    expect(result.overlap_candidates[0].node_a_id).toBe("a1");
    expect(result.overlap_candidates[0].node_b_id).toBe("a2");
  });

  it("returns empty when nodes are distinct", () => {
    const nodes: UniversalFractalNode[] = [
      makeNode({ name: "Budget Forecaster", id: "a1", type: "agent", purpose: "Forecast quarterly budgets", outputs: [{ output_id: "o1", name: "Budget Report", description: "" }] }),
      makeNode({ name: "Compliance Auditor", id: "a2", type: "agent", purpose: "Audit regulatory compliance reports", outputs: [{ output_id: "o2", name: "Compliance Report", description: "" }] }),
    ];

    const result = handleCheckConsolidation(nodes);
    expect(result.overlap_candidates).toHaveLength(0);
  });

  it("recommends merge for nodes with overlapping outputs", () => {
    const sharedOutputs = [
      { output_id: "o1", name: "Forecast Report", description: "Quarterly forecast" },
      { output_id: "o2", name: "Budget Summary", description: "Summary of budgets" },
    ];
    const nodes: UniversalFractalNode[] = [
      makeNode({ name: "Agent Alpha", id: "a1", type: "agent", purpose: "Alpha tasks", outputs: sharedOutputs }),
      makeNode({ name: "Agent Beta", id: "a2", type: "agent", purpose: "Beta tasks", outputs: sharedOutputs }),
    ];

    const result = handleCheckConsolidation(nodes);
    expect(result.overlap_candidates.length).toBeGreaterThan(0);
    const dup = result.overlap_candidates.find((c) => c.overlap_type === "semantic_duplicate");
    expect(dup).toBeDefined();
    expect(dup!.recommendation).toBe("merge");
  });

  it("only compares nodes at the same level (same type)", () => {
    const nodes: UniversalFractalNode[] = [
      makeNode({ name: "Finance Area", id: "area1", type: "value_chain_area", purpose: "Finance value chain area" }),
      makeNode({ name: "Finance Agent", id: "agent1", type: "agent", purpose: "Finance agent tasks" }),
    ];

    const result = handleCheckConsolidation(nodes);
    // Different types should not be compared
    expect(result.overlap_candidates).toHaveLength(0);
  });
});
