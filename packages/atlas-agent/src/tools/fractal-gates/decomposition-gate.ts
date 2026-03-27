// Task 9: run_decomposition_gate — classifies distinctions into instance/field/matrix/example/policy

export interface DecompGateInput {
  proposed_concept: string;
  has_distinct_runtime_behavior: boolean;
  has_distinct_outputs: boolean;
  has_distinct_reuse: boolean;
}

export interface DecompGateResult {
  best_form: "instance" | "field" | "matrix" | "example" | "policy";
  rationale: string;
  action: "create_child_node" | "add_as_field" | "add_as_matrix_entry" | "add_as_example" | "add_as_policy_note";
}

const EXAMPLE_KEYWORDS = ["example", "demo", "sample", "illustration"];

export function handleDecompositionGate(input: DecompGateInput): DecompGateResult {
  const conceptLower = input.proposed_concept.toLowerCase();

  // Check for example/demo/sample/illustration names first (before "field" fallthrough)
  if (
    !input.has_distinct_runtime_behavior &&
    !input.has_distinct_outputs &&
    !input.has_distinct_reuse &&
    EXAMPLE_KEYWORDS.some((kw) => conceptLower.includes(kw))
  ) {
    return {
      best_form: "example",
      rationale: `"${input.proposed_concept}" appears to be an illustrative example rather than a distinct concept.`,
      action: "add_as_example",
    };
  }

  // distinct_runtime OR (distinct_outputs AND distinct_reuse) → instance
  if (input.has_distinct_runtime_behavior || (input.has_distinct_outputs && input.has_distinct_reuse)) {
    return {
      best_form: "instance",
      rationale: `"${input.proposed_concept}" has distinct runtime behavior or distinct outputs with distinct reuse, warranting a child node.`,
      action: "create_child_node",
    };
  }

  // Only distinct_outputs → matrix
  if (input.has_distinct_outputs && !input.has_distinct_reuse) {
    return {
      best_form: "matrix",
      rationale: `"${input.proposed_concept}" has distinct outputs but shares runtime and reuse patterns. Best represented as a matrix entry.`,
      action: "add_as_matrix_entry",
    };
  }

  // Only distinct_reuse → policy
  if (input.has_distinct_reuse && !input.has_distinct_outputs) {
    return {
      best_form: "policy",
      rationale: `"${input.proposed_concept}" has distinct reuse patterns but shares outputs and runtime. Best captured as a policy note.`,
      action: "add_as_policy_note",
    };
  }

  // None → field
  return {
    best_form: "field",
    rationale: `"${input.proposed_concept}" does not have distinct runtime, outputs, or reuse. It should be a field on the parent node.`,
    action: "add_as_field",
  };
}
