import { describe, it, expect } from "vitest";
import { handleReviewOutputQuality } from "../quality-review.js";
import type { QualityReviewInput } from "../quality-review.js";

describe("handleReviewOutputQuality", () => {
  it("valid scores compute overall correctly", () => {
    const input: QualityReviewInput = {
      output_name: "Budget Report",
      scores: {
        purpose_alignment: 4,
        accuracy: 5,
        completeness: 4,
        relevance: 4,
        clarity: 5,
        depth: 3,
        tone_consistency: 4,
        bias_ethics: 5,
        aeo_geo_readiness: 3,
      },
    };

    const result = handleReviewOutputQuality(input);
    const expectedMean = (4 + 5 + 4 + 4 + 5 + 3 + 4 + 5 + 3) / 9;
    expect(result.overall_score).toBeCloseTo(expectedMean, 2);
    expect(result.passes_threshold).toBe(true);
    expect(result.scores).toEqual(input.scores);
  });

  it("passes threshold at >= 3.0", () => {
    const input: QualityReviewInput = {
      output_name: "Borderline Report",
      scores: {
        purpose_alignment: 3,
        accuracy: 3,
        completeness: 3,
        relevance: 3,
        clarity: 3,
        depth: 3,
        tone_consistency: 3,
        bias_ethics: 3,
        aeo_geo_readiness: 3,
      },
    };

    const result = handleReviewOutputQuality(input);
    expect(result.overall_score).toBe(3);
    expect(result.passes_threshold).toBe(true);
  });

  it("fails below 3.0", () => {
    const input: QualityReviewInput = {
      output_name: "Poor Report",
      scores: {
        purpose_alignment: 2,
        accuracy: 1,
        completeness: 2,
        relevance: 2,
        clarity: 2,
        depth: 1,
        tone_consistency: 2,
        bias_ethics: 2,
        aeo_geo_readiness: 1,
      },
    };

    const result = handleReviewOutputQuality(input);
    expect(result.overall_score).toBeLessThan(3);
    expect(result.passes_threshold).toBe(false);
  });

  it("recommends improvement for low dimensions", () => {
    const input: QualityReviewInput = {
      output_name: "Mixed Report",
      scores: {
        purpose_alignment: 5,
        accuracy: 5,
        completeness: 5,
        relevance: 5,
        clarity: 5,
        depth: 1,
        tone_consistency: 1,
        bias_ethics: 5,
        aeo_geo_readiness: 1,
      },
    };

    const result = handleReviewOutputQuality(input);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some((r) => r.toLowerCase().includes("depth"))).toBe(true);
    expect(result.recommendations.some((r) => r.toLowerCase().includes("tone_consistency"))).toBe(true);
    expect(result.recommendations.some((r) => r.toLowerCase().includes("aeo_geo_readiness"))).toBe(true);
  });
});
