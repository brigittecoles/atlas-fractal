"use client";

interface DemotedConcept {
  concept: string;
  parent_node_id: string;
  demoted_to: string;
  rationale: string;
  npv_score: number;
  can_override: boolean;
}

interface DemotedListProps {
  demoted: DemotedConcept[];
  onPromote: (concept: DemotedConcept) => void;
  promoting: string | null;
}

export default function DemotedList({ demoted, onPromote, promoting }: DemotedListProps) {
  if (!demoted || demoted.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <div className="o-detail-section__title" style={{ marginBottom: 12 }}>
        Demoted Concepts ({demoted.length})
      </div>
      {demoted.map((d, i) => {
        const npvClass =
          d.npv_score >= 5 ? "ok" : d.npv_score >= 0 ? "warn" : "err";

        return (
          <div key={i} className="m-demoted-row">
            <div className="m-demoted-row__info">
              <div className="m-demoted-row__name">
                {d.concept}
                <span className="a-badge a-badge--accent" style={{ marginLeft: 8 }}>
                  {d.demoted_to}
                </span>
                <span className={`a-badge a-badge--${npvClass}`} style={{ marginLeft: 8 }}>
                  NPV {d.npv_score.toFixed(1)}
                </span>
              </div>
              <div className="m-demoted-row__meta">
                Parent: {d.parent_node_id} &mdash; {d.rationale}
              </div>
            </div>
            {d.can_override && (
              <button
                className="a-btn a-btn--secondary a-btn--sm"
                disabled={promoting === d.concept}
                onClick={() => onPromote(d)}
              >
                {promoting === d.concept ? "Promoting..." : "Promote to Instance"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
