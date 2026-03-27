import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionStore } from "../../session/index.js";
import { createMinimalNode } from "../../test-helpers.js";
import {
  handleValidateFractalSystem,
  handleResolveDependencies,
  handleEstimateEbitdaImpact,
  type ValidationResult,
  type DependencyResult,
  type EbitdaResult,
} from "../system-validation.js";

let store: SessionStore;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-validation-test-"));
  store = new SessionStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("handleValidateFractalSystem", () => {
  it("validates a system with valid nodes", () => {
    const session = store.create();
    const node = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, node, null);

    const result = handleValidateFractalSystem(session.id, store) as ValidationResult;
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("dependency_graph");
    expect(result).toHaveProperty("npv_coverage");
  });

  it("catches missing outputs on a node", () => {
    const session = store.create();
    const node = createMinimalNode("area-ops", "Operations", "value_chain_area");
    // Clear outputs to trigger validation issue
    node.io.outputs = [];
    store.addNode(session.id, node, null);

    const result = handleValidateFractalSystem(session.id, store) as ValidationResult;
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    const outputIssue = result.issues.find((i: any) => i.category === "missing_outputs");
    expect(outputIssue).toBeDefined();
  });

  it("catches missing name on a node", () => {
    const session = store.create();
    const node = createMinimalNode("area-ops", "", "value_chain_area");
    node.identity.name = "";
    store.addNode(session.id, node, null);

    const result = handleValidateFractalSystem(session.id, store) as ValidationResult;
    expect(result.valid).toBe(false);
    const nameIssue = result.issues.find((i: any) => i.category === "missing_name");
    expect(nameIssue).toBeDefined();
  });

  it("returns error when no fractal_system", () => {
    const session = store.create();
    const result = handleValidateFractalSystem(session.id, store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleResolveDependencies", () => {
  it("builds execution layers from dependency graph", () => {
    const session = store.create();
    const area = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, area, null);
    const pod = createMinimalNode("pod-claims", "Claims", "pod");
    store.addNode(session.id, pod, "area-ops");

    const result = handleResolveDependencies(session.id, store) as DependencyResult;
    expect(result).toHaveProperty("layers");
    expect(result).toHaveProperty("cross_pod_flows");
    expect(result).toHaveProperty("has_cycles");
    expect(result.has_cycles).toBe(false);
    expect(result.layers.length).toBeGreaterThan(0);
  });

  it("returns error when no fractal_system", () => {
    const session = store.create();
    const result = handleResolveDependencies(session.id, store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleEstimateEbitdaImpact", () => {
  it("computes EBITDA impact from financials and processes", () => {
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
      selected_processes: [
        {
          process_id: "3.2",
          process_name: "Develop Sales Strategy",
          l1_id: "3.0",
          l1_name: "Market and Sell Products and Services",
          porter_activity: "Marketing & Sales",
          client_justification: "Revenue growth",
          ebitda_score: 2.5,
        },
        {
          process_id: "6.1",
          process_name: "Plan Customer Service",
          l1_id: "6.0",
          l1_name: "Manage Customer Service",
          porter_activity: "Service",
          client_justification: "Customer retention",
          ebitda_score: 1.5,
        },
      ],
    });

    const result = handleEstimateEbitdaImpact(session.id, store) as EbitdaResult;
    expect(result).toHaveProperty("total_impact_pct");
    expect(result).toHaveProperty("total_impact_dollars");
    expect(result).toHaveProperty("by_value_chain_area");
    expect(result).toHaveProperty("assumptions");
    expect(result.total_impact_pct).toBeGreaterThan(0);
    expect(result.total_impact_dollars).toBeGreaterThan(0);
    expect(result.by_value_chain_area.length).toBe(2);
  });

  it("returns error when no company context", () => {
    const session = store.create();
    const result = handleEstimateEbitdaImpact(session.id, store);
    expect(result).toHaveProperty("error");
  });
});
