// Task 10b: score_output_economics — output catalog with portfolio value and risk flagging

import type { OutputValueType } from "../../types/index.js";

const VALID_VALUE_TYPES: OutputValueType[] = [
  "revenue_bearing",
  "trust_bearing",
  "mission_critical",
  "reusable_upstream",
  "governance_sensitive",
];

export interface OutputEconInput {
  outputs: {
    name: string;
    owner_node_id: string;
    consumers: string[];
    value_type: string;
    importance: number;
    quality_criteria: string[];
    risk_sensitivity: string;
    blast_radius: string;
  }[];
}

export interface OutputEconCatalogEntry {
  name: string;
  owner_node_id: string;
  consumers: string[];
  value_type: string;
  importance: number;
  quality_criteria: string[];
  risk_sensitivity: string;
  blast_radius: string;
  warnings?: string[];
}

export interface OutputEconResult {
  catalog_entries: OutputEconCatalogEntry[];
  total_portfolio_value: number;
  high_risk_outputs: string[];
}

export function handleScoreOutputEconomics(input: OutputEconInput): OutputEconResult {
  const catalog_entries: OutputEconCatalogEntry[] = [];
  let total_portfolio_value = 0;
  const high_risk_outputs: string[] = [];

  for (const o of input.outputs) {
    const entry: OutputEconCatalogEntry = {
      name: o.name,
      owner_node_id: o.owner_node_id,
      consumers: o.consumers,
      value_type: o.value_type,
      importance: o.importance,
      quality_criteria: o.quality_criteria,
      risk_sensitivity: o.risk_sensitivity,
      blast_radius: o.blast_radius,
    };

    // Validate value_type
    if (!VALID_VALUE_TYPES.includes(o.value_type as OutputValueType)) {
      entry.warnings = [
        `Invalid value_type "${o.value_type}". Allowed: ${VALID_VALUE_TYPES.join(", ")}.`,
      ];
    }

    // Flag high-risk outputs
    if (o.risk_sensitivity === "critical" || o.risk_sensitivity === "high") {
      high_risk_outputs.push(o.name);
    }

    total_portfolio_value += o.importance;
    catalog_entries.push(entry);
  }

  return {
    catalog_entries,
    total_portfolio_value,
    high_risk_outputs,
  };
}
