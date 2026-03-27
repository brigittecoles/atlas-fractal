# ATLAS-Fractal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ATLAS-Fractal — a Claude Agent SDK agent exposed via MCP server that designs structurally justified fractal AI agent systems using Structural NPV scoring and Decomposition Gates.

**Architecture:** Monorepo with two packages: `atlas-agent` (agent + MCP server + fractal gate tools) and `wizard` (Next.js UI). The agent runs as a standalone Node process with dual MCP transports (stdio + HTTP/SSE). Every node in the fractal hierarchy uses the same Universal Fractal Node schema (sections A-K). Seven fractal gate tools score, classify, and justify every node before creation.

**Tech Stack:** TypeScript, Claude Agent SDK, MCP TypeScript SDK, Next.js 15, React 19, pdf-parse, xlsx, mammoth, vitest

**Spec:** `docs/specs/2026-03-27-atlas-fractal-design.md`

**Reusable from ATLAS v6** (`~/Documents/atlas-mcp/.worktrees/atlas-v6/packages/atlas-agent/src/`):
- `data/apqc.ts` — 64 APQC processes, 13 L1 categories, industry-specific data
- `data/porter.ts` — 9 Porter Value Chain activities
- `data/gics.ts` — GICS industry normalization
- `session/store.ts` — SessionStore with JSON persistence, TTL, audit trail
- `tools/apqc.ts` — search_processes, get_process_detail handlers
- `tools/document-ingestion.ts` — PDF/Excel/Word parsers
- `server.ts` — MCP server with dual transports (needs session type updates)

---

## Chunk 1: Monorepo Scaffold + Fractal Node Types

### Task 1: Monorepo scaffold

**Files:**
- Create: `packages/atlas-agent/package.json`
- Create: `packages/atlas-agent/tsconfig.json`
- Create: `packages/atlas-agent/src/index.ts`
- Create: `packages/atlas-agent/.gitignore`
- Create: `packages/wizard/package.json`
- Create: `packages/wizard/tsconfig.json`
- Create: `package.json` (workspace root)

- [ ] **Step 1: Create workspace root package.json**

```json
{
  "name": "atlas-fractal",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "agent": "npm -w packages/atlas-agent run start",
    "agent:dev": "npm -w packages/atlas-agent run dev",
    "wizard": "npm -w packages/wizard run dev",
    "build": "npm -w packages/atlas-agent run build && npm -w packages/wizard run build",
    "test": "npm -w packages/atlas-agent run test"
  }
}
```

- [ ] **Step 2: Create atlas-agent package.json**

```json
{
  "name": "@atlas-fractal/agent",
  "version": "6.0.0-fractal",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.80.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "cors": "^2.8.6",
    "express": "^4.21.0",
    "mammoth": "^1.8.0",
    "pdf-parse": "^1.1.1",
    "uuid": "^11.1.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: Create atlas-agent tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create .gitignore and minimal entry point**

`.gitignore`: `dist/` and `.atlas-sessions/`

`src/index.ts`:
```typescript
console.log("ATLAS-Fractal agent starting...");
```

- [ ] **Step 5: Create wizard package (minimal Next.js shell)**

Create `packages/wizard/package.json` with Next.js 15, React 19. Create minimal `src/app/page.tsx` rendering "ATLAS-Fractal Wizard".

- [ ] **Step 6: Install deps and verify**

Run: `cd ~/Documents/atlas-fractal && npm install`
Run: `npx -w packages/atlas-agent tsx src/index.ts`
Expected: Prints "ATLAS-Fractal agent starting..."

- [ ] **Step 7: Commit**

```bash
git add packages/ package.json
git commit -m "feat: scaffold monorepo with atlas-agent and wizard packages"
```

### Task 2: Universal Fractal Node types (sections A-K)

**Files:**
- Create: `packages/atlas-agent/src/types/fractal-node.ts`
- Create: `packages/atlas-agent/src/types/fractal-system.ts`
- Create: `packages/atlas-agent/src/types/company-context.ts`
- Create: `packages/atlas-agent/src/types/session.ts`
- Create: `packages/atlas-agent/src/types/index.ts`

- [ ] **Step 1: Write fractal-node.ts — the core type**

This is the universal schema from the spec. Every node (Value Chain Area, POD, Agent, Sub-Agent) uses this same type. Create all sub-types:

```typescript
// packages/atlas-agent/src/types/fractal-node.ts

// === Section A: Identity ===
export interface NodeIdentity {
  name: string;
  id: string;
  type: "value_chain_area" | "pod" | "agent" | "sub_agent";
  parent_context: string;
  candidate_child_concepts: string[];
  stopping_condition: string;
}

// === Section B: Purpose & Context ===
export interface NodePurpose {
  purpose: string;
  domain: string;
  subdomain: string;
  surfaces: string[];
  primary_users: string[];
  primary_route: string;
  mad_lib: string;
}

// === Section C: Inputs & Outputs ===
export interface OutputSpec {
  output_id: string;
  name: string;
  description: string;
  value_type?: "revenue_bearing" | "trust_bearing" | "mission_critical"
    | "reusable_upstream" | "governance_sensitive";
}

export interface NodeIO {
  inputs: string[];
  outputs: OutputSpec[];
  why_outputs_matter: string;
  downstream_consumers: string[];
  blast_radius: string;
}

// === Section D: Output Value Thesis ===
export interface OutputValueThesis {
  quality_improvement: string;
  speed_improvement: string;
  reliability_improvement: string;
  reuse_improvement: string;
  governance_improvement: string;
  productization_improvement: string;
}

// === Section E: Runtime Shape ===
export interface RuntimeShape {
  object_types: string[];
  resolvers: string[];
  states: string[];
  triggers: string[];
  actions: string[];
  output_destinations: string[];
  runtime_tier: "runtime"; // future: "ontology_only" | "design_time" | "runtime"
}

// === Section F: Tools / Memory / Policies ===
export interface NormalizedToolSpec {
  name: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  returns: string;
}

export interface NormalizedSkill {
  name: string;
  description: string;
  capabilities: string[];
}

export interface McpServerSpec {
  name: string;
  transport: "stdio" | "http";
  url_or_command: string;
  tools_provided: string[];
}

export interface DataSourceSpec {
  name: string;
  type: "database" | "api" | "file" | "stream";
  connection_info: string;
  access_pattern: "read" | "write" | "read_write";
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
  lifecycle_status: "draft" | "active" | "deprecated" | "retired";
}

// === Section G: Structural NPV ===
export interface OutputValueScore {
  output_id: string;
  output_name: string;
  importance: number; // 1-5
  quality_gain: number; // 0-5
  speed_gain: number;
  reliability_gain: number;
  reuse_gain: number;
  governance_gain: number;
  productization_gain: number;
  total: number;
}

export interface CostScores {
  complexity: number; // 0-5
  maintenance_burden: number;
  coordination_overhead: number;
  semantic_duplication: number;
  ontology_sprawl: number;
  consolidation_risk: number;
}

export interface StructuralNPV {
  output_value_scores: OutputValueScore[];
  total_output_value: number;
  cost_scores: CostScores;
  total_structural_cost: number;
  net_structural_npv: number;
  recommendation: "create" | "demote" | "defer";
}

// === Section H: Decomposition Gate ===
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

// === Sections I, J, K: Stubs ===
export interface OntologyLinkage {
  ontology_class?: string;
  parent_classes?: string[];
  relationships?: string[];
  output_class?: string;
  dependencies?: string[];
}

export interface AtomicCapabilityLinkage {
  capability_ids?: string[];
  action_object_pairs?: string[];
  context_modifiers?: string[];
  outcomes?: string[];
  audience?: string[];
}

export interface AeoGeoLinkage {
  answer_object_type?: string;
  intent_coverage?: string;
  semantic_completeness?: string;
  retrieval_structure?: string;
  visibility_potential?: string;
}

// === The Universal Fractal Node ===
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
  // Fractal nesting
  children: UniversalFractalNode[];
}
```

- [ ] **Step 2: Write fractal-system.ts**

```typescript
// packages/atlas-agent/src/types/fractal-system.ts
import type { UniversalFractalNode, DecompositionForm } from "./fractal-node.js";
import type { CompanyContext } from "./company-context.js";

export interface DemotedConcept {
  concept: string;
  parent_node_id: string;
  demoted_to: Exclude<DecompositionForm, "instance">;
  rationale: string;
  npv_score: number;
  gate_results: {
    decomposition_form: DecompositionForm;
    runtime_promotion_tier: string;
  };
  can_override: boolean;
}

export type OutputValueType =
  | "revenue_bearing" | "trust_bearing" | "mission_critical"
  | "reusable_upstream" | "governance_sensitive";

export interface OutputEconomicsEntry {
  output_id: string;
  name: string;
  owner_node_id: string;
  consumers: string[];
  value_type: OutputValueType;
  importance: number;
  quality_criteria: string[];
  risk_sensitivity: "low" | "medium" | "high" | "critical";
  blast_radius: string;
}

export interface ConsolidationEntry {
  source_node_ids: string[];
  action: "merge" | "demote" | "retire" | "keep";
  target_node_id?: string;
  rationale: string;
  timestamp: string;
}

export interface FractalAgentSystem {
  schema_version: "6.0-fractal";
  company_context: CompanyContext;
  value_chain_areas: UniversalFractalNode[];
  demoted_concepts: DemotedConcept[];
  output_catalog: OutputEconomicsEntry[];
  consolidation_log: ConsolidationEntry[];
  target_platform: string | null;
}

export interface TranslatedFractalSystem extends FractalAgentSystem {
  target_platform: string;
  platform_constraints: string[];
  artifacts: {
    filename: string;
    content: string;
    category: string;
    description: string;
  }[];
}
```

- [ ] **Step 3: Write company-context.ts**

Copy from v6's `types/company-context.ts` — same `CompanyProfile`, `ExtractedDocument`, `CompanyContext`, `Financials`, `OwnershipType`.

- [ ] **Step 4: Write session.ts**

```typescript
// packages/atlas-agent/src/types/session.ts
import type { CompanyContext } from "./company-context.js";
import type { FractalAgentSystem, TranslatedFractalSystem } from "./fractal-system.js";

export type SessionStatus = "intake" | "processes" | "design" | "configure" | "export" | "completed";

export interface SessionEvent {
  timestamp: string;
  type: "tool_call" | "human_edit" | "status_change" | "gate_override";
  tool_name?: string;
  node_id?: string;
  summary: string;
}

export interface SelectedProcess {
  process_id: string;
  process_name: string;
  l1_id: string;
  l1_name: string;
  porter_activity: string;
  client_justification: string;
  ebitda_score: number;
}

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  status: SessionStatus;
  company_context: CompanyContext | null;
  selected_processes: SelectedProcess[];
  fractal_system: FractalAgentSystem | null;
  translated_system: TranslatedFractalSystem | null;
  history: SessionEvent[];
}
```

- [ ] **Step 5: Create barrel export and verify types compile**

```typescript
// packages/atlas-agent/src/types/index.ts
export * from "./fractal-node.js";
export * from "./fractal-system.js";
export * from "./company-context.js";
export * from "./session.js";
```

Run: `npx -w packages/atlas-agent tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/atlas-agent/src/types/
git commit -m "feat: Universal Fractal Node types (sections A-K) + FractalAgentSystem"
```

### Task 3: Session persistence

**Files:**
- Create: `packages/atlas-agent/src/session/store.ts`
- Create: `packages/atlas-agent/src/session/index.ts`
- Create: `packages/atlas-agent/src/session/__tests__/store.test.ts`

- [ ] **Step 1: Write failing test for session CRUD + fractal-specific operations**

Test: create, get, update, delete, list, appendEvent, cleanup (same as v6). Add fractal-specific test: storing a node incrementally to the session's `fractal_system`.

```typescript
// Key tests:
it("creates session with null fractal_system", () => { ... });
it("persists and retrieves session", () => { ... });
it("appends events to history", () => { ... });
it("cleans up sessions older than TTL", () => { ... });
it("initializes fractal_system on first store_node call", () => {
  const session = store.create();
  const mockNode = createMockNode("area-1", "Test Area", "value_chain_area");
  store.addNode(session.id, mockNode, null); // null parent = top-level
  const retrieved = store.get(session.id);
  expect(retrieved?.fractal_system?.value_chain_areas).toHaveLength(1);
});

it("nests a pod under a value chain area by parent_node_id", () => {
  const session = store.create();
  const area = createMockNode("area-1", "Firm Infrastructure", "value_chain_area");
  store.addNode(session.id, area, null);
  const pod = createMockNode("pod-1", "Financial Planning", "pod");
  store.addNode(session.id, pod, "area-1"); // parent = area-1
  const retrieved = store.get(session.id);
  expect(retrieved?.fractal_system?.value_chain_areas[0].children).toHaveLength(1);
  expect(retrieved?.fractal_system?.value_chain_areas[0].children[0].identity.name).toBe("Financial Planning");
});

it("nests an agent under a pod (two levels deep)", () => {
  const session = store.create();
  const area = createMockNode("area-1", "Firm Infrastructure", "value_chain_area");
  store.addNode(session.id, area, null);
  const pod = createMockNode("pod-1", "Financial Planning", "pod");
  store.addNode(session.id, pod, "area-1");
  const agent = createMockNode("agent-1", "Budget Forecaster", "agent");
  store.addNode(session.id, agent, "pod-1"); // parent = pod-1
  const retrieved = store.get(session.id);
  const agentNode = retrieved?.fractal_system?.value_chain_areas[0].children[0].children[0];
  expect(agentNode?.identity.name).toBe("Budget Forecaster");
});

it("returns error when parent_node_id not found", () => {
  const session = store.create();
  const orphan = createMockNode("orphan-1", "Orphan", "agent");
  expect(() => store.addNode(session.id, orphan, "nonexistent")).toThrow();
});

it("stores demoted concepts", () => {
  const session = store.create();
  store.addDemotedConcept(session.id, {
    concept: "Report Formatter",
    parent_node_id: "area-1",
    demoted_to: "field",
    rationale: "No distinct outputs",
    npv_score: -1.2,
    gate_results: { decomposition_form: "field", runtime_promotion_tier: "n/a" },
    can_override: true,
  });
  const retrieved = store.get(session.id);
  expect(retrieved?.fractal_system?.demoted_concepts).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx -w packages/atlas-agent vitest run src/session/__tests__/store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement SessionStore**

Copy `store.ts` from v6 as starting point. Adapt:
- Change `Session` type import to fractal version
- Add `addNode(sessionId, node, parentNodeId)` method — inserts a `UniversalFractalNode` into the session's `fractal_system` (creating it if null). If `parentNodeId` is null, appends to `value_chain_areas`. If non-null, recursively searches the tree to find the parent by `identity.id` and appends to its `children` array. Throws if parent not found.
- Add `addDemotedConcept(sessionId, concept)` method
- Keep: create, get, update, list, delete, appendEvent, cleanup

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx -w packages/atlas-agent vitest run src/session/__tests__/store.test.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/atlas-agent/src/session/
git commit -m "feat: session persistence with fractal node storage"
```

---

## Chunk 2: MCP Server + Reference Data + APQC Tools

### Task 4: MCP server with dual transports

**Files:**
- Create: `packages/atlas-agent/src/server.ts`
- Create: `packages/atlas-agent/src/tools/registry.ts`
- Modify: `packages/atlas-agent/src/index.ts`
- Create: `packages/atlas-agent/src/__tests__/server.test.ts`

- [ ] **Step 1: Implement MCP server setup**

Copy `server.ts` from v6. Adapt: update session type imports, keep Express + SSE + stdio structure, update health endpoint to return `"name": "atlas-fractal"`.

- [ ] **Step 2: Create tool registry skeleton**

```typescript
// packages/atlas-agent/src/tools/registry.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SessionStore } from "../session/index.js";

export function registerAllTools(server: McpServer, store: SessionStore): void {
  console.log("[ATLAS-Fractal] Tool registry initialized (0 tools registered)");
}
```

- [ ] **Step 3: Wire up entry point and write server test**

Update `index.ts` to parse `--stdio` and call `startServer()`. Write `server.test.ts` verifying server creates successfully.

- [ ] **Step 4: Smoke test**

Run: `npx -w packages/atlas-agent tsx src/index.ts &` then `curl http://localhost:3001/health`
Expected: `{"status":"ok","name":"atlas-fractal","version":"6.0.0-fractal"}`

- [ ] **Step 5: Commit**

```bash
git add packages/atlas-agent/src/server.ts packages/atlas-agent/src/tools/ packages/atlas-agent/src/index.ts packages/atlas-agent/src/__tests__/
git commit -m "feat: MCP server with stdio and HTTP/SSE transports"
```

### Task 5: Reference data (APQC + Porter + GICS)

**Files:**
- Create: `packages/atlas-agent/src/data/apqc.ts`
- Create: `packages/atlas-agent/src/data/porter.ts`
- Create: `packages/atlas-agent/src/data/gics.ts`

- [ ] **Step 1: Copy reference data from v6**

Copy all three files from `~/Documents/atlas-mcp/.worktrees/atlas-v6/packages/atlas-agent/src/data/`.

- [ ] **Step 2: Verify compiles**

Run: `npx -w packages/atlas-agent tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/atlas-agent/src/data/
git commit -m "feat: reference data (APQC, Porter, GICS) copied from v6"
```

### Task 6: APQC framework tools

**Files:**
- Create: `packages/atlas-agent/src/tools/apqc.ts`
- Create: `packages/atlas-agent/src/tools/__tests__/apqc.test.ts`

- [ ] **Step 1: Write failing tests**

Test `handleSearchProcesses` (filter by industry + keywords), `handleGetProcessDetail` (by ID), `handleMapToValueChain` (returns Porter activities + L1 categories + reference mappings).

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement APQC tools**

Copy handlers from v6's `tools/apqc.ts`. Add `handleMapToValueChain` which returns the 9 Porter activities, 13 L1 categories, and reference L1→Porter mappings (non-prescriptive).

- [ ] **Step 4: Register in MCP server**

Add `search_processes`, `get_process_detail`, `map_to_value_chain` to registry with Zod schemas. Remember: use `z.record(z.string(), z.unknown())` for Zod v4.

- [ ] **Step 5: Run tests, verify pass**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: APQC framework tools (search, detail, map_to_value_chain)"
```

### Task 7: Document ingestion tools

**Files:**
- Create: `packages/atlas-agent/src/tools/document-ingestion.ts`
- Create: `packages/atlas-agent/src/tools/__tests__/document-ingestion.test.ts`
- Create: `packages/atlas-agent/src/types/pdf-parse.d.ts`

- [ ] **Step 1: Write failing tests**

Test `ingest_document` (PDF/Excel/Word → extracted data), `summarize_document`, `enrich_company_profile`.

- [ ] **Step 2: Implement parsers**

Copy from v6's `tools/document-ingestion.ts`. Copy `pdf-parse.d.ts` type declaration.

- [ ] **Step 3: Register tools, run tests, commit**

```bash
git commit -m "feat: document ingestion tools (PDF, Excel, Word)"
```

---

## Chunk 3: Fractal Gate Tools (the core engine)

This is what makes ATLAS-Fractal different from v6. Seven tools that score, classify, and justify every node.

### Task 8: score_structural_npv

**Files:**
- Create: `packages/atlas-agent/src/tools/fractal-gates/structural-npv.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/structural-npv.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { handleScoreStructuralNpv } from "../structural-npv.js";

describe("score_structural_npv", () => {
  it("returns 'create' for node with high output value and low cost", () => {
    const result = handleScoreStructuralNpv({
      node_proposal: { name: "Budget Forecaster", purpose: "Automate forecasting" },
      per_output_scores: [
        { output_name: "Monthly forecast", importance: 5,
          quality_gain: 4, speed_gain: 5, reliability_gain: 3,
          reuse_gain: 3, governance_gain: 2, productization_gain: 1 }
      ],
      cost_estimates: {
        complexity: 2, maintenance_burden: 1, coordination_overhead: 1,
        semantic_duplication: 0, ontology_sprawl: 0, consolidation_risk: 1
      }
    });
    expect(result.net_structural_npv).toBeGreaterThan(0);
    expect(result.recommendation).toBe("create");
  });

  it("returns 'demote' for node with negative NPV", () => {
    const result = handleScoreStructuralNpv({
      node_proposal: { name: "Report Formatter", purpose: "Format reports" },
      per_output_scores: [
        { output_name: "Formatted PDF", importance: 1,
          quality_gain: 1, speed_gain: 1, reliability_gain: 0,
          reuse_gain: 0, governance_gain: 0, productization_gain: 0 }
      ],
      cost_estimates: {
        complexity: 3, maintenance_burden: 3, coordination_overhead: 2,
        semantic_duplication: 4, ontology_sprawl: 3, consolidation_risk: 2
      }
    });
    expect(result.net_structural_npv).toBeLessThan(0);
    expect(result.recommendation).toBe("demote");
  });

  it("flags suspiciously uniform high scores as warning", () => {
    const result = handleScoreStructuralNpv({
      node_proposal: { name: "Too Good", purpose: "Everything" },
      per_output_scores: [
        { output_name: "Output", importance: 5,
          quality_gain: 5, speed_gain: 5, reliability_gain: 5,
          reuse_gain: 5, governance_gain: 5, productization_gain: 5 }
      ],
      cost_estimates: {
        complexity: 0, maintenance_burden: 0, coordination_overhead: 0,
        semantic_duplication: 0, ontology_sprawl: 0, consolidation_risk: 0
      }
    });
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx -w packages/atlas-agent vitest run src/tools/fractal-gates/__tests__/structural-npv.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement score_structural_npv**

```typescript
// packages/atlas-agent/src/tools/fractal-gates/structural-npv.ts

export interface NpvInput {
  node_proposal: { name: string; purpose: string; parent_node_id?: string };
  per_output_scores: {
    output_name: string;
    importance: number;
    quality_gain: number;
    speed_gain: number;
    reliability_gain: number;
    reuse_gain: number;
    governance_gain: number;
    productization_gain: number;
  }[];
  cost_estimates: {
    complexity: number;
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

  // Score each output: total = importance * mean(gains)
  const output_value_scores = input.per_output_scores.map((o) => {
    const gains = [o.quality_gain, o.speed_gain, o.reliability_gain,
                   o.reuse_gain, o.governance_gain, o.productization_gain];
    const meanGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const total = o.importance * meanGain;

    // Flag uniform high scores
    const allHigh = gains.every((g) => g >= 4);
    if (allHigh && o.importance >= 4) {
      warnings.push(`Output "${o.output_name}" has suspiciously uniform high scores`);
    }

    return { ...o, total: Math.round(total * 100) / 100 };
  });

  const total_output_value = output_value_scores.reduce((sum, o) => sum + o.total, 0);

  const costs = input.cost_estimates;
  const total_structural_cost =
    costs.complexity + costs.maintenance_burden + costs.coordination_overhead +
    costs.semantic_duplication + costs.ontology_sprawl + costs.consolidation_risk;

  const net = Math.round((total_output_value - total_structural_cost) * 100) / 100;

  // Flag all-zero estimates
  if (total_output_value === 0 && total_structural_cost === 0) {
    warnings.push("All estimates are zero — re-estimate with actual values");
  }

  let recommendation: "create" | "demote" | "defer";
  let reasoning: string;

  if (net > 0) {
    recommendation = "create";
    reasoning = `Positive NPV (${net}): output value (${total_output_value}) exceeds structural cost (${total_structural_cost}).`;
  } else if (net < -2) {
    recommendation = "demote";
    reasoning = `Negative NPV (${net}): structural cost (${total_structural_cost}) significantly exceeds output value (${total_output_value}). Demote to field/policy on parent.`;
  } else {
    recommendation = "defer";
    reasoning = `Marginal NPV (${net}): borderline value. Consider deferring or combining with another node.`;
  }

  return {
    output_value_scores,
    total_output_value,
    total_structural_cost,
    net_structural_npv: net,
    recommendation,
    reasoning,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: score_structural_npv — fractal gate tool for node value scoring"
```

### Task 9: run_decomposition_gate

**Files:**
- Create: `packages/atlas-agent/src/tools/fractal-gates/decomposition-gate.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/decomposition-gate.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
it("returns 'instance' when all three distinctness criteria are true", () => {
  const result = handleDecompositionGate({
    proposed_concept: "Demand Forecasting Agent",
    has_distinct_runtime_behavior: true,
    has_distinct_outputs: true,
    has_distinct_reuse: true,
  });
  expect(result.best_form).toBe("instance");
  expect(result.action).toBe("create_child_node");
});

it("returns 'field' when only attribute-like", () => {
  const result = handleDecompositionGate({
    proposed_concept: "forecast_frequency",
    has_distinct_runtime_behavior: false,
    has_distinct_outputs: false,
    has_distinct_reuse: false,
  });
  expect(result.best_form).toBe("field");
  expect(result.action).toBe("add_as_field");
});

it("returns 'policy' when governance constraint", () => {
  // Classified by name pattern + no distinct runtime/outputs
  const result = handleDecompositionGate({
    proposed_concept: "Approval required before publishing",
    has_distinct_runtime_behavior: false,
    has_distinct_outputs: false,
    has_distinct_reuse: true, // reusable rule, but not an agent
  });
  expect(result.best_form).toBe("policy");
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement decomposition gate**

Classification logic:
- All three true → "instance"
- distinct_runtime + distinct_outputs but not reuse → "instance" (still warrants its own node)
- Only distinct_outputs → "matrix" (structured scoring dimension)
- Only distinct_reuse → "policy" or "example" depending on nature
- None → "field"

The gate returns `best_form`, `rationale`, and `action`.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: run_decomposition_gate — classifies distinctions into instance/field/matrix/example/policy"
```

### Task 10: Fractal gate tools — promotion, economics, validation, quality review (4 tools)

**Files:**
- Create: `packages/atlas-agent/src/tools/fractal-gates/runtime-promotion.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/output-economics.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/validation.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/quality-review.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/runtime-promotion.test.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/output-economics.test.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/validation.test.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/quality-review.test.ts`

Each tool gets its own test file for independent debugging.

- [ ] **Step 1: Write failing test + implement check_runtime_promotion**

Test: v1 always returns `{ tier: "runtime" }`. Implement: trivial — always returns runtime.

- [ ] **Step 2: Write failing test + implement score_output_economics**

Test: given outputs with value types + importance, returns catalog entries + portfolio value + high-risk flags. Implement: validates value types, computes aggregate, flags risk_sensitivity "critical" outputs.

- [ ] **Step 3: Write failing test + implement validate_node**

Test: given a stored node, returns acceptance tests derived from outputs and purpose. Test: node with no outputs fails. Implement: generates hypothesis per output, checks required fields populated.

- [ ] **Step 4: Write failing test + implement review_output_quality**

Test: returns 9-dimension scores, overall score, threshold check. Test: output with low scores fails threshold. Implement: scores against the workbook sheet 12 rubric (purpose alignment, accuracy, completeness, relevance, clarity, depth, tone consistency, bias/ethics, AEO/GEO readiness).

- [ ] **Step 5: Run all tests, verify pass**

Run: `npx -w packages/atlas-agent vitest run src/tools/fractal-gates/__tests__/`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: fractal gate tools — runtime promotion, output economics, validation, quality review"
```

### Task 11: Fractal gate tool — check_consolidation (dedicated task)

**Files:**
- Create: `packages/atlas-agent/src/tools/fractal-gates/consolidation.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/__tests__/consolidation.test.ts`
- Create: `packages/atlas-agent/src/tools/fractal-gates/index.ts`

This tool is more complex than the others — it reads all nodes from the session and performs cross-node comparison.

- [ ] **Step 1: Write failing tests**

```typescript
it("detects near-synonym overlap between two nodes with similar names and purposes", () => {
  // Create session with two similar agents
  const session = store.create();
  store.addNode(session.id, createMockNode("a1", "Budget Forecaster", "agent"), null);
  store.addNode(session.id, createMockNode("a2", "Financial Forecaster", "agent"), null);

  const result = handleCheckConsolidation(session.id, store);
  expect(result.overlap_candidates).toHaveLength(1);
  expect(result.overlap_candidates[0].overlap_type).toBe("near_synonym");
});

it("returns empty when nodes are distinct", () => {
  const session = store.create();
  store.addNode(session.id, createMockNode("a1", "Budget Forecaster", "agent"), null);
  store.addNode(session.id, createMockNode("a2", "Compliance Auditor", "agent"), null);

  const result = handleCheckConsolidation(session.id, store);
  expect(result.overlap_candidates).toHaveLength(0);
});

it("recommends merge for semantic duplicates", () => {
  // Two nodes with identical outputs
  const session = store.create();
  const n1 = createMockNode("a1", "Invoice Processor", "agent");
  n1.io.outputs = [{ output_id: "o1", name: "Processed invoice", description: "..." }];
  const n2 = createMockNode("a2", "Invoice Handler", "agent");
  n2.io.outputs = [{ output_id: "o2", name: "Processed invoice data", description: "..." }];
  store.addNode(session.id, n1, null);
  store.addNode(session.id, n2, null);

  const result = handleCheckConsolidation(session.id, store);
  expect(result.overlap_candidates[0].recommendation).toBe("merge");
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement check_consolidation**

Takes `sessionId` + `store`. Reads all nodes from `fractal_system` (recursive tree walk). For each pair of nodes at the same level: computes word-level Jaccard similarity on `name + purpose`. If similarity > 0.6 → "near_synonym". Also compares output names — if outputs overlap > 50% → "semantic_duplicate". Returns `overlap_candidates` with recommendations (merge/demote/keep) and `consolidation_actions`.

- [ ] **Step 4: Create barrel export**

```typescript
// packages/atlas-agent/src/tools/fractal-gates/index.ts
export { handleScoreStructuralNpv } from "./structural-npv.js";
export { handleDecompositionGate } from "./decomposition-gate.js";
export { handleCheckRuntimePromotion } from "./runtime-promotion.js";
export { handleScoreOutputEconomics } from "./output-economics.js";
export { handleValidateNode } from "./validation.js";
export { handleReviewOutputQuality } from "./quality-review.js";
export { handleCheckConsolidation } from "./consolidation.js";
```

- [ ] **Step 5: Run all fractal gate tests**

Run: `npx -w packages/atlas-agent vitest run src/tools/fractal-gates/`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: check_consolidation — cross-node overlap detection with Jaccard similarity"
```

- [ ] **Step 10: Commit**

```bash
git commit -m "feat: remaining fractal gate tools (promotion, economics, validation, quality, consolidation)"
```

---

## Chunk 4: Agent Design + Validation + Export Tools

### Task 12: Fractal-aware agent design tools

**Files:**
- Create: `packages/atlas-agent/src/tools/agent-design.ts`
- Create: `packages/atlas-agent/src/tools/__tests__/agent-design.test.ts`

- [ ] **Step 1: Write failing tests**

Test: `handleDesignFractalSystem` returns company summary + selected processes + fractal doctrine. `handleDesignFractalPod` returns area context + existing nodes. `handleStoreFractalNode` persists node to session. `handleStoreDemotedConcept` persists demotion.

- [ ] **Step 2: Implement design tools**

These are **data providers** — they assemble context for Claude to reason with.
- `handleDesignFractalSystem(sessionId, store)` — reads session's CompanyContext + selected_processes + APQC data. Returns structured context + the 5 core fractal laws + NPV formula + gate rules as `fractal_doctrine` string.
- `handleDesignFractalPod(sessionId, valueChainArea, processIds, constraints, store)` — scoped context for one area.
- `handleDesignFractalAgent(sessionId, podId, requiredOutputs, constraints, store)` — scoped for one agent.
- `handleStoreFractalNode(sessionId, node, parentNodeId, store)` — calls `store.addNode()`.
- `handleStoreDemotedConcept(sessionId, concept, store)` — calls `store.addDemotedConcept()`.
- `handleStoreFractalSystem(sessionId, store)` — finalizes: validates all nodes have NPV scores, advances status to "design".

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: fractal-aware agent design tools + node storage"
```

### Task 13: Validation + EBITDA + dependency tools

**Files:**
- Create: `packages/atlas-agent/src/tools/validation.ts`
- Create: `packages/atlas-agent/src/tools/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests**

Test: `validate_fractal_system` checks all nodes have NPV scores, detects missing outputs, circular deps, orphaned nodes. `resolve_dependencies` builds execution layers. `estimate_ebitda_impact` computes from financials.

- [ ] **Step 2: Implement validation tools**

- `handleValidateFractalSystem` — walks the tree. For each node: check identity.name, io.outputs non-empty, structural_npv exists. Build dep graph, detect cycles (topological sort). Return `npv_coverage` showing how many nodes have/lack NPV scores.
- `handleResolveDependencies` — same as v6 but walks fractal tree.
- `handleEstimateEbitdaImpact` — same as v6.

- [ ] **Step 3: Run tests, verify pass, commit**

```bash
git commit -m "feat: fractal system validation + dependency resolution + EBITDA"
```

### Task 14: Export tools (Claude Agent SDK translator)

**Files:**
- Create: `packages/atlas-agent/src/translators/claude-agent-sdk.ts`
- Create: `packages/atlas-agent/src/tools/export.ts`
- Create: `packages/atlas-agent/src/tools/__tests__/export.test.ts`

- [ ] **Step 1: Write failing tests**

Test: `select_target_platform` returns capabilities/limitations. `translate_to_platform` produces artifacts. `export_package` returns base64 zip.

- [ ] **Step 2: Implement Claude Agent SDK translator**

Takes a `FractalAgentSystem`. For each agent node: generates system prompt from sections A-D, tool definitions from section F, memory config, MCP server configs. For each POD: orchestration script. Generates Docker Compose + `.env` template.

- [ ] **Step 3: Implement export tools**

`handleSelectTargetPlatform`, `handleTranslateToPlatform`, `handleExportPackage`.

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
git commit -m "feat: export tools with Claude Agent SDK translator"
```

---

## Chunk 5: Tool Registry + ATLAS Agent Definition

### Task 15: Wire all tools into MCP registry

**Files:**
- Modify: `packages/atlas-agent/src/tools/registry.ts`

- [ ] **Step 1: Register all tools**

Register all tools with Zod schemas matching the spec's I/O definitions:

**APQC tools (3):** `search_processes`, `get_process_detail`, `map_to_value_chain`
**Document tools (3):** `ingest_document`, `summarize_document`, `enrich_company_profile`
**Fractal gate tools (7):** `score_structural_npv`, `run_decomposition_gate`, `check_runtime_promotion`, `score_output_economics`, `validate_node`, `review_output_quality`, `check_consolidation`
**Design tools (6):** `design_fractal_system`, `design_fractal_pod`, `design_fractal_agent`, `store_fractal_node`, `store_demoted_concept`, `store_fractal_system`
**Validation tools (3):** `validate_fractal_system`, `resolve_dependencies`, `estimate_ebitda_impact`
**Export tools (3):** `select_target_platform`, `translate_to_platform`, `export_package`
**Session (1):** `create_session` — handler is inline in the registry: calls `store.create()`, returns `{ session_id, status }`. No separate file needed.

Total: **26 tools**

Every tool handler calls `store.appendEvent()` to record in session history. Gate override events use type `"gate_override"` and include `node_id` + the override rationale from Claude or the human.

- [ ] **Step 2: Add handleToolCall dispatch function**

For the HTTP `/tool` endpoint — dispatches by tool name.

- [ ] **Step 3: Verify build passes**

Run: `npx -w packages/atlas-agent tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: wire 26 tools into MCP registry"
```

### Task 16: ATLAS-Fractal agent system prompt

**Files:**
- Create: `packages/atlas-agent/src/agent/system-prompt.ts`
- Create: `packages/atlas-agent/src/agent/index.ts`

- [ ] **Step 1: Write the system prompt**

The prompt defines ATLAS-Fractal's identity and embeds the fractal doctrine:

- Identity: "You are ATLAS-Fractal, an AI agent that designs structurally justified fractal AI agent systems."
- The 5 core laws from the Universal Fractal Engineering framework
- The Structural NPV formula
- The Decomposition Gate classification rules
- Design flow: "For every node you propose, call score_structural_npv and run_decomposition_gate before creating it."
- Output format: "You produce agents as Universal Fractal Nodes (sections A-K)."
- Client-specific mandate: "Nothing generic. Every name, justification, and score references THIS client."
- Session awareness: "Each tool call accumulates context."

- [ ] **Step 2: Wire agent config**

The agent is invoked when design tools need Claude's reasoning. This is the integration point between MCP server, Claude Agent SDK, and session store.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: ATLAS-Fractal agent with fractal doctrine system prompt"
```

### Task 17: Integration test

**Files:**
- Create: `packages/atlas-agent/src/__tests__/integration.test.ts`

- [ ] **Step 1: Write integration test**

Full pipeline via tool calls:
1. Create session
2. Ingest a test document
3. Enrich company profile
4. Search APQC processes
5. Map to value chain
6. Design fractal system (get context)
7. Score structural NPV for a proposed node
8. Run decomposition gate
9. Store fractal node
10. Score output economics
11. Check consolidation
12. Validate fractal system
13. Select target platform
14. Translate
15. Export

Each step verifies session state accumulates correctly.

- [ ] **Step 2: Run test, commit**

```bash
git commit -m "test: full pipeline integration test for ATLAS-Fractal"
```

---

## Chunk 6: Wizard UI

### Task 18: MCP client hook + env config

**Files:**
- Create: `packages/wizard/src/lib/atlas-client.ts`
- Create: `packages/wizard/src/hooks/use-atlas.ts`
- Create: `packages/wizard/.env.local`

- [ ] **Step 1: Create MCP client wrapper + React hook**

Same pattern as v6: `atlasClient` connects to ATLAS's HTTP/SSE endpoint, `useAtlas()` hook manages session_id + callTool.

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_ATLAS_URL=http://localhost:3001/mcp
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: MCP client hook for wizard-ATLAS communication"
```

### Task 19: Wizard layout + design tokens

**Files:**
- Create: `packages/wizard/src/app/wizard/layout.tsx`
- Create: `packages/wizard/src/styles/tokens.css`
- Create: `packages/wizard/src/components/WizardNav.tsx`

- [ ] **Step 1: Create layout with 5-stage navigation**

Stages: Intake, Processes, Design, Configure, Export. Highlights current stage. Uses CSS custom properties.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: wizard layout with navigation and design tokens"
```

### Task 20: Intake page

**Files:**
- Create: `packages/wizard/src/app/wizard/intake/page.tsx`

- [ ] **Step 1: Implement Intake page**

File upload (PDF/Excel/Word) + company name + strategic context. Calls `ingest_document` per file, then `enrich_company_profile`. Renders extracted data, financials, entities.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: wizard Intake page with document upload"
```

### Task 21: Processes page

**Files:**
- Create: `packages/wizard/src/app/wizard/processes/page.tsx`

- [ ] **Step 1: Implement Processes page**

Calls `search_processes`, `map_to_value_chain`, `estimate_ebitda_impact`. Renders processes grouped by Value Chain Area. Human selects/deselects.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: wizard Processes page with APQC selection"
```

### Task 22: Design page (fractal hierarchy + progressive disclosure)

**Files:**
- Create: `packages/wizard/src/app/wizard/design/page.tsx`
- Create: `packages/wizard/src/components/FractalTree.tsx`
- Create: `packages/wizard/src/components/NodeDetail.tsx`
- Create: `packages/wizard/src/components/DemotedList.tsx`

This is the most complex page — it's where the fractal framework becomes visible.

- [ ] **Step 1: Implement FractalTree component**

Renders the Value Chain → POD → Agent → Sub-Agent hierarchy. Each node shows: name, NPV score, runtime badge. Expandable/collapsible. Color-coded by NPV (green=positive, yellow=marginal, red=would-be-demoted).

- [ ] **Step 2: Implement NodeDetail component**

Drill-down panel showing the full Universal Node Schema sections A-K:
- Identity, Purpose, Inputs/Outputs, Output Value Thesis
- Runtime Shape, Tools/Memory/Policies
- Structural NPV breakdown (bar chart of output value vs cost drivers)
- Decomposition Gate decisions for proposed children
- Stub sections (I, J, K) shown as "Future: not yet populated"

- [ ] **Step 3: Implement DemotedList component**

Shows concepts that failed gates. Each shows: concept name, parent, demoted_to form, NPV score, "Promote to Instance" button.

- [ ] **Step 4: Implement Design page**

Wires FractalTree + NodeDetail + DemotedList. On load: calls `design_fractal_system`. Shows the agent working through the fractal flow. Human can: click nodes to drill down, override gate decisions, redesign PODs.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: wizard Design page with fractal hierarchy and progressive disclosure"
```

### Task 23: Configure page

**Files:**
- Create: `packages/wizard/src/app/wizard/configure/page.tsx`

- [ ] **Step 1: Implement Configure page**

Platform selector (Claude Agent SDK only in v1). Calls `validate_fractal_system`, `resolve_dependencies`, `select_target_platform`, `translate_to_platform`. Shows NPV coverage report alongside validation.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: wizard Configure page with validation and translation"
```

### Task 24: Export page

**Files:**
- Create: `packages/wizard/src/app/wizard/export/page.tsx`

- [ ] **Step 1: Implement Export page**

Artifact list, download button, preview of key artifacts. Session summary including total NPV across all nodes.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: wizard Export page with artifact download"
```

---

## Chunk 7: End-to-End Verification

### Task 25: Environment setup + smoke test

- [ ] **Step 1: Create environment files**

`packages/atlas-agent/.env`:
```
ANTHROPIC_API_KEY=<your-key>
ATLAS_SESSION_DIR=./sessions
ATLAS_PORT=3001
```

- [ ] **Step 2: Start ATLAS-Fractal agent**

Run: `npm run agent:dev`
Expected: "ATLAS-Fractal agent listening on port 3001" with 26 tools registered.

- [ ] **Step 3: Start wizard**

Run: `npm run wizard`
Expected: Next.js dev server starts.

- [ ] **Step 4: Full wizard walkthrough**

1. Upload test PDF on Intake → verify CompanyContext built
2. Select processes on Processes → verify APQC selection
3. Review fractal design on Design → verify NPV scores, gate decisions, demoted concepts visible
4. Validate + translate on Configure → verify validation passes
5. Export on Export → download artifact package

- [ ] **Step 5: Test Claude Desktop connection**

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "atlas-fractal": {
      "command": "node",
      "args": ["packages/atlas-agent/dist/index.js", "--stdio"]
    }
  }
}
```
Verify 26 tools appear. Run "Analyze test company for agent configuration."

- [ ] **Step 6: Final commit**

```bash
git commit -m "feat: ATLAS-Fractal v1 complete — fractal agent + wizard + MCP server"
```
