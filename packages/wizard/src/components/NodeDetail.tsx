"use client";

import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = Record<string, any>;

interface NodeDetailProps {
  node: AnyNode;
}

const TABS = [
  { id: "identity", label: "A. Identity" },
  { id: "purpose", label: "B. Purpose" },
  { id: "io", label: "C. I/O" },
  { id: "value_thesis", label: "D. Value Thesis" },
  { id: "runtime", label: "E. Runtime" },
  { id: "tools", label: "F. Tools/Memory" },
  { id: "npv", label: "G. Structural NPV" },
  { id: "gate", label: "H. Decomp Gate" },
  { id: "ontology", label: "I. Ontology" },
  { id: "capability", label: "J. Capability" },
  { id: "aeo", label: "K. AEO/GEO" },
] as const;

export default function NodeDetail({ node }: NodeDetailProps) {
  const [activeTab, setActiveTab] = useState<string>("identity");

  if (!node) return null;

  return (
    <div className="o-card">
      <div className="o-card__title" style={{ marginBottom: 16 }}>
        {node.identity?.name || "Node Detail"}
      </div>

      <div className="m-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`m-tab-item ${activeTab === tab.id ? "m-tab-item--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderTabContent(activeTab, node)}</div>
    </div>
  );
}

function renderTabContent(tab: string, node: AnyNode) {
  switch (tab) {
    case "identity":
      return <IdentitySection node={node} />;
    case "purpose":
      return <PurposeSection node={node} />;
    case "io":
      return <IOSection node={node} />;
    case "value_thesis":
      return <ValueThesisSection node={node} />;
    case "runtime":
      return <RuntimeSection node={node} />;
    case "tools":
      return <ToolsSection node={node} />;
    case "npv":
      return <NPVSection node={node} />;
    case "gate":
      return <GateSection node={node} />;
    case "ontology":
    case "capability":
    case "aeo":
      return <StubSection />;
    default:
      return null;
  }
}

function IdentitySection({ node }: { node: AnyNode }) {
  const id = node.identity || {};
  return (
    <div>
      <DetailField label="ID" value={id.id} />
      <DetailField label="Type" value={id.type} />
      <DetailField label="Parent Context" value={id.parent_context} />
      <DetailField label="Stopping Condition" value={id.stopping_condition} />
      {id.candidate_child_concepts?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Candidate Child Concepts</div>
          <ul className="o-detail-list">
            {id.candidate_child_concepts.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PurposeSection({ node }: { node: AnyNode }) {
  const p = node.purpose_context || {};
  return (
    <div>
      <DetailField label="Purpose" value={p.purpose} />
      <DetailField label="Domain" value={p.domain} />
      <DetailField label="Subdomain" value={p.subdomain} />
      <DetailField label="Primary Route" value={p.primary_route} />
      <DetailField label="Mad Lib" value={p.mad_lib} />
      {p.surfaces?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Surfaces</div>
          <ul className="o-detail-list">
            {p.surfaces.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {p.primary_users?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Primary Users</div>
          <ul className="o-detail-list">
            {p.primary_users.map((u: string, i: number) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IOSection({ node }: { node: AnyNode }) {
  const io = node.io || {};
  return (
    <div>
      {io.inputs?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Inputs</div>
          <ul className="o-detail-list">
            {io.inputs.map((inp: string, i: number) => (
              <li key={i}>{inp}</li>
            ))}
          </ul>
        </div>
      )}
      {io.outputs?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Outputs</div>
          {io.outputs.map((o: AnyNode, i: number) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <strong>{o.name}</strong>
              <span className="a-badge a-badge--muted" style={{ marginLeft: 8 }}>
                {o.output_id}
              </span>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
                {o.description}
              </div>
            </div>
          ))}
        </div>
      )}
      <DetailField label="Why Outputs Matter" value={io.why_outputs_matter} />
      <DetailField label="Blast Radius" value={io.blast_radius} />
      {io.downstream_consumers?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Downstream Consumers</div>
          <ul className="o-detail-list">
            {io.downstream_consumers.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ValueThesisSection({ node }: { node: AnyNode }) {
  const vt = node.output_value_thesis || {};
  const fields = ["quality", "speed", "reliability", "reuse", "governance", "productization"];
  return (
    <div>
      {fields.map((f) => (
        <DetailField key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} value={vt[f]} />
      ))}
    </div>
  );
}

function RuntimeSection({ node }: { node: AnyNode }) {
  const rt = node.runtime_shape || {};
  const listFields = ["object_types", "resolvers", "states", "triggers", "actions", "output_destinations"];
  return (
    <div>
      <DetailField label="Runtime Tier" value={rt.runtime_tier} />
      {listFields.map((field) =>
        rt[field]?.length > 0 ? (
          <div key={field} className="o-detail-section">
            <div className="o-detail-section__title">{field.replace(/_/g, " ")}</div>
            <ul className="o-detail-list">
              {rt[field].map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

function ToolsSection({ node }: { node: AnyNode }) {
  const tmp = node.tools_memory_policies || {};
  return (
    <div>
      {tmp.tools?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Tools</div>
          {tmp.tools.map((t: AnyNode, i: number) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{t.name}</strong>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>{t.description}</div>
            </div>
          ))}
        </div>
      )}
      {tmp.memory && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Memory Layers</div>
          {Object.entries(tmp.memory).map(([layer, config]) => (
            <div key={layer} style={{ padding: "4px 0" }}>
              <strong style={{ textTransform: "capitalize" }}>{layer}</strong>:{" "}
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                {(config as AnyNode).description || "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}
      {tmp.policies?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Policies</div>
          <ul className="o-detail-list">
            {tmp.policies.map((p: string, i: number) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {tmp.handoffs?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Handoffs</div>
          <ul className="o-detail-list">
            {tmp.handoffs.map((h: string, i: number) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      <DetailField label="Owner" value={tmp.owner} />
      <DetailField label="Lifecycle Status" value={tmp.lifecycle_status} />
    </div>
  );
}

function NPVSection({ node }: { node: AnyNode }) {
  const npv = node.structural_npv;
  if (!npv) return <p style={{ color: "var(--text-2)" }}>No NPV data available.</p>;

  const npvColor =
    npv.net_structural_npv >= 5
      ? "var(--trust-hi)"
      : npv.net_structural_npv >= 0
        ? "var(--trust-mid)"
        : "var(--trust-lo)";

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ok)" }}>
            {npv.total_output_value?.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase" }}>
            Output Value
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--err)" }}>
            {npv.total_structural_cost?.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase" }}>
            Structural Cost
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: npvColor }}>
            {npv.net_structural_npv?.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase" }}>
            Net NPV
          </div>
        </div>
      </div>

      <DetailField
        label="Recommendation"
        value={npv.recommendation?.toUpperCase()}
      />

      {npv.output_value_scores?.length > 0 && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Output Value Scores</div>
          {npv.output_value_scores.map((ovs: AnyNode, i: number) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{ovs.output_name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {ovs.total?.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {npv.cost_scores && (
        <div className="o-detail-section">
          <div className="o-detail-section__title">Cost Breakdown</div>
          {Object.entries(npv.cost_scores).map(([key, val]) => (
            <div key={key} className="m-npv-bar">
              <span className="m-npv-bar__label">{key.replace(/_/g, " ")}</span>
              <div className="m-npv-bar__track">
                <div
                  className="m-npv-bar__fill"
                  style={{
                    width: `${((val as number) / 5) * 100}%`,
                    background: "var(--err)",
                  }}
                />
              </div>
              <span className="m-npv-bar__value">{(val as number).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GateSection({ node }: { node: AnyNode }) {
  const gate = node.decomposition_gate;
  if (!gate?.proposed_children?.length) {
    return <p style={{ color: "var(--text-2)" }}>No decomposition decisions recorded.</p>;
  }

  return (
    <div>
      {gate.proposed_children.map((dec: AnyNode, i: number) => (
        <div key={i} className="o-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <strong>{dec.concept}</strong>
            <span className="a-badge a-badge--accent">{dec.best_form}</span>
            <span className="a-badge a-badge--muted">{dec.action}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
            {dec.rationale}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
            <span>Runtime: {dec.distinct_runtime_behavior ? "Yes" : "No"}</span>
            <span>Outputs: {dec.distinct_outputs ? "Yes" : "No"}</span>
            <span>Reuse: {dec.distinct_reuse ? "Yes" : "No"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StubSection() {
  return (
    <div
      style={{
        padding: "40px 0",
        textAlign: "center",
        color: "var(--text-2)",
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 600 }}>Coming Soon</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>
        This section will be available in a future release.
      </p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-2)" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{String(value)}</div>
    </div>
  );
}
