import { describe, it, expect } from "vitest";
import { handleCheckRuntimePromotion } from "../runtime-promotion.js";

describe("handleCheckRuntimePromotion", () => {
  it('returns "runtime" for any input', () => {
    const result = handleCheckRuntimePromotion({ node_id: "agent-001", node_name: "Budget Forecaster" });
    expect(result.tier).toBe("runtime");
    expect(result.rationale).toBeTruthy();
  });

  it('returns "runtime" even for minimal input', () => {
    const result = handleCheckRuntimePromotion({ node_id: "x", node_name: "y" });
    expect(result.tier).toBe("runtime");
  });
});
