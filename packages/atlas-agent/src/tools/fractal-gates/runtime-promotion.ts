// Task 10a: check_runtime_promotion — v1 trivial: always promotes to runtime

export interface RuntimePromotionInput {
  node_id: string;
  node_name: string;
}

export interface RuntimePromotionResult {
  tier: "runtime";
  rationale: string;
}

export function handleCheckRuntimePromotion(_input: RuntimePromotionInput): RuntimePromotionResult {
  return {
    tier: "runtime",
    rationale: "v1: all nodes that pass NPV and decomposition gates are promoted to runtime.",
  };
}
