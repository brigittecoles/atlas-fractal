import { describe, it, expect } from "vitest";
import { handleScoreStructuralNpv } from "../structural-npv.js";
import type { NpvInput } from "../structural-npv.js";

describe("handleScoreStructuralNpv", () => {
  it('returns "create" for node with high output value and low cost', () => {
    const input: NpvInput = {
      node_proposal: { name: "Budget Forecaster", purpose: "Forecast quarterly budgets" },
      per_output_scores: [
        {
          output_name: "Quarterly Budget Report",
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
        complexity: 1,
        maintenance_burden: 1,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
    };

    const result = handleScoreStructuralNpv(input);
    expect(result.recommendation).toBe("create");
    expect(result.net_structural_npv).toBeGreaterThan(0);
    expect(result.output_value_scores).toHaveLength(1);
    expect(result.output_value_scores[0].output_name).toBe("Quarterly Budget Report");
    expect(result.reasoning).toBeTruthy();
  });

  it('returns "demote" for node with negative NPV (< -2)', () => {
    const input: NpvInput = {
      node_proposal: { name: "Trivial Logger", purpose: "Log trivial events" },
      per_output_scores: [
        {
          output_name: "Log Entry",
          importance: 1,
          quality_gain: 0,
          speed_gain: 0,
          reliability_gain: 0,
          reuse_gain: 0,
          governance_gain: 0,
          productization_gain: 0,
        },
      ],
      cost_estimates: {
        complexity: 4,
        maintenance_burden: 3,
        coordination_overhead: 3,
        semantic_duplication: 2,
        ontology_sprawl: 2,
        consolidation_risk: 2,
      },
    };

    const result = handleScoreStructuralNpv(input);
    expect(result.recommendation).toBe("demote");
    expect(result.net_structural_npv).toBeLessThan(-2);
  });

  it('returns "defer" for marginal NPV (between -2 and 0)', () => {
    // Craft scores so NPV lands between -2 and 0
    // importance=2, gains all=1 => total per output = 2 * mean(1,1,1,1,1,1) = 2 * 1 = 2
    // costs: sum = 3 => NPV = 2 - 3 = -1
    const input: NpvInput = {
      node_proposal: { name: "Marginal Helper", purpose: "Marginal value" },
      per_output_scores: [
        {
          output_name: "Marginal Output",
          importance: 2,
          quality_gain: 1,
          speed_gain: 1,
          reliability_gain: 1,
          reuse_gain: 1,
          governance_gain: 1,
          productization_gain: 1,
        },
      ],
      cost_estimates: {
        complexity: 1,
        maintenance_burden: 1,
        coordination_overhead: 1,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
    };

    const result = handleScoreStructuralNpv(input);
    expect(result.recommendation).toBe("defer");
    expect(result.net_structural_npv).toBeGreaterThanOrEqual(-2);
    expect(result.net_structural_npv).toBeLessThan(0);
  });

  it("flags suspiciously uniform high scores as warning", () => {
    const input: NpvInput = {
      node_proposal: { name: "Suspiciously Perfect", purpose: "Too good to be true" },
      per_output_scores: [
        {
          output_name: "Perfect Output",
          importance: 5,
          quality_gain: 4,
          speed_gain: 4,
          reliability_gain: 4,
          reuse_gain: 4,
          governance_gain: 4,
          productization_gain: 4,
        },
      ],
      cost_estimates: {
        complexity: 0,
        maintenance_burden: 0,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
    };

    const result = handleScoreStructuralNpv(input);
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
    expect(result.warnings!.some((w) => w.toLowerCase().includes("uniform"))).toBe(true);
  });

  it("flags all-zero estimates as warning", () => {
    const input: NpvInput = {
      node_proposal: { name: "Zero Node", purpose: "No estimates" },
      per_output_scores: [
        {
          output_name: "Zero Output",
          importance: 0,
          quality_gain: 0,
          speed_gain: 0,
          reliability_gain: 0,
          reuse_gain: 0,
          governance_gain: 0,
          productization_gain: 0,
        },
      ],
      cost_estimates: {
        complexity: 0,
        maintenance_burden: 0,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
    };

    const result = handleScoreStructuralNpv(input);
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
    expect(result.warnings!.some((w) => w.toLowerCase().includes("zero"))).toBe(true);
  });

  it("handles multiple outputs — total_output_value is sum of per-output totals", () => {
    const input: NpvInput = {
      node_proposal: { name: "Multi-Output Agent", purpose: "Produces multiple outputs" },
      per_output_scores: [
        {
          output_name: "Report A",
          importance: 3,
          quality_gain: 2,
          speed_gain: 2,
          reliability_gain: 2,
          reuse_gain: 2,
          governance_gain: 2,
          productization_gain: 2,
        },
        {
          output_name: "Report B",
          importance: 4,
          quality_gain: 3,
          speed_gain: 3,
          reliability_gain: 3,
          reuse_gain: 3,
          governance_gain: 3,
          productization_gain: 3,
        },
      ],
      cost_estimates: {
        complexity: 1,
        maintenance_burden: 1,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
    };

    const result = handleScoreStructuralNpv(input);
    // Report A: 3 * mean(2,2,2,2,2,2) = 3 * 2 = 6
    // Report B: 4 * mean(3,3,3,3,3,3) = 4 * 3 = 12
    // total = 18
    expect(result.output_value_scores).toHaveLength(2);
    expect(result.total_output_value).toBe(
      result.output_value_scores[0].total + result.output_value_scores[1].total
    );
    expect(result.total_output_value).toBe(18);
    expect(result.total_structural_cost).toBe(2);
    expect(result.net_structural_npv).toBe(16);
    expect(result.recommendation).toBe("create");
  });
});
