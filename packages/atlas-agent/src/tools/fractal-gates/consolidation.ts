// Task 11: check_consolidation — cross-node overlap detection with Jaccard similarity

import type { UniversalFractalNode } from "../../types/index.js";

export interface OverlapCandidate {
  node_a_id: string;
  node_b_id: string;
  overlap_type: "near_synonym" | "sub_attribute" | "thin_distinction" | "semantic_duplicate";
  recommendation: "merge" | "demote_one" | "keep_both" | "retire";
  rationale: string;
}

export interface ConsolidationAction {
  action: string;
  source_node_ids: string[];
  target_node_id?: string;
  rationale: string;
}

export interface ConsolidationResult {
  overlap_candidates: OverlapCandidate[];
  consolidation_actions: ConsolidationAction[];
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function collectNodes(nodes: UniversalFractalNode[]): UniversalFractalNode[] {
  const result: UniversalFractalNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...collectNodes(node.children));
    }
  }
  return result;
}

function outputOverlapRatio(a: UniversalFractalNode, b: UniversalFractalNode): number {
  const namesA = new Set(a.io.outputs.map((o) => o.name.toLowerCase()));
  const namesB = new Set(b.io.outputs.map((o) => o.name.toLowerCase()));
  if (namesA.size === 0 && namesB.size === 0) return 0;
  const intersection = new Set([...namesA].filter((n) => namesB.has(n)));
  const union = new Set([...namesA, ...namesB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function handleCheckConsolidation(nodes: UniversalFractalNode[]): ConsolidationResult {
  const allNodes = collectNodes(nodes);
  const overlap_candidates: OverlapCandidate[] = [];
  const consolidation_actions: ConsolidationAction[] = [];

  // Group nodes by type (same type = same level for comparison)
  const byType = new Map<string, UniversalFractalNode[]>();
  for (const node of allNodes) {
    const type = node.identity.type;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(node);
  }

  for (const [, group] of byType) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        const textA = `${a.identity.name} ${a.purpose_context.purpose}`;
        const textB = `${b.identity.name} ${b.purpose_context.purpose}`;
        const nameSim = jaccardSimilarity(textA, textB);
        const outputOverlap = outputOverlapRatio(a, b);

        // Check output overlap first (higher specificity)
        if (outputOverlap > 0.5) {
          overlap_candidates.push({
            node_a_id: a.identity.id,
            node_b_id: b.identity.id,
            overlap_type: "semantic_duplicate",
            recommendation: "merge",
            rationale: `Output overlap ${(outputOverlap * 100).toFixed(0)}% between "${a.identity.name}" and "${b.identity.name}". These nodes produce largely the same outputs.`,
          });
          consolidation_actions.push({
            action: "merge",
            source_node_ids: [a.identity.id, b.identity.id],
            rationale: `Merge due to ${(outputOverlap * 100).toFixed(0)}% output overlap.`,
          });
        } else if (nameSim > 0.6) {
          overlap_candidates.push({
            node_a_id: a.identity.id,
            node_b_id: b.identity.id,
            overlap_type: "near_synonym",
            recommendation: "merge",
            rationale: `Name+purpose similarity ${(nameSim * 100).toFixed(0)}% between "${a.identity.name}" and "${b.identity.name}". These appear to be near-synonyms.`,
          });
          consolidation_actions.push({
            action: "merge",
            source_node_ids: [a.identity.id, b.identity.id],
            rationale: `Merge due to ${(nameSim * 100).toFixed(0)}% name+purpose similarity.`,
          });
        } else if (nameSim >= 0.4 && nameSim <= 0.6) {
          overlap_candidates.push({
            node_a_id: a.identity.id,
            node_b_id: b.identity.id,
            overlap_type: "thin_distinction",
            recommendation: "keep_both",
            rationale: `Moderate similarity ${(nameSim * 100).toFixed(0)}% between "${a.identity.name}" and "${b.identity.name}". The distinction may be thin but they serve different purposes.`,
          });
        }
      }
    }
  }

  return {
    overlap_candidates,
    consolidation_actions,
  };
}
