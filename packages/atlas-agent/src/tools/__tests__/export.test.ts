import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionStore } from "../../session/index.js";
import { createMinimalNode } from "../../test-helpers.js";
import {
  handleSelectTargetPlatform,
  handleTranslateToPlatform,
  handleExportPackage,
} from "../export.js";

let store: SessionStore;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-export-test-"));
  store = new SessionStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("handleSelectTargetPlatform", () => {
  it("accepts claude_agent_sdk and returns capabilities", () => {
    const session = store.create();
    const result = handleSelectTargetPlatform("claude_agent_sdk", session.id, store);
    expect(result).toHaveProperty("platform", "claude_agent_sdk");
    expect(result).toHaveProperty("capabilities");
    expect(result).toHaveProperty("limitations");
  });

  it("rejects unknown platform", () => {
    const session = store.create();
    const result = handleSelectTargetPlatform("unknown_platform", session.id, store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleTranslateToPlatform", () => {
  it("translates a fractal system into artifacts", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Fortis Health",
          gics_sector: "Health Care",
          gics_industry_group: "HCE&S",
          gics_industry: "HCP&S",
          gics_sub_industry: "HCS",
          revenue: 500_000_000,
          employees: 3000,
          ownership: "pe-backed",
          strategic_context: "Digital health",
        },
        documents: [],
        public_data: [],
      },
    });

    // Add nodes to build a system
    const area = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, area, null);
    const pod = createMinimalNode("pod-claims", "Claims Processing", "pod");
    store.addNode(session.id, pod, "area-ops");
    const agent = createMinimalNode("agent-claims-proc", "Claims Processor", "agent");
    agent.tools_memory_policies.tools = [
      { name: "process_claim", description: "Process a claim", parameters: [], returns: "ClaimResult" },
    ];
    store.addNode(session.id, agent, "pod-claims");

    // Set target platform
    const s = store.get(session.id)!;
    s.fractal_system!.target_platform = "claude_agent_sdk";
    store.update(session.id, { fractal_system: s.fractal_system });

    const result = handleTranslateToPlatform(session.id, store);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result).toHaveProperty("translated_system");
    expect(result).toHaveProperty("artifact_count");
    expect(result.artifact_count).toBeGreaterThan(0);
  });

  it("returns error when no fractal_system", () => {
    const session = store.create();
    const result = handleTranslateToPlatform(session.id, store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleExportPackage", () => {
  it("returns package with artifacts", () => {
    const session = store.create();
    store.update(session.id, {
      company_context: {
        profile: {
          name: "Fortis Health",
          gics_sector: "Health Care",
          gics_industry_group: "HCE&S",
          gics_industry: "HCP&S",
          gics_sub_industry: "HCS",
          revenue: 500_000_000,
          employees: 3000,
          ownership: "pe-backed",
          strategic_context: "Digital health",
        },
        documents: [],
        public_data: [],
      },
    });

    const area = createMinimalNode("area-ops", "Operations", "value_chain_area");
    store.addNode(session.id, area, null);

    const s = store.get(session.id)!;
    s.fractal_system!.target_platform = "claude_agent_sdk";
    store.update(session.id, { fractal_system: s.fractal_system });

    // Translate first
    handleTranslateToPlatform(session.id, store);

    const result = handleExportPackage(session.id, "json", store);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result).toHaveProperty("package_id");
    expect(result).toHaveProperty("artifacts");
    expect(result).toHaveProperty("package_content");
  });
});
