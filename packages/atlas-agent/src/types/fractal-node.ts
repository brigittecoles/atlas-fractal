// Universal Fractal Node — sections A-K
// Every node at every level uses the same schema.

// --- Section A: Identity ---

export type NodeType = "value_chain_area" | "pod" | "agent" | "sub_agent";

export interface NodeIdentity {
  name: string;
  id: string;
  type: NodeType;
  parent_context: string;
  candidate_child_concepts: string[];
  stopping_condition: string;
}

// --- Section B: Purpose & Context ---

export interface NodePurpose {
  purpose: string;
  domain: string;
  subdomain: string;
  surfaces: string[];
  primary_users: string[];
  primary_route: string;
  mad_lib: string;
}

// --- Section C: Inputs / Outputs ---

export interface OutputSpec {
  output_id: string;
  name: string;
  description: string;
  value_type?: string;
}

export interface NodeIO {
  inputs: string[];
  outputs: OutputSpec[];
  why_outputs_matter: string;
  downstream_consumers: string[];
  blast_radius: string;
}

// --- Section D: Output Value Thesis ---

export interface OutputValueThesis {
  quality: string;
  speed: string;
  reliability: string;
  reuse: string;
  governance: string;
  productization: string;
}

// --- Section E: Runtime Shape ---

export interface RuntimeShape {
  object_types: string[];
  resolvers: string[];
  states: string[];
  triggers: string[];
  actions: string[];
  output_destinations: string[];
  runtime_tier: "runtime";
}

// --- Section F: Tools, Memory, Policies ---

export interface NormalizedToolSpec {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
  }[];
  returns: string;
}

export interface NormalizedSkill {
  name: string;
  description: string;
  capabilities: string[];
}

export interface McpServerSpec {
  name: string;
  transport: string;
  url_or_command: string;
  tools_provided: string[];
}

export interface DataSourceSpec {
  name: string;
  type: string;
  connection_info: string;
  access_pattern: string;
}

export interface MemoryLayerConfig {
  description: string;
  storage_type: string;
  retention_policy: string;
}

export interface MemoryConfig {
  working: MemoryLayerConfig;
  episodic: MemoryLayerConfig;
  semantic: MemoryLayerConfig;
  procedural: MemoryLayerConfig;
}

export interface NodeToolsMemoryPolicies {
  tools: NormalizedToolSpec[];
  memory: MemoryConfig;
  skills: NormalizedSkill[];
  mcp_servers: McpServerSpec[];
  data_sources: DataSourceSpec[];
  policies: string[];
  handoffs: string[];
  owner: string;
  lifecycle_status: string;
}

// --- Section G: Structural NPV ---

export interface OutputValueScore {
  output_id: string;
  output_name: string;
  importance: number; // 1-5
  quality_gain: number; // 0-5
  speed_gain: number; // 0-5
  reliability_gain: number; // 0-5
  reuse_gain: number; // 0-5
  governance_gain: number; // 0-5
  productization_gain: number; // 0-5
  total: number;
}

export interface CostScores {
  complexity: number; // 0-5
  maintenance_burden: number; // 0-5
  coordination_overhead: number; // 0-5
  semantic_duplication: number; // 0-5
  ontology_sprawl: number; // 0-5
  consolidation_risk: number; // 0-5
}

export type StructuralRecommendation = "create" | "demote" | "defer";

export interface StructuralNPV {
  output_value_scores: OutputValueScore[];
  total_output_value: number;
  cost_scores: CostScores;
  total_structural_cost: number;
  net_structural_npv: number;
  recommendation: StructuralRecommendation;
}

// --- Section H: Decomposition Gate ---

export type DecompositionForm = "instance" | "field" | "matrix" | "example" | "policy";

export interface DecompositionDecision {
  concept: string;
  distinct_runtime_behavior: boolean;
  distinct_outputs: boolean;
  distinct_reuse: boolean;
  best_form: DecompositionForm;
  rationale: string;
  action: string;
}

export interface DecompositionGate {
  proposed_children: DecompositionDecision[];
}

// --- Section I: Ontology Linkage (stub) ---

export interface OntologyLinkage {
  canonical_name?: string;
  aliases?: string[];
  parent_concept?: string;
  related_concepts?: string[];
  domain_tags?: string[];
  definition?: string;
}

// --- Section J: Atomic Capability Linkage (stub) ---

export interface AtomicCapabilityLinkage {
  capability_id?: string;
  capability_name?: string;
  capability_description?: string;
  required_tools?: string[];
  required_skills?: string[];
}

// --- Section K: AEO/GEO Linkage (stub) ---

export interface AeoGeoLinkage {
  aeo_node_id?: string;
  aeo_node_name?: string;
  geo_region?: string;
  geo_constraints?: string[];
  regulatory_context?: string;
}

// --- Universal Fractal Node (all sections combined) ---

export interface UniversalFractalNode {
  identity: NodeIdentity;
  purpose_context: NodePurpose;
  io: NodeIO;
  output_value_thesis: OutputValueThesis;
  runtime_shape: RuntimeShape;
  tools_memory_policies: NodeToolsMemoryPolicies;
  structural_npv: StructuralNPV;
  decomposition_gate: DecompositionGate;
  ontology_linkage: OntologyLinkage;
  capability_linkage: AtomicCapabilityLinkage;
  aeo_geo_linkage: AeoGeoLinkage;
  children: UniversalFractalNode[];
}
