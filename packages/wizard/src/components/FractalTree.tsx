"use client";

import { useState, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FractalNode = Record<string, any>;

interface FractalTreeProps {
  nodes: FractalNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export default function FractalTree({ nodes, selectedNodeId, onSelectNode }: FractalTreeProps) {
  return (
    <div className="o-fractal-tree">
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
    npv != null ? (npv >= 5 ? "ok" : npv >= 0 ? "warn" : "err") : null;

  const typeLabel = node.identity.type.replace(/_/g, " ");

  return (
    <div className={depth === 0 ? "o-fractal-tree__node o-fractal-tree__node--root" : "o-fractal-tree__node"}>
      <div
        className={`o-fractal-tree__row ${isSelected ? "o-fractal-tree__row--selected" : ""}`}
        onClick={() => onSelectNode(node.identity.id)}
      >
        <span className="o-fractal-tree__toggle" onClick={toggleExpand}>
          {hasChildren ? (expanded ? "\u25BC" : "\u25B6") : "\u00B7"}
        </span>
        <span className="a-badge a-badge--accent">{typeLabel}</span>
        <span className="o-fractal-tree__name">{node.identity.name}</span>
        {npv != null && (
          <span className={`a-badge a-badge--${npvClass}`}>
            NPV {npv.toFixed(1)}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child: FractalNode) => (
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
