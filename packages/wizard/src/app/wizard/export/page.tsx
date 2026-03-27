"use client";

import { useState, useEffect } from "react";
import { useAtlas } from "../../../hooks/use-atlas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResult = Record<string, any>;

interface Artifact {
  filename: string;
  category: string;
  content: string;
  size?: number;
}

interface ExportResult {
  artifacts: Artifact[];
  summary: {
    company_name: string;
    total_nodes: number;
    total_demoted: number;
    total_npv: number;
    platform: string;
  };
}

export default function ExportPage() {
  const { callTool, loading, error } = useAtlas();

  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string | null>("Preparing export package...");
  const [previewArtifact, setPreviewArtifact] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingPhase("Preparing export package...");
        const result = (await callTool("export_package", {})) as ExportResult;
        if (cancelled) return;
        setExportResult(result);
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

  const handleDownload = () => {
    if (!exportResult) return;

    // Create a combined JSON blob for download
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-fractal-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loadingPhase) {
    return (
      <div>
        <div className="page-header">
          <h1>Export Package</h1>
        </div>
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  if (!exportResult) {
    return (
      <div>
        <div className="page-header">
          <h1>Export Package</h1>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <p style={{ color: "var(--color-text-secondary)" }}>
          No export available. Please complete the Configure step first.
        </p>
      </div>
    );
  }

  const { artifacts, summary } = exportResult;
  const previewContent = previewArtifact
    ? artifacts.find((a) => a.filename === previewArtifact)?.content
    : null;

  return (
    <div>
      <div className="page-header">
        <h1>Export Package</h1>
        <p>
          Your ATLAS-Fractal agent system is ready for deployment. Download the
          configuration package or preview individual artifacts below.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Summary Stats */}
      {summary && (
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="summary-stat__value">{summary.company_name}</div>
            <div className="summary-stat__label">Company</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat__value">{summary.total_nodes}</div>
            <div className="summary-stat__label">Total Nodes</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat__value">{summary.total_demoted}</div>
            <div className="summary-stat__label">Demoted</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat__value">
              {summary.total_npv?.toFixed(1) ?? "N/A"}
            </div>
            <div className="summary-stat__label">Total NPV</div>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn--primary" onClick={handleDownload}>
          Download Package
        </button>
      </div>

      {/* Artifact List */}
      <div className="card">
        <div className="card__title">
          Artifacts ({artifacts.length})
        </div>
        <div style={{ marginTop: 12 }}>
          {artifacts.map((artifact) => {
            const size = artifact.size ?? artifact.content?.length ?? 0;
            const sizeLabel =
              size > 1024
                ? `${(size / 1024).toFixed(1)} KB`
                : `${size} B`;

            return (
              <div key={artifact.filename} className="artifact-item">
                <div>
                  <div className="artifact-item__name">{artifact.filename}</div>
                  <div className="artifact-item__meta">
                    <span className="badge badge--info">{artifact.category}</span>
                    <span style={{ marginLeft: 8 }}>{sizeLabel}</span>
                  </div>
                </div>
                <button
                  className="btn btn--secondary btn--small"
                  onClick={() =>
                    setPreviewArtifact(
                      previewArtifact === artifact.filename ? null : artifact.filename
                    )
                  }
                >
                  {previewArtifact === artifact.filename ? "Hide" : "Preview"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Panel */}
      {previewContent && (
        <div style={{ marginTop: 16 }}>
          <div className="detail-section__title" style={{ marginBottom: 8 }}>
            Preview: {previewArtifact}
          </div>
          <div className="code-preview">{previewContent}</div>
        </div>
      )}
    </div>
  );
}
