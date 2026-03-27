"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "../../../hooks/use-atlas";

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  node_id?: string;
  message: string;
}

interface ExecutionLayer {
  layer: number;
  nodes: { node_id: string; name: string; type: string }[];
}

const PLATFORMS = [
  { id: "claude_agent_sdk", label: "Claude Agent SDK" },
];

export default function ConfigurePage() {
  const router = useRouter();
  const { callTool, loading, error } = useAtlas();

  const [platform, setPlatform] = useState("");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [executionLayers, setExecutionLayers] = useState<ExecutionLayer[]>([]);
  const [translationWarnings, setTranslationWarnings] = useState<string[]>([]);
  const [npvCoverage, setNpvCoverage] = useState<{ with_npv: number; without_npv: number } | null>(null);
  const [step, setStep] = useState<"select" | "validating" | "results">("select");

  const handlePlatformSelect = async (platformId: string) => {
    setPlatform(platformId);
    setStep("validating");

    try {
      // 1. Select target platform
      await callTool("select_target_platform", { platform: platformId });

      // 2. Validate fractal system
      const validation = (await callTool("validate_fractal_system", {})) as {
        issues: ValidationIssue[];
        npv_coverage: { with_npv: number; without_npv: number };
      };
      setValidationIssues(validation.issues || []);
      setNpvCoverage(validation.npv_coverage || null);

      // 3. Resolve dependencies
      const deps = (await callTool("resolve_dependencies", {})) as {
        execution_layers: ExecutionLayer[];
      };
      setExecutionLayers(deps.execution_layers || []);

      // 4. Translate to platform
      const translation = (await callTool("translate_to_platform", {})) as {
        warnings: string[];
      };
      setTranslationWarnings(translation.warnings || []);

      setStep("results");
    } catch {
      setStep("select");
    }
  };

  if (step === "validating") {
    return (
      <div>
        <div className="o-page-header">
          <h1>Configuring for {PLATFORMS.find((p) => p.id === platform)?.label}</h1>
        </div>
        <div className="o-loading">
          <div className="a-heartbeat" />
          <p>Validating system and resolving dependencies...</p>
        </div>
      </div>
    );
  }

  if (step === "results") {
    const errors = validationIssues.filter((i) => i.severity === "error");
    const warnings = validationIssues.filter((i) => i.severity === "warning");
    const infos = validationIssues.filter((i) => i.severity === "info");

    return (
      <div>
        <div className="o-page-header">
          <h1>Configuration Results</h1>
          <p>
            Platform: {PLATFORMS.find((p) => p.id === platform)?.label}.
            Review validation results and execution plan below.
          </p>
        </div>

        {error && <div className="o-alert o-alert--err">{error}</div>}

        {/* NPV Coverage */}
        {npvCoverage && (
          <div className="o-card" style={{ marginBottom: 16 }}>
            <div className="o-card__title">NPV Coverage</div>
            <div className="o-grid-2" style={{ marginTop: 12 }}>
              <div>
                <div className="m-field__label">With NPV Scores</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ok)" }}>
                  {npvCoverage.with_npv}
                </div>
              </div>
              <div>
                <div className="m-field__label">Without NPV Scores</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: npvCoverage.without_npv > 0 ? "var(--warn)" : "var(--text-2)" }}>
                  {npvCoverage.without_npv}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Issues */}
        <div className="o-card" style={{ marginBottom: 16 }}>
          <div className="o-card__title">
            Validation ({errors.length} errors, {warnings.length} warnings, {infos.length} info)
          </div>
          <div style={{ marginTop: 12 }}>
            {validationIssues.length === 0 ? (
              <p style={{ color: "var(--ok)", fontSize: 14 }}>
                All validation checks passed.
              </p>
            ) : (
              validationIssues.map((issue, i) => (
                <div key={i} className={`m-issue-row m-issue-row--${issue.severity}`}>
                  <span
                    className={`a-badge a-badge--${issue.severity === "error" ? "err" : issue.severity === "warning" ? "warn" : "muted"}`}
                  >
                    {issue.severity}
                  </span>
                  <div>
                    <div>{issue.message}</div>
                    {issue.node_id && (
                      <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
                        Node: {issue.node_id}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Execution Layers */}
        {executionLayers.length > 0 && (
          <div className="o-card" style={{ marginBottom: 16 }}>
            <div className="o-card__title">Execution Plan ({executionLayers.length} layers)</div>
            <div style={{ marginTop: 12 }}>
              {executionLayers.map((layer) => (
                <div key={layer.layer} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>
                    Layer {layer.layer}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {layer.nodes.map((node) => (
                      <span key={node.node_id} className="a-badge a-badge--accent">
                        {node.name} ({node.type.replace(/_/g, " ")})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Translation Warnings */}
        {translationWarnings.length > 0 && (
          <div className="o-alert o-alert--warn">
            <strong>Translation Warnings:</strong>
            <ul style={{ margin: "8px 0 0 16px" }}>
              {translationWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            className="a-btn a-btn--primary"
            disabled={errors.length > 0}
            onClick={() => router.push("/wizard/export")}
          >
            {errors.length > 0
              ? `Fix ${errors.length} error(s) before continuing`
              : "Continue to Export"}
          </button>
        </div>
      </div>
    );
  }

  // Platform selection view
  return (
    <div>
      <div className="o-page-header">
        <h1>Configure Target Platform</h1>
        <p>
          Select the platform to generate agent configurations for. ATLAS will validate
          the fractal system and translate it to platform-specific artifacts.
        </p>
      </div>

      {error && <div className="o-alert o-alert--err">{error}</div>}

      <div className="o-card">
        <div className="m-field">
          <label className="m-field__label" htmlFor="platform-select">
            Target Platform
          </label>
          <select
            id="platform-select"
            className="a-select"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Select a platform...</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="a-btn a-btn--primary"
          disabled={!platform || loading}
          onClick={() => handlePlatformSelect(platform)}
        >
          {loading ? "Configuring..." : "Configure System"}
        </button>
      </div>
    </div>
  );
}
