// Task 10d: review_output_quality — 9-dimension quality scoring with threshold

export interface QualityReviewInput {
  output_name: string;
  scores: {
    purpose_alignment: number;
    accuracy: number;
    completeness: number;
    relevance: number;
    clarity: number;
    depth: number;
    tone_consistency: number;
    bias_ethics: number;
    aeo_geo_readiness: number;
  };
}

export interface QualityReviewResult {
  scores: QualityReviewInput["scores"];
  overall_score: number;
  passes_threshold: boolean;
  recommendations: string[];
}

const DIMENSION_NAMES: (keyof QualityReviewInput["scores"])[] = [
  "purpose_alignment",
  "accuracy",
  "completeness",
  "relevance",
  "clarity",
  "depth",
  "tone_consistency",
  "bias_ethics",
  "aeo_geo_readiness",
];

const LOW_SCORE_THRESHOLD = 3;

export function handleReviewOutputQuality(input: QualityReviewInput): QualityReviewResult {
  const scoreValues = DIMENSION_NAMES.map((d) => input.scores[d]);
  const overall_score = scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length;
  const passes_threshold = overall_score >= 3.0;

  const recommendations: string[] = [];
  for (const dim of DIMENSION_NAMES) {
    if (input.scores[dim] < LOW_SCORE_THRESHOLD) {
      recommendations.push(
        `Improve ${dim} (score: ${input.scores[dim]}/${5}). Currently below threshold of ${LOW_SCORE_THRESHOLD}.`
      );
    }
  }

  return {
    scores: { ...input.scores },
    overall_score,
    passes_threshold,
    recommendations,
  };
}
