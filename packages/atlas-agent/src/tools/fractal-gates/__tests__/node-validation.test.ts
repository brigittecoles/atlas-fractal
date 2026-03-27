import { describe, it, expect } from "vitest";
import { handleValidateNode } from "../node-validation.js";
import type { UniversalFractalNode } from "../../../types/index.js";

function makeValidNode(overrides?: Partial<UniversalFractalNode>): UniversalFractalNode {
  return {
    identity: {
      name: "Budget Forecaster",
      id: "agent-001",
      type: "agent",
      parent_context: "Finance Pod",
      candidate_child_concepts: [],
      stopping_condition: "No further decomposition needed",
    },
    purpose_context: {
      purpose: "Forecast quarterly budgets based on historical data",
      domain: "Finance",
      subdomain: "Budgeting",
      surfaces: ["dashboard"],
      primary_users: ["CFO"],
      primary_route: "/finance/budget",
      mad_lib: "I forecast budgets so that...",
    },
    io: {
      inputs: ["Historical financials"],
      outputs: [
        { output_id: "o1", name: "Budget Report", description: "Quarterly budget forecast" },
      ],
      why_outputs_matter: "Enables informed financial planning",
      downstream_consumers: ["CFO"],
      blast_radius: "department",
    },
    output_value_thesis: {
      quality: "High accuracy",
      speed: "Same-day delivery",
      reliability: "99.9% uptime",
      reuse: "Reusable across quarters",
      governance: "SOX compliant",
      productization: "Self-serve dashboard",
    },
    runtime_shape: {
      object_types: ["budget_report"],
      resolvers: ["fetch_historical"],
      states: ["draft", "final"],
      triggers: ["quarter_end"],
      actions: ["generate_forecast"],
      output_destinations: ["dashboard"],
      runtime_tier: "runtime",
    },
    tools_memory_policies: {
      tools: [{ name: "forecast_tool", description: "Forecasts budgets", parameters: [], returns: "BudgetReport" }],
      memory: {
        working: { description: "Current context", storage_type: "in-memory", retention_policy: "session" },
        episodic: { description: "Past forecasts", storage_type: "db", retention_policy: "90d" },
        semantic: { description: "Domain knowledge", storage_type: "vector", retention_policy: "permanent" },
        procedural: { description: "Forecast procedures", storage_type: "config", retention_policy: "permanent" },
      },
      skills: [],
      mcp_servers: [],
      data_sources: [],
      policies: [],
      handoffs: [],
      owner: "finance-team",
      lifecycle_status: "active",
    },
    structural_npv: {
      output_value_scores: [
        { output_id: "o1", output_name: "Budget Report", importance: 5, quality_gain: 4, speed_gain: 5, reliability_gain: 4, reuse_gain: 3, governance_gain: 3, productization_gain: 2, total: 17.5 },
      ],
      total_output_value: 17.5,
      cost_scores: { complexity: 1, maintenance_burden: 1, coordination_overhead: 0, semantic_duplication: 0, ontology_sprawl: 0, consolidation_risk: 0 },
      total_structural_cost: 2,
      net_structural_npv: 15.5,
      recommendation: "create",
    },
    decomposition_gate: { proposed_children: [] },
    ontology_linkage: {},
    capability_linkage: {},
    aeo_geo_linkage: {},
    children: [],
    ...overrides,
  };
}

describe("handleValidateNode", () => {
  it("valid node passes all tests", () => {
    const node = makeValidNode();
    const result = handleValidateNode(node);
    expect(result.overall_valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.tests.length).toBeGreaterThanOrEqual(4);
    expect(result.tests.every((t) => t.pass)).toBe(true);
  });

  it("node without outputs fails", () => {
    const node = makeValidNode({
      io: {
        inputs: [],
        outputs: [],
        why_outputs_matter: "",
        downstream_consumers: [],
        blast_radius: "",
      },
    });
    const result = handleValidateNode(node);
    expect(result.overall_valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.toLowerCase().includes("output"))).toBe(true);
  });

  it("node without NPV create recommendation fails", () => {
    const node = makeValidNode({
      structural_npv: {
        output_value_scores: [],
        total_output_value: 0,
        cost_scores: { complexity: 0, maintenance_burden: 0, coordination_overhead: 0, semantic_duplication: 0, ontology_sprawl: 0, consolidation_risk: 0 },
        total_structural_cost: 0,
        net_structural_npv: -5,
        recommendation: "demote",
      },
    });
    const result = handleValidateNode(node);
    expect(result.overall_valid).toBe(false);
    expect(result.issues.some((i) => i.toLowerCase().includes("npv") || i.toLowerCase().includes("recommendation"))).toBe(true);
  });
});
