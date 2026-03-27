import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionStore } from "../../session/index.js";
import type { UniversalFractalNode } from "../../types/index.js";
import {
  handleDesignFractalSystem,
  handleDesignFractalPod,
  handleDesignFractalAgent,
  handleStoreFractalNode,
  handleStoreDemotedConcept,
  handleStoreFractalSystem,
} from "../agent-design.js";
import { createMinimalNode } from "../../test-helpers.js";

let store: SessionStore;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-design-test-"));
  store = new SessionStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("handleDesignFractalSystem", () => {
  it("returns context when session has company_context and selected_processes", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Fortis Health",
          gics_sector: "Health Care",
          gics_industry_group: "Health Care Equipment & Services",
          gics_industry: "Health Care Providers & Services",
          gics_sub_industry: "Health Care Services",
          revenue: 500_000_000,
          employees: 3000,
          ownership: "pe-backed",
          pe_sponsor: "Summit Partners",
          strategic_context: "Expanding into digital health services",
        },
        documents: [],
        public_data: [],
      },
      selected_processes: [
        {
          process_id: "3.2",
          process_name: "Develop Sales Strategy",
          l1_id: "3.0",
          l1_name: "Market and Sell Products and Services",
          porter_activity: "Marketing & Sales",
          client_justification: "Revenue growth focus",
          ebitda_score: 3.5,
        },
      ],
    });

    const result = handleDesignFractalSystem(session.id, store);
    expect(result).toHaveProperty("company_summary");
    expect(result).toHaveProperty("selected_processes");
    expect(result).toHaveProperty("porter_mapping");
    expect(result).toHaveProperty("fractal_doctrine");
    expect(result).toHaveProperty("design_guidelines");
    expect(result.company_summary.name).toBe("Fortis Health");
    expect(result.selected_processes).toHaveLength(1);
  });

  it("returns error when no company_context", () => {
    const session = store.create();
    const result = handleDesignFractalSystem(session.id, store);
    expect(result).toHaveProperty("error");
  });

  it("returns error when no selected_processes", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Test Co",
          gics_sector: "Technology",
          gics_industry_group: "Software",
          gics_industry: "Application Software",
          gics_sub_industry: "Application Software",
          revenue: 100_000_000,
          employees: 500,
          ownership: "private",
          strategic_context: "Growth",
        },
        documents: [],
        public_data: [],
      },
    });
    const result = handleDesignFractalSystem(session.id, store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleDesignFractalPod", () => {
  it("returns scoped context for a value chain area", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Fortis Health",
          gics_sector: "Health Care",
          gics_industry_group: "Health Care Equipment & Services",
          gics_industry: "Health Care Providers & Services",
          gics_sub_industry: "Health Care Services",
          revenue: 500_000_000,
          employees: 3000,
          ownership: "pe-backed",
          strategic_context: "Expanding into digital health services",
        },
        documents: [],
        public_data: [],
      },
      selected_processes: [
        {
          process_id: "3.2",
          process_name: "Develop Sales Strategy",
          l1_id: "3.0",
          l1_name: "Market and Sell Products and Services",
          porter_activity: "Marketing & Sales",
          client_justification: "Revenue growth focus",
          ebitda_score: 3.5,
        },
      ],
    });

    const result = handleDesignFractalPod(
      session.id,
      "Marketing & Sales",
      ["3.2"],
      { max_agents: 3 },
      store
    );
    expect(result).toHaveProperty("value_chain_area", "Marketing & Sales");
    expect(result).toHaveProperty("scoped_processes");
    expect(result.scoped_processes).toHaveLength(1);
  });
});

describe("handleDesignFractalAgent", () => {
  it("returns scoped context for an agent", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Fortis Health",
          gics_sector: "Health Care",
          gics_industry_group: "Health Care Equipment & Services",
          gics_industry: "Health Care Providers & Services",
          gics_sub_industry: "Health Care Services",
          revenue: 500_000_000,
          employees: 3000,
          ownership: "pe-backed",
          strategic_context: "Digital health expansion",
        },
        documents: [],
        public_data: [],
      },
    });

    const result = handleDesignFractalAgent(
      session.id,
      "pod-sales-1",
      ["Sales forecast report", "Pipeline analysis"],
      { model: "claude-sonnet" },
      store
    );
    expect(result).toHaveProperty("pod_id", "pod-sales-1");
    expect(result).toHaveProperty("required_outputs");
    expect(result.required_outputs).toHaveLength(2);
  });
});

describe("handleStoreFractalNode", () => {
  it("persists a node to session fractal_system", () => {
    const session = store.create();
    const node = createMinimalNode("area-ops", "Operations", "value_chain_area");

    const result = handleStoreFractalNode(session.id, node, null, store);
    expect(result).toHaveProperty("stored_node_id", "area-ops");
    expect(result.system_node_count).toBe(1);

    const updated = store.get(session.id)!;
    expect(updated.fractal_system).not.toBeNull();
    expect(updated.fractal_system!.value_chain_areas).toHaveLength(1);
  });

  it("adds child node under parent", () => {
    const session = store.create();
    const parent = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, parent, null);

    const child = createMinimalNode("pod-claims", "Claims Processing", "pod");
    const result = handleStoreFractalNode(session.id, child, "area-ops", store);
    expect(result.stored_node_id).toBe("pod-claims");
    expect(result.system_node_count).toBe(2);
  });
});

describe("handleStoreDemotedConcept", () => {
  it("stores a demoted concept", () => {
    const session = store.create();
    // Initialize fractal_system first by adding a node
    const node = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, node, null);

    const result = handleStoreDemotedConcept(
      session.id,
      {
        concept: "Email Formatter",
        parent_node_id: "area-ops",
        demoted_to: "field on parent",
        rationale: "No distinct runtime or outputs",
        npv_score: -1.5,
        gate_results: {
          concept: "Email Formatter",
          distinct_runtime_behavior: false,
          distinct_outputs: false,
          distinct_reuse: false,
          best_form: "field",
          rationale: "No distinctions",
          action: "add_as_field",
        },
        can_override: true,
      },
      store
    );
    expect(result).toHaveProperty("stored", true);
    expect(result.total_demoted).toBe(1);
  });
});

describe("handleStoreFractalSystem", () => {
  it("finalizes system and advances status to design", () => {
    const session = store.create();
    const node = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, node, null);

    const result = handleStoreFractalSystem(session.id, store);
    expect(result).toHaveProperty("success", true);
    expect(result.total_nodes).toBe(1);
    expect(result.total_demoted).toBe(0);
    expect(result.status).toBe("design");

    const updated = store.get(session.id)!;
    expect(updated.status).toBe("design");
  });

  it("returns error when no fractal_system exists", () => {
    const session = store.create();
    const result = handleStoreFractalSystem(session.id, store);
    expect(result).toHaveProperty("error");
  });
});
