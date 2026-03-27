"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "../../../hooks/use-atlas";

interface ProcessItem {
  process_id: string;
  process_name: string;
  l1_id: string;
  l1_name: string;
  ebitda_score: number;
  description?: string;
}

interface ValueChainMapping {
  porter_activity: string;
  processes: {
    process_id: string;
    process_name: string;
    rationale: string;
  }[];
}

interface EbitdaEstimate {
  total_savings: number;
  by_process: {
    process_id: string;
    process_name: string;
    estimated_savings: number;
    confidence: string;
  }[];
}

export default function ProcessesPage() {
  const router = useRouter();
  const { callTool, loading, error } = useAtlas();

  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [vcMappings, setVcMappings] = useState<ValueChainMapping[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ebitdaEstimate, setEbitdaEstimate] = useState<EbitdaEstimate | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string | null>("Loading processes...");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoadingPhase("Searching processes for your industry...");
        const procs = (await callTool("search_processes", {})) as {
          processes: ProcessItem[];
        };
        if (cancelled) return;
        setProcesses(procs.processes || []);

        setLoadingPhase("Mapping to value chain...");
        const mapping = (await callTool("map_to_value_chain", {})) as {
          mappings: ValueChainMapping[];
        };
        if (cancelled) return;
        setVcMappings(mapping.mappings || []);

        setLoadingPhase(null);
      } catch {
        if (!cancelled) setLoadingPhase(null);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleProcess = useCallback((processId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(processId)) next.delete(processId);
      else next.add(processId);
      return next;
    });
    setEbitdaEstimate(null);
  }, []);

  const handleEstimateImpact = async () => {
    if (selected.size === 0) return;
    const selectedIds = Array.from(selected);
    const result = (await callTool("estimate_ebitda_impact", {
      process_ids: selectedIds,
    })) as EbitdaEstimate;
    setEbitdaEstimate(result);
  };

  const handleContinue = async () => {
    const selectedProcesses = processes
      .filter((p) => selected.has(p.process_id))
      .map((p) => {
        const vcMap = vcMappings.find((m) =>
          m.processes.some((mp) => mp.process_id === p.process_id)
        );
        return {
          process_id: p.process_id,
          process_name: p.process_name,
          l1_id: p.l1_id,
          l1_name: p.l1_name,
          porter_activity: vcMap?.porter_activity || "unknown",
          client_justification: "",
          ebitda_score: p.ebitda_score,
        };
      });

    // Store selection in localStorage for the design page
    localStorage.setItem("atlas-fractal-selected-processes", JSON.stringify(selectedProcesses));
    router.push("/wizard/design");
  };

  if (loadingPhase) {
    return (
      <div>
        <div className="o-page-header">
          <h1>Process Selection</h1>
        </div>
        <div className="o-loading">
          <div className="a-heartbeat" />
          <p>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  // Group processes by value chain area
  const processMap = new Map(processes.map((p) => [p.process_id, p]));
  const grouped = vcMappings.map((vc) => ({
    activity: vc.porter_activity,
    processes: vc.processes
      .map((mp) => ({
        ...mp,
        ...(processMap.get(mp.process_id) || {}),
      }))
      .filter((p) => p.process_name),
  }));

  // Ungrouped processes (not in any value chain mapping)
  const mappedIds = new Set(vcMappings.flatMap((m) => m.processes.map((p) => p.process_id)));
  const ungrouped = processes.filter((p) => !mappedIds.has(p.process_id));

  return (
    <div>
      <div className="o-page-header">
        <h1>Process Selection</h1>
        <p>
          Select the business processes to automate with AI agents. Processes are grouped
          by Porter Value Chain activity. EBITDA scores reflect estimated impact.
        </p>
      </div>

      {error && <div className="o-alert o-alert--err">{error}</div>}

      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>
          {selected.size} of {processes.length} selected
        </span>
        <button
          className="a-btn a-btn--secondary a-btn--sm"
          disabled={selected.size === 0 || loading}
          onClick={handleEstimateImpact}
        >
          {loading ? "Estimating..." : "Estimate Impact"}
        </button>
      </div>

      {ebitdaEstimate && (
        <div className="o-card" style={{ marginBottom: 24 }}>
          <div className="o-card__title">
            Estimated EBITDA Impact: ${(ebitdaEstimate.total_savings / 1e6).toFixed(1)}M
          </div>
          {ebitdaEstimate.by_process.map((bp) => (
            <div key={bp.process_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span>{bp.process_name}</span>
              <span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  ${(bp.estimated_savings / 1e6).toFixed(2)}M
                </span>
                <span className={`a-badge a-badge--${bp.confidence === "high" ? "ok" : bp.confidence === "medium" ? "warn" : "err"}`} style={{ marginLeft: 8 }}>
                  {bp.confidence}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.activity} className="o-vc-group">
          <div className="o-vc-group__header">{group.activity}</div>
          {group.processes.map((proc) => (
            <ProcessRow
              key={proc.process_id}
              processId={proc.process_id}
              name={proc.process_name}
              rationale={proc.rationale}
              ebitdaScore={(proc as ProcessItem & { rationale: string }).ebitda_score}
              checked={selected.has(proc.process_id)}
              onToggle={toggleProcess}
            />
          ))}
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="o-vc-group">
          <div className="o-vc-group__header">Other Processes</div>
          {ungrouped.map((proc) => (
            <ProcessRow
              key={proc.process_id}
              processId={proc.process_id}
              name={proc.process_name}
              ebitdaScore={proc.ebitda_score}
              checked={selected.has(proc.process_id)}
              onToggle={toggleProcess}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <button
          className="a-btn a-btn--primary"
          disabled={selected.size === 0 || loading}
          onClick={handleContinue}
        >
          Continue to Design
        </button>
      </div>
    </div>
  );
}

function ProcessRow({
  processId,
  name,
  rationale,
  ebitdaScore,
  checked,
  onToggle,
}: {
  processId: string;
  name: string;
  rationale?: string;
  ebitdaScore?: number;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const scoreClass =
    ebitdaScore != null
      ? ebitdaScore >= 4
        ? "ok"
        : ebitdaScore >= 2.5
          ? "warn"
          : "err"
      : "muted";

  return (
    <label className="m-check-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(processId)}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{name}</div>
        {rationale && (
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
            {rationale}
          </div>
        )}
      </div>
      {ebitdaScore != null && (
        <span className={`a-badge a-badge--${scoreClass}`}>
          {ebitdaScore.toFixed(1)}
        </span>
      )}
    </label>
  );
}
