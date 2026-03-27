"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "../../../hooks/use-atlas";
import FractalTree from "../../../components/FractalTree";
import NodeDetail from "../../../components/NodeDetail";
import DemotedList from "../../../components/DemotedList";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = Record<string, any>;

interface DemotedConcept {
  concept: string;
  parent_node_id: string;
  demoted_to: string;
  rationale: string;
  npv_score: number;
  can_override: boolean;
}

interface DesignResult {
  value_chain_areas: AnyNode[];
  demoted_concepts: DemotedConcept[];
  output_catalog: AnyNode[];
  consolidation_log: AnyNode[];
}

export default function DesignPage() {
  const router = useRouter();
  const { callTool, loading, error } = useAtlas();

  const [designResult, setDesignResult] = useState<DesignResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(
    "ATLAS is designing your fractal agent system..."
  );
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingPhase("ATLAS is designing your fractal agent system...");
        const result = (await callTool("design_fractal_system", {})) as DesignResult;
        if (cancelled) return;
        setDesignResult(result);
        setLoadingPhase(null);
      } catch {
        if (!cancelled) setLoadingPhase(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findNode = useCallback(
    (nodes: AnyNode[], id: string): AnyNode | null => {
      for (const node of nodes) {
        if (node.identity?.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const handlePromote = async (concept: DemotedConcept) => {
    setPromoting(concept.concept);
    try {
      await callTool("store_fractal_node", {
        node: createDefaultNode(concept),
        parent_node_id: concept.parent_node_id,
      });

      // Refresh design
      const result = (await callTool("design_fractal_system", {})) as DesignResult;
      setDesignResult(result);
    } catch {
      // error shown via useAtlas
    } finally {
      setPromoting(null);
    }
  };

  if (loadingPhase) {
    return (
      <div>
        <div className="o-page-header">
          <h1>Agent System Design</h1>
        </div>
        <div className="o-loading">
          <div className="a-heartbeat" />
          <p>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  if (!designResult) {
    return (
      <div>
        <div className="o-page-header">
          <h1>Agent System Design</h1>
        </div>
        {error && <div className="o-alert o-alert--err">{error}</div>}
        <p style={{ color: "var(--text-2)" }}>
          No design result available. Please complete the Processes step first.
        </p>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? findNode(designResult.value_chain_areas, selectedNodeId)
    : null;

  const totalNodes = countNodes(designResult.value_chain_areas);

  return (
    <div>
      <div className="o-page-header">
        <h1>Fractal Agent System Design</h1>
        <p>
          {totalNodes} nodes designed across {designResult.value_chain_areas.length} value
          chain areas. {designResult.demoted_concepts.length} concepts demoted.
          Click any node to inspect its full Universal Node Schema (sections A-K).
        </p>
      </div>

      {error && <div className="o-alert o-alert--err">{error}</div>}

      <div className="t-split">
        <div className="t-split__left">
          <FractalTree
            nodes={designResult.value_chain_areas}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
        <div className="t-split__right">
          {selectedNode ? (
            <NodeDetail node={selectedNode} />
          ) : (
            <div
              className="o-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: "var(--text-2)",
              }}
            >
              Select a node from the tree to view its details
            </div>
          )}
        </div>
      </div>

      <DemotedList
        demoted={designResult.demoted_concepts}
        onPromote={handlePromote}
        promoting={promoting}
      />

      <div style={{ marginTop: 32 }}>
        <button
          className="a-btn a-btn--primary"
          disabled={loading}
          onClick={() => router.push("/wizard/configure")}
        >
          Continue to Configure
        </button>
      </div>
    </div>
  );
}

function createDefaultNode(concept: { concept: string; parent_node_id: string; rationale: string }): AnyNode {
  const id = `promoted_${concept.concept.toLowerCase().replace(/\s+/g, "_")}`;
  const emptyMemoryLayer = { description: "", storage_type: "", retention_policy: "" };
  return {
    identity: {
      id,
      name: concept.concept,
      type: "agent",
      parent_context: concept.parent_node_id,
      candidate_child_concepts: [],
      stopping_condition: "Promoted from demoted concept",
    },
    purpose_context: {
      purpose: concept.rationale || "Promoted concept — purpose to be defined",
      domain: "",
      subdomain: "",
      surfaces: [],
      primary_users: [],
      primary_route: "",
      mad_lib: "",
    },
    io: {
      inputs: [],
      outputs: [],
      why_outputs_matter: "",
      downstream_consumers: [],
      blast_radius: "",
    },
    output_value_thesis: {
      quality: "",
      speed: "",
      reliability: "",
      reuse: "",
      governance: "",
      productization: "",
    },
    runtime_shape: {
      object_types: [],
      resolvers: [],
      states: [],
      triggers: [],
      actions: [],
      output_destinations: [],
      runtime_tier: "runtime",
    },
    tools_memory_policies: {
      tools: [],
      memory: {
        working: { ...emptyMemoryLayer },
        episodic: { ...emptyMemoryLayer },
        semantic: { ...emptyMemoryLayer },
        procedural: { ...emptyMemoryLayer },
      },
      skills: [],
      mcp_servers: [],
      data_sources: [],
      policies: [],
      handoffs: [],
      owner: "",
      lifecycle_status: "draft",
    },
    structural_npv: {
      output_value_scores: [],
      total_output_value: 0,
      cost_scores: {
        complexity: 0,
        maintenance_burden: 0,
        coordination_overhead: 0,
        semantic_duplication: 0,
        ontology_sprawl: 0,
        consolidation_risk: 0,
      },
      total_structural_cost: 0,
      net_structural_npv: 0,
      recommendation: "defer",
    },
    decomposition_gate: {
      proposed_children: [],
    },
    ontology_linkage: {},
    capability_linkage: {},
    aeo_geo_linkage: {},
    children: [],
  };
}

function countNodes(nodes: AnyNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) count += countNodes(node.children);
  }
  return count;
}
