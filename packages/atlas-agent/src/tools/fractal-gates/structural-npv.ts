// Task 8: score_structural_npv — fractal gate tool for node value scoring

export interface NpvInput {
  node_proposal: { name: string; purpose: string; parent_node_id?: string };
  per_output_scores: {
    output_name: string;
    importance: number; // 1-5
    quality_gain: number; // 0-5
    speed_gain: number; // 0-5
    reliability_gain: number; // 0-5
    reuse_gain: number; // 0-5
    governance_gain: number; // 0-5
    productization_gain: number; // 0-5
  }[];
  cost_estimates: {
    complexity: number; // 0-5
    maintenance_burden: number;
    coordination_overhead: number;
    semantic_duplication: number;
    ontology_sprawl: number;
    consolidation_risk: number;
  };
}

export interface NpvResult {
  output_value_scores: {
    output_name: string;
    importance: number;
    quality_gain: number;
    speed_gain: number;
    reliability_gain: number;
    reuse_gain: number;
    governance_gain: number;
    productization_gain: number;
    total: number;
  }[];
  total_output_value: number;
  total_structural_cost: number;
  net_structural_npv: number;
  recommendation: "create" | "demote" | "defer";
  reasoning: string;
  warnings?: string[];
}

export function handleScoreStructuralNpv(input: NpvInput): NpvResult {
  const warnings: string[] = [];

  // Compute per-output scores
  const output_value_scores = input.per_output_scores.map((o) => {
    const gains = [
      o.quality_gain,
      o.speed_gain,
      o.reliability_gain,
      o.reuse_gain,
      o.governance_gain,
      o.productization_gain,
    ];
    const meanGain = gains.reduce((sum, g) => sum + g, 0) / gains.length;
    const total = o.importance * meanGain;

    return {
      output_name: o.output_name,
      importance: o.importance,
      quality_gain: o.quality_gain,
      speed_gain: o.speed_gain,
      reliability_gain: o.reliability_gain,
      reuse_gain: o.reuse_gain,
      governance_gain: o.governance_gain,
      productization_gain: o.productization_gain,
      total,
    };
  });

  const total_output_value = output_value_scores.reduce((sum, o) => sum + o.total, 0);

  // Compute total structural cost
  const c = input.cost_estimates;
  const total_structural_cost =
    c.complexity +
    c.maintenance_burden +
    c.coordination_overhead +
    c.semantic_duplication +
    c.ontology_sprawl +
    c.consolidation_risk;

  const net_structural_npv = total_output_value - total_structural_cost;

  // Check for suspiciously uniform high scores
  for (const o of input.per_output_scores) {
    const allGainsHigh =
      o.quality_gain >= 4 &&
      o.speed_gain >= 4 &&
      o.reliability_gain >= 4 &&
      o.reuse_gain >= 4 &&
      o.governance_gain >= 4 &&
      o.productization_gain >= 4;
    if (allGainsHigh && o.importance >= 4) {
      warnings.push(
        `Suspiciously uniform high scores for "${o.output_name}": all gains >= 4 and importance >= 4. Review for bias.`
      );
    }
  }

  // Check for all-zero estimates
  const allOutputsZero = input.per_output_scores.every(
    (o) =>
      o.importance === 0 &&
      o.quality_gain === 0 &&
      o.speed_gain === 0 &&
      o.reliability_gain === 0 &&
      o.reuse_gain === 0 &&
      o.governance_gain === 0 &&
      o.productization_gain === 0
  );
  const allCostsZero =
    c.complexity === 0 &&
    c.maintenance_burden === 0 &&
    c.coordination_overhead === 0 &&
    c.semantic_duplication === 0 &&
    c.ontology_sprawl === 0 &&
    c.consolidation_risk === 0;
  if (allOutputsZero && allCostsZero) {
    warnings.push("All zero estimates: both output scores and cost scores are zero. Scores may not have been filled in.");
  }

  // Recommendation
  let recommendation: "create" | "demote" | "defer";
  if (net_structural_npv > 0) {
    recommendation = "create";
  } else if (net_structural_npv < -2) {
    recommendation = "demote";
  } else {
    recommendation = "defer";
  }

  const reasoning = `Node "${input.node_proposal.name}" has total output value ${total_output_value.toFixed(2)} and structural cost ${total_structural_cost.toFixed(2)}, yielding net NPV ${net_structural_npv.toFixed(2)}. Recommendation: ${recommendation}.`;

  return {
    output_value_scores,
    total_output_value,
    total_structural_cost,
    net_structural_npv,
    recommendation,
    reasoning,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
