# ATLAS-Fractal — AI-Native Agent Configuration Engine with Structural NPV

## Overview

ATLAS-Fractal is a Claude Agent SDK agent exposed via MCP server that designs **structurally justified** fractal AI agent systems for enterprise clients. Given a company's documents, industry, and strategic context, ATLAS-Fractal recommends which business processes to automate and produces fully configured autonomous agents — but only when each agent **earns its existence** through positive Structural NPV.

Unlike ATLAS v6 (which designs agents for selected APQC processes), ATLAS-Fractal applies the Universal Fractal Engineering framework to score, gate, and justify every node. No agent, POD, or sub-agent is created without passing the Decomposition Gate and showing positive Structural NPV.

ATLAS-Fractal is accessible from any surface — a web wizard, Claude Desktop, CLI, or another agent — via its MCP server interface.

**Source framework:** Universal Fractal Engineering Build Package v2 + Universal Fractal Instance Workbook v2.

## Architecture

```
Any Surface (wizard UI, Claude Desktop, CLI, other agent)
       |  MCP protocol (stdio or HTTP/SSE transport)
+-------------------------------------------------------+
|                  ATLAS-Fractal Agent                    |
|            (Claude Agent SDK - TypeScript)              |
|                                                         |
|  Persistent session with accumulated client context     |
|                                                         |
|  Tools:                                                 |
|  +---------------+ +---------------+ +---------------+  |
|  | Document      | | APQC          | | Fractal Gates |  |
|  | Ingestion     | | Framework     | | (7 tools)     |  |
|  | (PDF, Excel,  | | (processes,   | | NPV, Decomp,  |  |
|  |  Word)        | |  work prods)  | | Promotion,    |  |
|  +---------------+ +---------------+ | Economics,    |  |
|  +---------------+ +---------------+ | Validation,   |  |
|  | Agent Design  | | Export Engine  | | Quality,      |  |
|  | (fractal-     | | (platform     | | Consolidation |  |
|  |  aware)       | |  translators) | +---------------+  |
|  +---------------+ +---------------+                    |
|                                                         |
|  Exposed as MCP Server:                                 |
|  - stdio transport (Claude Desktop, CLI)                |
|  - HTTP/SSE transport (wizard UI, remote clients)       |
+---------------------------------------------------------+
```

## Core Doctrine (from Universal Fractal Engineering)

1. **Everything is fractal in possibility** — Any meaningful unit can be described with the same universal grammar (the Universal Node Schema).
2. **Not everything should become a node** — Use the fewest nodes needed to preserve nuance, reuse, and runtime clarity.
3. **Outputs/products are the value unit** — Node justification is tied to measurable improvement in output quality, speed, reliability, reuse, governance, or productization.
4. **Runtime is earned, not assumed** — A node can exist in the ontology without being promoted to runtime. (v1: all passing nodes are runtime.)
5. **Stop at semantic saturation** — If proposed children are near-synonyms, sub-attributes, examples, or micro-distinctions, consolidate instead of recursing.

The core decision mechanism is **Structural NPV**:

```
Structural NPV(node) = PV(output quality gain + speed gain + reliability gain
                         + reuse gain + governance gain + productization gain)
                       - PV(complexity + maintenance burden + coordination overhead
                         + semantic duplication + ontology sprawl + consolidation risk)
```

Create a node only when NPV is positive or strategic option value is exceptionally high.

## Workbook Sheet Coverage

| Sheet | Status | Maps To |
|-------|--------|---------|
| 00_README | Reference | Core doctrine in system prompt |
| 01_Univ_Blank | Implemented | Sections A-F of UniversalFractalNode (Claude fills freeform during design) |
| 02_Univ_Matrix | Implemented | Section G.output_value_scores (structured scoring) |
| 03_Child_Index | Implemented | Section H.proposed_children + DemotedConcept[] |
| 04_Runtime_Map | Implemented | Section E.runtime_tier + translators |
| 05_Structural_NPV | Implemented | `score_structural_npv` tool + Section G |
| 06_Decomp_Gate | Implemented | `run_decomposition_gate` tool + Section H |
| 07_Output_Economics | Implemented | `score_output_economics` tool + OutputEconomicsEntry |
| 08_Runtime_Promotion | Implemented | `check_runtime_promotion` tool (v1: always runtime) |
| 09_Validation | Implemented | `validate_node` tool |
| 10_Governance | Partial | Section F.owner, F.lifecycle_status, F.policies. Full governance workflow deferred. |
| 11_Consolidation | Implemented | `check_consolidation` tool |
| 12_Quality_Review | Implemented | `review_output_quality` tool |
| 13_Example_Node | Reference only | Used for testing/documentation, not runtime |
| 14_Example_NPV | Reference only | Used for testing/documentation |
| 15_Instance_Starter | Reference only | Template for manual use, not needed in agent |
| 16_Ontology_Linkage | Stub | Section I typed fields, not actively populated |
| 17_Atomic_Cap_Linkage | Stub | Section J typed fields, not actively populated |
| 18_AEO_GEO_Linkage | Stub | Section K typed fields, not actively populated |

Sections A-D (Identity, Purpose, Inputs/Outputs, Output Value Thesis) do not have dedicated tools — Claude fills these freeform during design based on the client context and APQC data. The fractal gate tools (NPV, decomposition, etc.) score and validate what Claude produces.

## Core Data Model: The Universal Fractal Node

Every node in the system — Value Chain Area, POD, Agent, Sub-Agent — uses the **same schema**. That's the fractal principle.

### UniversalFractalNode (sections A-K)

```
UniversalFractalNode
  +-- A. Identity
  |     +-- name: string
  |     +-- id: string
  |     +-- type: string (e.g., "value_chain_area", "pod", "agent", "sub_agent")
  |     +-- parent_context: string
  |     +-- candidate_child_concepts: string[]
  |     +-- stopping_condition: string
  |
  +-- B. Purpose & Context
  |     +-- purpose: string
  |     +-- domain: string
  |     +-- subdomain: string
  |     +-- surfaces: string[]
  |     +-- primary_users: string[]
  |     +-- primary_route: string
  |     +-- mad_lib: string
  |
  +-- C. Inputs & Outputs/Products
  |     +-- inputs: string[]
  |     +-- outputs: OutputSpec[]
  |     +-- why_outputs_matter: string
  |     +-- downstream_consumers: string[]
  |     +-- blast_radius: string
  |
  +-- D. Output Value Thesis
  |     +-- quality_improvement: string
  |     +-- speed_improvement: string
  |     +-- reliability_improvement: string
  |     +-- reuse_improvement: string
  |     +-- governance_improvement: string
  |     +-- productization_improvement: string
  |
  +-- E. Runtime Shape
  |     +-- object_types: string[]
  |     +-- resolvers: string[]
  |     +-- states: string[]
  |     +-- triggers: string[]
  |     +-- actions: string[]
  |     +-- output_destinations: string[]
  |     +-- runtime_tier: "runtime"
  |           (future: "ontology_only" | "design_time" | "runtime")
  |
  +-- F. Tools / Memory / Policies
  |     +-- tools: NormalizedToolSpec[]
  |     +-- memory: MemoryConfig
  |     |     +-- working: { description, storage_type, retention_policy }
  |     |     +-- episodic: { description, storage_type, retention_policy }
  |     |     +-- semantic: { description, storage_type, retention_policy }
  |     |     +-- procedural: { description, storage_type, retention_policy }
  |     +-- skills: NormalizedSkill[]
  |     +-- mcp_servers: McpServerSpec[]
  |     +-- data_sources: DataSourceSpec[]
  |     +-- policies: string[]
  |     +-- handoffs: string[]
  |     +-- owner: string
  |     +-- lifecycle_status: "draft" | "active" | "deprecated" | "retired"
  |
  +-- G. Structural NPV
  |     +-- output_value_scores: OutputValueScore[]
  |     |     (each: output_id, importance 1-5, quality_gain, speed_gain,
  |     |      reliability_gain, reuse_gain, governance_gain, productization_gain, total)
  |     +-- total_output_value: number
  |     +-- cost_scores: CostScores
  |     |     (complexity, maintenance, coordination, semantic_duplication,
  |     |      ontology_sprawl, consolidation_risk — each 0-5)
  |     +-- total_structural_cost: number
  |     +-- net_structural_npv: number
  |     +-- recommendation: "create" | "demote" | "defer"
  |
  +-- H. Decomposition Gate
  |     +-- proposed_children: DecompositionDecision[]
  |     |     (each: concept, distinct_runtime_behavior: bool,
  |     |      distinct_outputs: bool, distinct_reuse: bool,
  |     |      best_form: "instance"|"field"|"matrix"|"example"|"policy",
  |     |      rationale: string, action: string)
  |
  +-- I. Ontology Linkage (stub — typed fields, not actively populated in v1)
  |     +-- ontology_class?: string
  |     +-- parent_classes?: string[]
  |     +-- relationships?: string[]
  |     +-- output_class?: string
  |     +-- dependencies?: string[]
  |
  +-- J. Atomic Capability Linkage (stub)
  |     +-- capability_ids?: string[]
  |     +-- action_object_pairs?: string[]
  |     +-- context_modifiers?: string[]
  |     +-- outcomes?: string[]
  |     +-- audience?: string[]
  |
  +-- K. AEO/GEO Output Linkage (stub)
        +-- answer_object_type?: string
        +-- intent_coverage?: string
        +-- semantic_completeness?: string
        +-- retrieval_structure?: string
        +-- visibility_potential?: string
```

### FractalAgentSystem (the full output)

```
FractalAgentSystem
  +-- schema_version: "6.0-fractal"
  +-- company_context: CompanyContext
  +-- value_chain_areas: UniversalFractalNode[]
  |     +-- pods: UniversalFractalNode[]
  |           +-- agents: UniversalFractalNode[]
  |                 +-- sub_agents: UniversalFractalNode[]
  +-- demoted_concepts: DemotedConcept[]
  |     (concept, parent_node_id, demoted_to, rationale, npv_score)
  +-- output_catalog: OutputEconomicsEntry[]
  |     (output_id, name, owner, consumers, value_type, importance,
  |      quality_criteria, risk_sensitivity, blast_radius)
  +-- consolidation_log: ConsolidationEntry[]
  |     (source_nodes, action, target_node, rationale, timestamp)
  +-- target_platform: null | string
```

### CompanyContext (same as v6)

```
CompanyContext
  +-- profile: CompanyProfile
  |     (name, gics codes, revenue, employees, ownership, strategic_context)
  +-- documents: ExtractedDocument[]
  +-- public_data: unknown[] (deferred to post-v1)
```

### DemotedConcept

```
DemotedConcept
  +-- concept: string
  +-- parent_node_id: string
  +-- demoted_to: "field" | "matrix" | "example" | "policy"
  +-- rationale: string
  +-- npv_score: number (the negative NPV that caused demotion)
  +-- gate_results: { decomposition_form, runtime_promotion_tier }
  +-- can_override: boolean (human can force-promote)
```

### OutputEconomicsEntry (from workbook sheet 07)

```
OutputEconomicsEntry
  +-- output_id: string
  +-- name: string
  +-- owner_node_id: string
  +-- consumers: string[]
  +-- value_type: "revenue_bearing" | "trust_bearing" | "mission_critical"
  |              | "reusable_upstream" | "governance_sensitive"
  +-- importance: number (1-5)
  +-- quality_criteria: string[]
  +-- risk_sensitivity: "low" | "medium" | "high" | "critical"
  +-- blast_radius: string
```

### Supporting Types

```
OutputSpec (used in section C)
  +-- output_id: string
  +-- name: string
  +-- description: string
  +-- value_type?: "revenue_bearing" | "trust_bearing" | "mission_critical"
                 | "reusable_upstream" | "governance_sensitive"

NormalizedToolSpec (used in section F)
  +-- name: string
  +-- description: string
  +-- parameters: { name: string, type: string, required: boolean }[]
  +-- returns: string

NormalizedSkill (used in section F)
  +-- name: string
  +-- description: string
  +-- capabilities: string[]

McpServerSpec (used in section F)
  +-- name: string
  +-- transport: "stdio" | "http"
  +-- url_or_command: string
  +-- tools_provided: string[]

DataSourceSpec (used in section F)
  +-- name: string
  +-- type: "database" | "api" | "file" | "stream"
  +-- connection_info: string
  +-- access_pattern: "read" | "write" | "read_write"

MemoryConfig (used in section F)
  +-- working: { description: string, storage_type: string, retention_policy: string }
  +-- episodic: { description: string, storage_type: string, retention_policy: string }
  +-- semantic: { description: string, storage_type: string, retention_policy: string }
  +-- procedural: { description: string, storage_type: string, retention_policy: string }

SelectedProcess (used in Session)
  +-- process_id: string
  +-- process_name: string
  +-- l1_id: string
  +-- l1_name: string
  +-- porter_activity: string
  +-- client_justification: string
  +-- ebitda_score: number

TranslatedFractalSystem
  +-- extends FractalAgentSystem
  +-- target_platform: string
  +-- platform_constraints: string[]
  +-- artifacts: { filename: string, content: string, category: string, description: string }[]

SessionEvent
  +-- timestamp: string
  +-- type: "tool_call" | "human_edit" | "status_change" | "gate_override"
  +-- tool_name?: string
  +-- node_id?: string
  +-- summary: string

ConsolidationEntry
  +-- source_node_ids: string[]
  +-- action: "merge" | "demote" | "retire" | "keep"
  +-- target_node_id?: string
  +-- rationale: string
  +-- timestamp: string
```

## Fractal Gate Tools

These are the decision engine. ATLAS (Claude) proposes nodes, then calls these tools to score and gate them. Each tool maps to a workbook layer.

### score_structural_npv (sheet 05)

```
Input:
  session_id: string
  node_proposal: {
    name: string
    purpose: string
    parent_node_id?: string
  }
  per_output_scores: {
    output_name: string
    importance: number (1-5)
    quality_gain: number (0-5)
    speed_gain: number (0-5)
    reliability_gain: number (0-5)
    reuse_gain: number (0-5)
    governance_gain: number (0-5)
    productization_gain: number (0-5)
  }[]
  cost_estimates: {
    complexity: number (0-5)
    maintenance_burden: number (0-5)
    coordination_overhead: number (0-5)
    semantic_duplication: number (0-5)
    ontology_sprawl: number (0-5)
    consolidation_risk: number (0-5)
  }

Output:
  output_value_scores: OutputValueScore[]
    (each: output_name, importance, quality_gain, speed_gain, reliability_gain,
     reuse_gain, governance_gain, productization_gain, total)
  total_output_value: number
  total_structural_cost: number
  net_structural_npv: number
  recommendation: "create" | "demote" | "defer"
  reasoning: string
```

**NPV calculation:** For each output, `total = importance * mean(gains)`. `total_output_value = sum(output totals)`. `total_structural_cost = sum(cost scores)`. `net_structural_npv = total_output_value - total_structural_cost`. Recommendation: "create" if NPV > 0, "demote" if NPV < -2, "defer" otherwise. The tool also flags suspiciously uniform scores (all 4s/5s) as a warning.

ATLAS (Claude) provides the per-output value estimates and cost estimates. The tool computes the weighted NPV per output and aggregate, and returns a structured recommendation. Claude can override with justification logged in session history.

### run_decomposition_gate (sheet 06)

```
Input:
  session_id: string
  parent_node_id: string
  proposed_concept: string
  has_distinct_runtime_behavior: boolean
  has_distinct_outputs: boolean
  has_distinct_reuse: boolean

Output:
  best_form: "instance" | "field" | "matrix" | "example" | "policy"
  rationale: string
  action: "create_child_node" | "add_as_field" | "add_as_matrix_entry"
         | "add_as_example" | "add_as_policy_note"
```

### check_runtime_promotion (sheet 08)

```
Input:
  session_id: string
  node_id: string

Output:
  tier: "runtime"
  rationale: string
  (v1: always returns "runtime" for nodes that passed NPV + decomposition)
  (future: "ontology_only" | "design_time" | "runtime")
```

### score_output_economics (sheet 07)

```
Input:
  session_id: string
  outputs: {
    name: string
    owner_node_id: string
    consumers: string[]
    value_type: string
    importance: number
    quality_criteria: string[]
    risk_sensitivity: string
    blast_radius: string
  }[]

Output:
  catalog_entries: OutputEconomicsEntry[]
  total_portfolio_value: number
  high_risk_outputs: string[]
```

### validate_node (sheet 09)

```
Input:
  session_id: string
  node_id: string

Output:
  tests: {
    hypothesis: string
    expected_improvement: string
    metric: string
    threshold: string
    validation_method: string
    pass: boolean
  }[]
  overall_valid: boolean
  issues: string[]
```

### review_output_quality (sheet 12)

```
Input:
  session_id: string
  node_id: string
  output_id: string

Output:
  scores: {
    purpose_alignment: number (1-5)
    accuracy: number (1-5)
    completeness: number (1-5)
    relevance: number (1-5)
    clarity: number (1-5)
    depth: number (1-5)
    tone_consistency: number (1-5)
    bias_ethics: number (1-5)
    aeo_geo_readiness: number (1-5)
  }
  overall_score: number
  passes_threshold: boolean
  recommendations: string[]
```

### check_consolidation (sheet 11)

```
Input:
  session_id: string

Output:
  overlap_candidates: {
    node_a_id: string
    node_b_id: string
    overlap_type: "near_synonym" | "sub_attribute" | "thin_distinction" | "semantic_duplicate"
    recommendation: "merge" | "demote_one" | "keep_both" | "retire"
    rationale: string
  }[]
  consolidation_actions: {
    action: string
    source_node_ids: string[]
    target_node_id?: string
    rationale: string
  }[]
```

## Non-Fractal Tools (shared with v6)

### Document Ingestion
- `ingest_document` — Parse PDF, Excel, Word, CSV, TXT into structured data
- `summarize_document` — Generate focused summary of an ingested document
- `enrich_company_profile` — Assemble CompanyContext from all ingested documents

### APQC Framework

**`search_processes`** — same I/O as v6 (see v6 spec)

**`get_process_detail`** — same I/O as v6

**`map_to_value_chain`**
```
Input:
  session_id: string
  process_ids?: string[]

Output:
  porter_activities: { name: string, type: "primary"|"support", description: string }[]
  apqc_l1_categories: { id: string, name: string }[]
  reference_mappings: { l1_id: string, typical_porter_activities: string[] }[]
```
Returns frameworks for Claude to reason with. Does NOT hardcode mappings.

### Agent Design (fractal-aware)

**Node storage model:** Nodes are built incrementally during design. Each `store_fractal_node` call persists a single node to the session's in-progress `fractal_system`. Claude builds nodes one at a time (after each passes gates), and tools like `validate_node` and `check_runtime_promotion` can look up any stored node by ID. `store_fractal_system` finalizes the system and advances session status to "design".

**`design_fractal_system`**
```
Input:
  session_id: string

Output:
  company_summary: { name, industry, revenue, employees, strategic_context }
  selected_processes: { id, name, l1_name, work_products, tech_stacks, ebitda }[]
  porter_mapping: { area: string, processes: string[] }[]
  fractal_doctrine: string (the 5 core laws + NPV formula + gate rules)
  design_guidelines: string (minimum viable agents, stop at semantic saturation)
```

**`design_fractal_pod`**
```
Input:
  session_id: string
  value_chain_area: string
  process_ids: string[]
  constraints?: { max_agents?: number, autonomy_preference?: string }

Output:
  area_context: { name, type, processes with full APQC detail }
  existing_nodes: UniversalFractalNode[] (already stored in this area)
  fractal_doctrine: string
```

**`design_fractal_agent`**
```
Input:
  session_id: string
  pod_id: string
  required_outputs: string[]
  constraints?: { tools?: string[], autonomy_level?: string }

Output:
  pod_context: { name, processes, existing_agents }
  output_requirements: { name, consumers, quality_criteria }[]
  fractal_doctrine: string
```

**`store_fractal_node`**
```
Input:
  session_id: string
  node: UniversalFractalNode
  parent_node_id?: string (null for top-level value chain areas)

Output:
  stored_node_id: string
  system_node_count: number
```
Persists a single node to the session's in-progress fractal system. Sets `parent_context` on the node. Updates session's `fractal_system` incrementally.

**`store_demoted_concept`**
```
Input:
  session_id: string
  concept: DemotedConcept

Output:
  stored: boolean
  total_demoted: number
```

**`store_fractal_system`**
```
Input:
  session_id: string

Output:
  success: boolean
  total_nodes: number
  total_demoted: number
  status: "design"
```
Finalizes the system. Validates all nodes have NPV scores and gate decisions. Advances session status to "design".

### Validation & Dependencies

**`validate_fractal_system`**
```
Input:
  session_id: string

Output:
  valid: boolean
  issues: { node_id, severity, category, message, suggested_fix? }[]
  dependency_graph: { layers: { layer: number, node_ids: string[] }[], has_cycles: boolean }
  npv_coverage: { nodes_with_npv: number, nodes_without: number }
```

**`resolve_dependencies`** — same I/O as v6

**`estimate_ebitda_impact`** — same I/O as v6

### Export

**`select_target_platform`**
```
Input:
  session_id: string
  platform: "claude_agent_sdk"

Output:
  platform: string
  capabilities: string[]
  limitations: string[]
  affected_nodes: { node_id, issues: string[] }[]
```

**`translate_to_platform`**
```
Input:
  session_id: string

Output:
  translated_system: TranslatedFractalSystem
  artifact_count: number
  warnings: string[]
```

**`export_package`**
```
Input:
  session_id: string
  format: "zip"

Output:
  package_id: string
  artifacts: { filename, category, size_bytes }[]
  package_content: string (base64)
```

## Agent Design Flow

This is how ATLAS (Claude) uses the fractal gates during design:

```
1. ATLAS analyzes CompanyContext + selected APQC processes
   Calls: design_fractal_system (gets context + doctrine)

2. For each proposed Value Chain Area:
   a. Claude proposes the node with purpose + outputs
   b. Calls: run_decomposition_gate (fractal: same gate at every level)
      - Value Chain Areas typically pass as "instance" (they map to Porter activities)
      - But thin areas with few processes may be demoted to fields on a parent
   c. Calls: score_structural_npv (with per-output value + cost estimates)
   d. If NPV positive: calls store_fractal_node to persist
   e. If NPV negative: Claude can accept demotion or argue override (logged)
   f. Calls: score_output_economics (catalog the area's outputs)

3. For each proposed POD within an area:
   a. Calls: run_decomposition_gate
      - If best_form = "instance": proceed to NPV scoring
      - If best_form != "instance": calls store_demoted_concept, skip
   b. Calls: score_structural_npv
   c. If positive: Claude fills sections A-K, calls store_fractal_node

4. For each proposed Agent within a POD:
   a. Calls: run_decomposition_gate
   b. Calls: score_structural_npv
   c. If positive: Claude fills sections A-K (including tools, memory, skills, MCP servers)
   d. Calls: check_runtime_promotion (v1: always runtime)
   e. Calls: store_fractal_node

5. For proposed Sub-Agents within an Agent:
   a. Same gate sequence — fractal recursion (decomp gate -> NPV -> store)
   b. Stopping condition: semantic saturation (children are near-synonyms)

6. After full system designed:
   a. Calls: check_consolidation (detect overlap across all nodes)
   b. Applies consolidation actions (merge/demote as recommended)
   c. Calls: validate_node per node (acceptance tests)
   d. Calls: review_output_quality per critical output
   e. Calls: store_fractal_system (finalize + advance session status)
   f. Calls: validate_fractal_system (structural integrity)
   g. Calls: resolve_dependencies (execution layers)
```

Claude drives the reasoning. Tools provide structured scoring. Every decision is traceable.

## The Wizard — Human-Agent Collaboration Surface

Same 5 pages as v6. The Design page gets significantly richer.

### Page Structure

| Page | Human Provides | ATLAS Does | Human Reviews/Tweaks |
|------|---------------|------------|---------------------|
| **Intake** | Company name, docs, strategic context | Ingests docs, builds CompanyContext | Verify, correct, add context |
| **Processes** | Domain preferences, priorities | Recommends APQC processes, maps to value chain, scores EBITDA | Select/deselect, adjust priorities |
| **Design** | Constraints (autonomy, max agents) | Designs fractal system with NPV scoring and gate decisions at every level | Override gates, force-promote demoted concepts, rename agents, adjust tools |
| **Configure** | Platform selection | Validates, resolves deps, translates | Fix issues, approve |
| **Export** | Deployment preferences | Produces artifacts | Download, review, deploy |

### Design Page — Progressive Disclosure

**Summary view (default):**
Shows the fractal hierarchy with NPV scores and gate verdicts. Demoted concepts listed under their parent.

```
Value Chain: Firm Infrastructure [NPV: +12.4]
  +-- POD: Financial Planning & Analysis [NPV: +8.7]
  |     +-- Agent: Fortis Budget Forecaster [NPV: +5.2] Runtime
  |     +-- Agent: Fortis Variance Analyst [NPV: +3.5] Runtime
  |
  |  Demoted:
  |     o "Report Formatter" -> Field (NPV: -1.2)
  |     o "Approval Router" -> Policy
```

**Drill-down view (click any node):**
Full Universal Node Schema sections A-K:
- Identity, Purpose, Inputs/Outputs, Output Value Thesis
- Runtime Shape, Tools/Memory/Policies
- Structural NPV breakdown (output value vs. cost drivers)
- Decomposition Gate decisions for proposed children
- Stub fields for Ontology/Capability/AEO-GEO (visible, empty)

**Human overrides:**
- Click demoted concept -> "Promote to Instance" (ATLAS re-runs gates with override flag)
- Click agent -> adjust NPV inputs, add/remove outputs, change tools
- Click "Redesign POD" -> ATLAS re-runs fractal flow for that subtree

## Session Management

Same as v6:
- Persistent sessions with unique IDs
- JSON file persistence with configurable TTL (30 days default)
- Session accumulates context across wizard pages
- Audit trail of all tool calls and human edits

### Session State

```
Session
  +-- id: string (UUID)
  +-- created_at, updated_at: timestamp
  +-- status: "intake" | "processes" | "design" | "configure" | "export" | "completed"
  +-- company_context: CompanyContext | null
  +-- selected_processes: SelectedProcess[]
  +-- fractal_system: FractalAgentSystem | null
  +-- translated_system: TranslatedFractalSystem | null
  +-- history: SessionEvent[]
```

## Error Handling

Same patterns as v6 plus:
- **NPV scoring edge cases**: If Claude provides all-zero estimates, tool returns warning and asks for re-estimation.
- **Gate disagreements**: If Claude overrides a "demote" recommendation, the override is logged in session history with Claude's justification. The wizard shows overridden gates with a warning badge.
- **Consolidation conflicts**: If `check_consolidation` recommends merging two nodes the human approved separately, flag as a warning (not error). Human decides.

## Scoping: v1 vs. Future

### v1 (Launch)

- ATLAS-Fractal agent with MCP server interface (stdio + HTTP/SSE)
- Universal Fractal Node schema (sections A-K, stubs for I/J/K)
- 7 fractal gate tools fully implemented
- Document ingestion (PDF, Excel, Word)
- APQC framework tools
- Fractal-aware agent design engine
- Structural NPV scoring and Decomposition Gate at every level
- Output economics catalog
- Consolidation detection
- Quality review rubric
- Node validation (acceptance tests)
- Session persistence (JSON files)
- Wizard UI (5 pages with progressive disclosure on Design page)
- Claude Agent SDK as primary export target
- EBITDA impact estimation
- Runtime promotion gate (v1: always runtime for passing nodes)

### Future (post-v1)

- Three-tier runtime promotion (ontology_only, design_time, runtime)
- Ontology Linkage active population (section I)
- Atomic Capability Linkage active population (section J)
- AEO/GEO Output Linkage active population (section K)
- Public data search/enrichment
- Additional platform translators (OpenAI, LangGraph, CrewAI)
- Multi-user concurrent sessions with auth
- Node versioning and diff
- Governance/lifecycle workflow (owner, approver, change authority)
- Consolidation workflow (merge, demotion, migration)

## Project Structure

```
~/Documents/atlas-fractal/
  +-- packages/
  |     +-- atlas-agent/
  |     |     +-- src/
  |     |     |     +-- index.ts
  |     |     |     +-- server.ts
  |     |     |     +-- agent/
  |     |     |     |     +-- system-prompt.ts
  |     |     |     |     +-- index.ts
  |     |     |     +-- types/
  |     |     |     |     +-- fractal-node.ts
  |     |     |     |     +-- fractal-system.ts
  |     |     |     |     +-- company-context.ts
  |     |     |     |     +-- session.ts
  |     |     |     |     +-- index.ts
  |     |     |     +-- data/
  |     |     |     |     +-- apqc.ts
  |     |     |     |     +-- porter.ts
  |     |     |     |     +-- gics.ts
  |     |     |     +-- session/
  |     |     |     |     +-- store.ts
  |     |     |     |     +-- index.ts
  |     |     |     +-- tools/
  |     |     |     |     +-- apqc.ts
  |     |     |     |     +-- document-ingestion.ts
  |     |     |     |     +-- fractal-gates/
  |     |     |     |     |     +-- structural-npv.ts
  |     |     |     |     |     +-- decomposition-gate.ts
  |     |     |     |     |     +-- runtime-promotion.ts
  |     |     |     |     |     +-- output-economics.ts
  |     |     |     |     |     +-- validation.ts
  |     |     |     |     |     +-- quality-review.ts
  |     |     |     |     |     +-- consolidation.ts
  |     |     |     |     |     +-- index.ts
  |     |     |     |     +-- agent-design.ts
  |     |     |     |     +-- export.ts
  |     |     |     |     +-- registry.ts
  |     |     |     +-- translators/
  |     |     |           +-- claude-agent-sdk.ts
  |     |     +-- package.json
  |     |     +-- tsconfig.json
  |     +-- wizard/
  |           +-- src/
  |           +-- package.json
  +-- package.json
  +-- docs/
        +-- specs/
```

## Tech Stack

- **ATLAS Core**: TypeScript, Claude Agent SDK
- **MCP Interface**: MCP TypeScript SDK (stdio + HTTP/SSE)
- **Document Ingestion**: pdf-parse, xlsx, mammoth
- **Wizard UI**: Next.js 15 (App Router), React 19
- **Styling**: CSS custom properties (design tokens)
- **Monorepo**: npm workspaces
- **Deployment**: ATLAS agent as Docker container or long-running Node process; wizard on Vercel

## Design Principles (merged v6 + fractal)

1. **Structural NPV First** — No node exists without positive NPV or exceptional strategic option value.
2. **Output-First Agent Design** — Agents exist because outputs need to exist. Start from work products, work backwards to minimum agents.
3. **Fractal Architecture** — Same Universal Node Schema at every level. The grammar is universal.
4. **Decomposition Gate Before Creation** — Every proposed child must pass: Instance, Field, Matrix, Example, or Policy?
5. **Client-Specific Everything** — Nothing generic. Names, justifications, NPV scores all reference THIS client.
6. **Minimum Viable Agents** — Fewer agents is always better. The fractal gates enforce this structurally.
7. **Process Elimination, Not Process Support** — Agents eliminate manual steps entirely.
8. **Normalized First, Translated Second** — Design in universal fractal form, export platform-specific.
9. **Stop at Semantic Saturation** — If children are near-synonyms, consolidate.
10. **Claude Reasons, Tools Score** — ATLAS proposes, fractal gate tools decide. Every decision is traceable.
