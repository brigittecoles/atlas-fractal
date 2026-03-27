import type { UniversalFractalNode, NodeType } from "./types/index.js";

/**
 * Creates a minimal valid UniversalFractalNode with all required fields populated with defaults.
 */
export function createMinimalNode(
  id: string,
  name: string,
  type: NodeType,
): UniversalFractalNode {
  return {
    identity: {
      name,
      id,
      type,
      parent_context: "",
      candidate_child_concepts: [],
      stopping_condition: "semantic saturation",
    },
    purpose_context: {
      purpose: `${name} purpose`,
      domain: "enterprise",
      subdomain: "operations",
      surfaces: ["api"],
      primary_users: ["enterprise client"],
      primary_route: "automated",
      mad_lib: `This node handles ${name.toLowerCase()} for the client.`,
    },
    io: {
      inputs: ["client context"],
      outputs: [
        {
          output_id: `${id}-out-1`,
          name: `${name} output`,
          description: `Primary output of ${name}`,
        },
      ],
      why_outputs_matter: `${name} outputs drive business value`,
      downstream_consumers: [],
      blast_radius: "contained",
    },
    output_value_thesis: {
      quality: "Improves accuracy",
      speed: "Reduces cycle time",
      reliability: "Consistent delivery",
      reuse: "Reusable across processes",
      governance: "Auditable",
      productization: "Packageable",
    },
    runtime_shape: {
      object_types: [],
      resolvers: [],
      states: ["idle", "running", "complete"],
      triggers: ["on_request"],
      actions: ["process"],
      output_destinations: ["downstream"],
      runtime_tier: "runtime",
    },
    tools_memory_policies: {
      tools: [],
      memory: {
        working: { description: "Working memory", storage_type: "in-memory", retention_policy: "session" },
        episodic: { description: "Episodic memory", storage_type: "file", retention_policy: "persistent" },
        semantic: { description: "Semantic memory", storage_type: "vector", retention_policy: "persistent" },
        procedural: { description: "Procedural memory", storage_type: "code", retention_policy: "persistent" },
      },
      skills: [],
      mcp_servers: [],
      data_sources: [],
      policies: [],
      handoffs: [],
      owner: "system",
      lifecycle_status: "active",
    },
    structural_npv: {
      output_value_scores: [
        {
          output_id: `${id}-out-1`,
          output_name: `${name} output`,
          importance: 4,
          quality_gain: 3,
          speed_gain: 3,
          reliability_gain: 3,
          reuse_gain: 2,
          governance_gain: 2,
          productization_gain: 2,
          total: 4 * ((3 + 3 + 3 + 2 + 2 + 2) / 6),
        },
      ],
      total_output_value: 4 * ((3 + 3 + 3 + 2 + 2 + 2) / 6),
      cost_scores: {
        complexity: 2,
        maintenance_burden: 1,
        coordination_overhead: 1,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
      total_structural_cost: 4,
      net_structural_npv: 4 * ((3 + 3 + 3 + 2 + 2 + 2) / 6) - 4,
      recommendation: "create",
    },
    decomposition_gate: {
      proposed_children: [],
    },
    ontology_linkage: {},
    capability_linkage: {},
    aeo_geo_linkage: {},
    children: [],
  };
}
