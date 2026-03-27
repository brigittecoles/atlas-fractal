import { describe, it, expect } from "vitest";
import { handleDecompositionGate } from "../decomposition-gate.js";
import type { DecompGateInput } from "../decomposition-gate.js";

describe("handleDecompositionGate", () => {
  it('returns "instance" + "create_child_node" when all three criteria true', () => {
    const input: DecompGateInput = {
      proposed_concept: "Budget Forecaster",
      has_distinct_runtime_behavior: true,
      has_distinct_outputs: true,
      has_distinct_reuse: true,
    };

    const result = handleDecompositionGate(input);
    expect(result.best_form).toBe("instance");
    expect(result.action).toBe("create_child_node");
    expect(result.rationale).toBeTruthy();
  });

  it('returns "instance" when distinct runtime + outputs but not reuse', () => {
    const input: DecompGateInput = {
      proposed_concept: "Risk Analyzer",
      has_distinct_runtime_behavior: true,
      has_distinct_outputs: true,
      has_distinct_reuse: false,
    };

    const result = handleDecompositionGate(input);
    expect(result.best_form).toBe("instance");
    expect(result.action).toBe("create_child_node");
  });

  it('returns "field" + "add_as_field" when none are true', () => {
    const input: DecompGateInput = {
      proposed_concept: "Simple Attribute",
      has_distinct_runtime_behavior: false,
      has_distinct_outputs: false,
      has_distinct_reuse: false,
    };

    const result = handleDecompositionGate(input);
    expect(result.best_form).toBe("field");
    expect(result.action).toBe("add_as_field");
  });

  it('returns "matrix" + "add_as_matrix_entry" when only distinct_outputs is true', () => {
    const input: DecompGateInput = {
      proposed_concept: "Output Variant",
      has_distinct_runtime_behavior: false,
      has_distinct_outputs: true,
      has_distinct_reuse: false,
    };

    const result = handleDecompositionGate(input);
    expect(result.best_form).toBe("matrix");
    expect(result.action).toBe("add_as_matrix_entry");
  });

  it('returns "policy" + "add_as_policy_note" when only distinct_reuse is true', () => {
    const input: DecompGateInput = {
      proposed_concept: "Reuse Pattern",
      has_distinct_runtime_behavior: false,
      has_distinct_outputs: false,
      has_distinct_reuse: true,
    };

    const result = handleDecompositionGate(input);
    expect(result.best_form).toBe("policy");
    expect(result.action).toBe("add_as_policy_note");
  });

  it('returns "example" + "add_as_example" when name suggests illustration', () => {
    const names = ["example usage", "demo workflow", "sample report", "illustration of process"];
    for (const name of names) {
      const input: DecompGateInput = {
        proposed_concept: name,
        has_distinct_runtime_behavior: false,
        has_distinct_outputs: false,
        has_distinct_reuse: false,
      };

      const result = handleDecompositionGate(input);
      expect(result.best_form).toBe("example");
      expect(result.action).toBe("add_as_example");
    }
  });
});
