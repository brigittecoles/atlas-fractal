"use client";

import { useState, useCallback } from "react";

// Simplified local type matching atlas-agent's UniversalFractalNode
interface FractalNode {
  identity: {
    id: string;
    name: string;
    type: string;
  };
  structural_npv?: {
    net_structural_npv: number;
    recommendation: string;
  };
  children: FractalNode[];
  [key: string]: unknown;
}

interface FractalTreeProps {
  nodes: FractalNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export default function FractalTree({ nodes, selectedNodeId, onSelectNode }: FractalTreeProps) {
  return (
    <div className="fractal-tree">
      {nodes.map((node) => (
        <TreeNode
          key={node.identity.id}
          node={node}
          depth={0}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedNodeId,
  onSelectNode,
}: {
  node: FractalNode;
  depth: number;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.identity.id;
  const npv = node.structural_npv?.net_structural_npv;

  const toggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    },
    []
  );

  const npvClass =
    npv != null ? (npv >= 5 ? "positive" : npv >= 0 ? "marginal" : "negative") : null;

  const typeLabel = node.identity.type.replace(/_/g, " ");

  return (
    <div className={depth === 0 ? "fractal-tree__node fractal-tree__node--root" : "fractal-tree__node"}>
      <div
        className={`fractal-tree__row ${isSelected ? "fractal-tree__row--selected" : ""}`}
        onClick={() => onSelectNode(node.identity.id)}
      >
        <span className="fractal-tree__toggle" onClick={toggleExpand}>
          {hasChildren ? (expanded ? "\u25BC" : "\u25B6") : "\u00B7"}
        </span>
        <span className="badge badge--type">{typeLabel}</span>
        <span className="fractal-tree__name">{node.identity.name}</span>
        {npv != null && (
          <span className={`badge badge--${npvClass}`}>
            NPV {npv.toFixed(1)}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.identity.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
