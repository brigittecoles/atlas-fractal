import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SessionStore } from "../store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { UniversalFractalNode, NodeType, DemotedConcept } from "../../types/index.js";

function createMockNode(id: string, name: string, type: NodeType): UniversalFractalNode {
  return {
    identity: {
      name,
      id,
      type,
      parent_context: "",
      candidate_child_concepts: [],
      stopping_condition: "",
    },
    purpose_context: {
      purpose: "",
      domain: "",
      subdomain: "",
      surfaces: [],
      primary_users: [],
      primary_route: "",
      mad_lib: "",
    },
    io: {
      inputs: [],
      outputs: [],
      why_outputs_matter: "",
      downstream_consumers: [],
      blast_radius: "",
    },
    output_value_thesis: {
      quality: "",
      speed: "",
      reliability: "",
      reuse: "",
      governance: "",
      productization: "",
    },
    runtime_shape: {
      object_types: [],
      resolvers: [],
      states: [],
      triggers: [],
      actions: [],
      output_destinations: [],
      runtime_tier: "runtime",
    },
    tools_memory_policies: {
      tools: [],
      memory: {
        working: { description: "", storage_type: "", retention_policy: "" },
        episodic: { description: "", storage_type: "", retention_policy: "" },
        semantic: { description: "", storage_type: "", retention_policy: "" },
        procedural: { description: "", storage_type: "", retention_policy: "" },
      },
      skills: [],
      mcp_servers: [],
      data_sources: [],
      policies: [],
      handoffs: [],
      owner: "",
      lifecycle_status: "",
    },
    structural_npv: {
      output_value_scores: [],
      total_output_value: 0,
      cost_scores: {
        complexity: 0,
        maintenance_burden: 0,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
      total_structural_cost: 0,
      net_structural_npv: 0,
      recommendation: "create",
    },
    decomposition_gate: { proposed_children: [] },
    ontology_linkage: {},
    capability_linkage: {},
    aeo_geo_linkage: {},
    children: [],
  };
}

describe("SessionStore", () => {
  let store: SessionStore;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "atlas-session-test-"));
    store = new SessionStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("1. creates session with unique ID, status intake, null fractal_system", () => {
    const session = store.create();
    expect(session.id).toBeTruthy();
    expect(session.status).toBe("intake");
    expect(session.fractal_system).toBeNull();
    expect(session.company_context).toBeNull();
    expect(session.selected_processes).toEqual([]);
    expect(session.translated_system).toBeNull();
    expect(session.history).toEqual([]);
  });

  it("2. persists and retrieves session", () => {
    const session = store.create();
    const retrieved = store.get(session.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(session.id);
    expect(retrieved!.status).toBe("intake");
  });

  it("3. updates session and persists changes", () => {
    const session = store.create();
    store.update(session.id, { status: "processes" });
    const retrieved = store.get(session.id);
    expect(retrieved!.status).toBe("processes");
    expect(new Date(retrieved!.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(session.updated_at).getTime()
    );
  });

  it("4. returns null for unknown session ID", () => {
    const result = store.get("nonexistent-id");
    expect(result).toBeNull();
  });

  it("5. lists all sessions", () => {
    store.create();
    store.create();
    store.create();
    const sessions = store.list();
    expect(sessions).toHaveLength(3);
  });

  it("6. deletes a session", () => {
    const session = store.create();
    store.delete(session.id);
    expect(store.get(session.id)).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("7. appends events to session history with auto-timestamp", () => {
    const session = store.create();
    store.appendEvent(session.id, {
      type: "tool_call",
      tool_name: "search_processes",
      summary: "Searched APQC processes",
    });
    const retrieved = store.get(session.id)!;
    expect(retrieved.history).toHaveLength(1);
    expect(retrieved.history[0].type).toBe("tool_call");
    expect(retrieved.history[0].tool_name).toBe("search_processes");
    expect(retrieved.history[0].timestamp).toBeTruthy();
  });

  it("8. cleans up sessions older than TTL", () => {
    const session = store.create();
    // Manually backdate the session
    const old = store.get(session.id)!;
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
    store.update(session.id, { created_at: pastDate, updated_at: pastDate } as any);

    const fresh = store.create();

    store.cleanup(5); // 5-day TTL
    expect(store.get(session.id)).toBeNull();
    expect(store.get(fresh.id)).not.toBeNull();
  });

  it("9. initializes fractal_system on first addNode call", () => {
    const session = store.create();
    const area = createMockNode("area-1", "Supply Chain", "value_chain_area");
    store.addNode(session.id, area, null);
    const retrieved = store.get(session.id)!;
    expect(retrieved.fractal_system).not.toBeNull();
    expect(retrieved.fractal_system!.schema_version).toBe("6.0-fractal");
    expect(retrieved.fractal_system!.value_chain_areas).toHaveLength(1);
    expect(retrieved.fractal_system!.value_chain_areas[0].identity.id).toBe("area-1");
  });

  it("10. nests a pod under a value chain area by parent_node_id", () => {
    const session = store.create();
    const area = createMockNode("area-1", "Supply Chain", "value_chain_area");
    store.addNode(session.id, area, null);

    const pod = createMockNode("pod-1", "Procurement Pod", "pod");
    store.addNode(session.id, pod, "area-1");

    const retrieved = store.get(session.id)!;
    const areaNode = retrieved.fractal_system!.value_chain_areas[0];
    expect(areaNode.children).toHaveLength(1);
    expect(areaNode.children[0].identity.id).toBe("pod-1");
  });

  it("11. nests an agent under a pod (two levels deep)", () => {
    const session = store.create();
    const area = createMockNode("area-1", "Supply Chain", "value_chain_area");
    store.addNode(session.id, area, null);

    const pod = createMockNode("pod-1", "Procurement Pod", "pod");
    store.addNode(session.id, pod, "area-1");

    const agent = createMockNode("agent-1", "RFP Analyst", "agent");
    store.addNode(session.id, agent, "pod-1");

    const retrieved = store.get(session.id)!;
    const podNode = retrieved.fractal_system!.value_chain_areas[0].children[0];
    expect(podNode.children).toHaveLength(1);
    expect(podNode.children[0].identity.id).toBe("agent-1");
  });

  it("12. throws when parent_node_id not found", () => {
    const session = store.create();
    const area = createMockNode("area-1", "Supply Chain", "value_chain_area");
    store.addNode(session.id, area, null);

    const pod = createMockNode("pod-1", "Procurement Pod", "pod");
    expect(() => store.addNode(session.id, pod, "nonexistent")).toThrow();
  });

  it("13. stores demoted concepts", () => {
    const session = store.create();
    // Initialize fractal_system first
    const area = createMockNode("area-1", "Supply Chain", "value_chain_area");
    store.addNode(session.id, area, null);

    const concept: DemotedConcept = {
      concept: "Invoice Validator",
      parent_node_id: "area-1",
      demoted_to: "field",
      rationale: "No distinct runtime behavior",
      npv_score: -2,
      gate_results: {
        concept: "Invoice Validator",
        distinct_runtime_behavior: false,
        distinct_outputs: false,
        distinct_reuse: false,
        best_form: "field",
        rationale: "Can be a config field on parent",
        action: "demote",
      },
      can_override: true,
    };

    store.addDemotedConcept(session.id, concept);
    const retrieved = store.get(session.id)!;
    expect(retrieved.fractal_system!.demoted_concepts).toHaveLength(1);
    expect(retrieved.fractal_system!.demoted_concepts[0].concept).toBe("Invoice Validator");
  });
});
