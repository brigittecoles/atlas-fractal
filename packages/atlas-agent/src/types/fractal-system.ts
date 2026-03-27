import type { UniversalFractalNode, DecompositionDecision } from "./fractal-node.js";
import type { CompanyContext } from "./company-context.js";

// --- Demoted Concepts ---

export interface DemotedConcept {
  concept: string;
  parent_node_id: string;
  demoted_to: string;
  rationale: string;
  npv_score: number;
  gate_results: DecompositionDecision;
  can_override: boolean;
}

// --- Output Economics ---

export type OutputValueType =
  | "revenue_bearing"
  | "trust_bearing"
  | "mission_critical"
  | "reusable_upstream"
  | "governance_sensitive";

export interface OutputEconomicsEntry {
  output_id: string;
  name: string;
  owner_node_id: string;
  consumers: string[];
  value_type: OutputValueType;
  importance: number;
  quality_criteria: string[];
  risk_sensitivity: string;
  blast_radius: string;
}

// --- Consolidation Log ---

export interface ConsolidationEntry {
  source_node_ids: string[];
  action: string;
  target_node_id?: string;
  rationale: string;
  timestamp: string;
}

// --- Fractal Agent System ---

export interface FractalAgentSystem {
  schema_version: "6.0-fractal";
  company_context: CompanyContext;
  value_chain_areas: UniversalFractalNode[];
  demoted_concepts: DemotedConcept[];
  output_catalog: OutputEconomicsEntry[];
  consolidation_log: ConsolidationEntry[];
  target_platform: string;
}

// --- Translated Fractal System ---

export interface TranslatedFractalSystem extends FractalAgentSystem {
  target_platform: string;
  platform_constraints: string[];
  artifacts: string[];
}
