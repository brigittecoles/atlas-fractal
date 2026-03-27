"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "../../../hooks/use-atlas";

interface ExtractedDoc {
  document_id: string;
  file_name: string;
  document_type: string;
  summary: string;
  warnings: string[];
  extracted_data: {
    text: string;
    financials?: {
      revenue: number;
      ebitda_margin: number;
      cogs_ratio: number;
      sga_ratio: number;
      labor_percent: number;
      is_estimated: boolean;
    };
    entities: string[];
  };
}

interface EnrichResult {
  profile: {
    name: string;
    gics_sector: string;
    gics_industry_group: string;
    gics_industry: string;
    gics_sub_industry: string;
    revenue: number;
    employees: number;
    ownership: string;
    strategic_context: string;
  };
  documents: ExtractedDoc[];
}

const ACCEPTED_TYPES = ".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt";

export default function IntakePage() {
  const router = useRouter();
  const { callTool, loading, error } = useAtlas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [strategicContext, setStrategicContext] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "results">("form");
  const [processStatus, setProcessStatus] = useState("");
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allWarnings, setAllWarnings] = useState<string[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = async () => {
    if (!companyName.trim()) return;

    setStep("processing");
    const warnings: string[] = [];

    try {
      // 1. Create session
      setProcessStatus("Creating session...");
      const session = (await callTool("create_session", {
        company_name: companyName.trim(),
        strategic_context: strategicContext.trim(),
      })) as { session_id: string };
      setSessionId(session.session_id);

      // 2. Ingest each document
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessStatus(`Ingesting document ${i + 1}/${files.length}: ${file.name}...`);

        const base64 = await fileToBase64(file);
        const doc = (await callTool("ingest_document", {
          session_id: session.session_id,
          file_name: file.name,
          file_type: getFileExtension(file.name),
          file_content: base64,
        })) as ExtractedDoc;

        if (doc.warnings?.length) {
          warnings.push(...doc.warnings.map((w) => `${file.name}: ${w}`));
        }
      }

      // 3. Enrich company profile
      setProcessStatus("Enriching company profile...");
      const enriched = (await callTool("enrich_company_profile", {
        session_id: session.session_id,
      })) as EnrichResult;

      setAllWarnings(warnings);
      setResult(enriched);
      setStep("results");
    } catch {
      setStep("form");
    }
  };

  if (step === "processing") {
    return (
      <div>
        <div className="page-header">
          <h1>Analyzing Your Company</h1>
        </div>
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>{processStatus}</p>
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    const profile = result.profile;
    const financials = result.documents
      .map((d) => d.extracted_data.financials)
      .find((f) => f);
    const allEntities = [
      ...new Set(result.documents.flatMap((d) => d.extracted_data.entities)),
    ];

    return (
      <div>
        <div className="page-header">
          <h1>Intake Complete</h1>
          <p>Review the extracted data below, then continue to process selection.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {allWarnings.length > 0 && (
          <div className="warning-banner">
            <strong>Warnings from extraction:</strong>
            <ul style={{ margin: "8px 0 0 16px" }}>
              {allWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <div className="card__title">Company Profile</div>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <div className="form-label">Company</div>
              <div>{profile.name}</div>
            </div>
            <div>
              <div className="form-label">Industry</div>
              <div>{profile.gics_industry || profile.gics_sector || "Unknown"}</div>
            </div>
            <div>
              <div className="form-label">Revenue</div>
              <div>{profile.revenue ? `$${(profile.revenue / 1e6).toFixed(0)}M` : "Unknown"}</div>
            </div>
            <div>
              <div className="form-label">Employees</div>
              <div>{profile.employees || "Unknown"}</div>
            </div>
            <div>
              <div className="form-label">Ownership</div>
              <div>{profile.ownership || "Unknown"}</div>
            </div>
            <div>
              <div className="form-label">GICS Sub-Industry</div>
              <div>{profile.gics_sub_industry || "Unknown"}</div>
            </div>
          </div>
        </div>

        {financials && (
          <div className="card">
            <div className="card__title">Financials</div>
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div>
                <div className="form-label">Revenue</div>
                <div>${(financials.revenue / 1e6).toFixed(0)}M</div>
              </div>
              <div>
                <div className="form-label">EBITDA Margin</div>
                <div>{(financials.ebitda_margin * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="form-label">COGS Ratio</div>
                <div>{(financials.cogs_ratio * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="form-label">SG&A Ratio</div>
                <div>{(financials.sga_ratio * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="form-label">Labor %</div>
                <div>{(financials.labor_percent * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="form-label">Estimated?</div>
                <div>{financials.is_estimated ? "Yes (industry avg)" : "No (from docs)"}</div>
              </div>
            </div>
          </div>
        )}

        {allEntities.length > 0 && (
          <div className="card">
            <div className="card__title">Entities Detected</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {allEntities.map((e, i) => (
                <span key={i} className="badge badge--type">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card__title">Documents Processed</div>
          {result.documents.map((doc) => (
            <div key={doc.document_id} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <strong>{doc.file_name}</strong>
              <span className="badge badge--info" style={{ marginLeft: 8 }}>
                {doc.document_type}
              </span>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                {doc.summary}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn--primary"
            onClick={() => router.push("/wizard/processes")}
          >
            Continue to Processes
          </button>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div>
      <div className="page-header">
        <h1>Company Intake</h1>
        <p>
          Enter your company details and upload financial or strategic documents. ATLAS
          will analyze them to recommend the best processes for AI agent automation.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="form-group">
          <label className="form-label" htmlFor="company-name">
            Company Name
          </label>
          <input
            id="company-name"
            className="form-input"
            type="text"
            placeholder="e.g. Acme Healthcare Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="strategic-context">
            Strategic Context
          </label>
          <textarea
            id="strategic-context"
            className="form-textarea"
            placeholder="Describe the company's strategic priorities, recent initiatives, market position, or any context relevant to agent automation..."
            value={strategicContext}
            onChange={(e) => setStrategicContext(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Documents</label>
          <div
            className={`file-dropzone ${dragActive ? "file-dropzone--active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <p className="file-dropzone__text">
              Drop files here or click to browse
            </p>
            <p className="file-dropzone__hint">
              PDF, Excel, Word, CSV, TXT accepted
            </p>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius)",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{file.name}</span>
                  <button
                    className="btn btn--secondary btn--small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn--primary"
          disabled={!companyName.trim() || loading}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : "Analyze Company"}
        </button>
      </div>
    </div>
  );
}

// --- Helpers ---

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const extensionMap: Record<string, string> = {
    pdf: "pdf", xlsx: "xlsx", xls: "xlsx", docx: "docx", doc: "docx",
    csv: "csv", txt: "txt",
  };
  return extensionMap[ext] || ext;
}
