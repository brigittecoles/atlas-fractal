import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionStore } from "../session/index.js";
import { handleIngestDocument, handleEnrichCompanyProfile } from "../tools/document-ingestion.js";
import { handleSearchProcesses } from "../tools/apqc.js";
import { handleScoreStructuralNpv } from "../tools/fractal-gates/structural-npv.js";
import { handleDecompositionGate } from "../tools/fractal-gates/decomposition-gate.js";
import { handleValidateFractalSystem } from "../tools/system-validation.js";
import { handleSelectTargetPlatform, handleTranslateToPlatform } from "../tools/export.js";
import { createMinimalNode } from "../test-helpers.js";

let store: SessionStore;
let tmpDir: string;
let sessionId: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-integration-test-"));
  store = new SessionStore(tmpDir);
  const session = store.create();
  sessionId = session.id;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("ATLAS-Fractal Integration", () => {
  it("completes full pipeline: ingest -> enrich -> search -> design -> gate -> store -> validate -> export", async () => {
    // 1. Ingest a document
    const ingestResult = await handleIngestDocument(
      {
        session_id: sessionId,
        file_name: "test.txt",
        file_content: Buffer.from("Fortis Health revenue $500M EBITDA 15%").toString("base64"),
        file_type: "txt",
      },
      store
    );
    expect(ingestResult).not.toHaveProperty("error");
    expect("document_id" in ingestResult && ingestResult.document_id).toBeTruthy();

    // 2. Enrich company profile
    const enrichResult = await handleEnrichCompanyProfile(sessionId, store);
    expect(enrichResult).not.toHaveProperty("error");
    const session = store.get(sessionId);
    expect(session?.company_context?.profile).toBeTruthy();

    // 3. Search APQC processes
    const searchResult = handleSearchProcesses({ industry: "healthcare" });
    expect(searchResult.processes.length).toBeGreaterThan(0);

    // 4. Score structural NPV for a proposed node
    const npvResult = handleScoreStructuralNpv({
      node_proposal: { name: "Claims Processing Pod", purpose: "Automate claims" },
      per_output_scores: [
        {
          output_name: "Processed claim",
          importance: 5,
          quality_gain: 4,
          speed_gain: 5,
          reliability_gain: 4,
          reuse_gain: 3,
          governance_gain: 3,
          productization_gain: 2,
        },
      ],
      cost_estimates: {
        complexity: 2,
        maintenance_burden: 1,
        coordination_overhead: 1,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 1,
      },
    });
    expect(npvResult.recommendation).toBe("create");

    // 5. Run decomposition gate
    const gateResult = handleDecompositionGate({
      proposed_concept: "Claims Processing Agent",
      has_distinct_runtime_behavior: true,
      has_distinct_outputs: true,
      has_distinct_reuse: true,
    });
    expect(gateResult.best_form).toBe("instance");

    // 6. Store a fractal node (create minimal valid node)
    const node = createMinimalNode("area-1", "Operations", "value_chain_area");
    store.addNode(sessionId, node, null);

    // 7. Validate
    const valResult = handleValidateFractalSystem(sessionId, store);
    // Should not be an error — may have warnings but should have the validation shape
    expect(valResult).not.toHaveProperty("error");

    // 8. Select platform + translate
    const platformResult = handleSelectTargetPlatform("claude_agent_sdk", sessionId, store) as Record<string, any>;
    expect(platformResult.platform).toBe("claude_agent_sdk");

    // Set target platform on fractal_system
    const sessionBeforeTranslate = store.get(sessionId)!;
    if (sessionBeforeTranslate.fractal_system) {
      sessionBeforeTranslate.fractal_system.target_platform = "claude_agent_sdk";
      store.update(sessionId, { fractal_system: sessionBeforeTranslate.fractal_system });
    }

    const translateResult = handleTranslateToPlatform(sessionId, store);
    expect(translateResult).not.toHaveProperty("error");

    // 9. Verify session accumulated state
    const finalSession = store.get(sessionId);
    expect(finalSession?.fractal_system).toBeTruthy();
    expect(finalSession?.fractal_system?.value_chain_areas).toHaveLength(1);
  });
});
