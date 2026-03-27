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
        node: {
          identity: {
            id: `promoted_${concept.concept.toLowerCase().replace(/\s+/g, "_")}`,
            name: concept.concept,
            type: "agent",
            parent_context: concept.parent_node_id,
            candidate_child_concepts: [],
            stopping_condition: "Promoted from demoted concept",
          },
        },
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
        <div className="page-header">
          <h1>Agent System Design</h1>
        </div>
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  if (!designResult) {
    return (
      <div>
        <div className="page-header">
          <h1>Agent System Design</h1>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <p style={{ color: "var(--color-text-secondary)" }}>
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
      <div className="page-header">
        <h1>Fractal Agent System Design</h1>
        <p>
          {totalNodes} nodes designed across {designResult.value_chain_areas.length} value
          chain areas. {designResult.demoted_concepts.length} concepts demoted.
          Click any node to inspect its full Universal Node Schema (sections A-K).
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="split-layout">
        <div className="split-layout__left">
          <FractalTree
            nodes={designResult.value_chain_areas}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
        <div className="split-layout__right">
          {selectedNode ? (
            <NodeDetail node={selectedNode} />
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: "var(--color-text-secondary)",
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
          className="btn btn--primary"
          disabled={loading}
          onClick={() => router.push("/wizard/configure")}
        >
          Continue to Configure
        </button>
      </div>
    </div>
  );
}

function countNodes(nodes: AnyNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) count += countNodes(node.children);
  }
  return count;
}
