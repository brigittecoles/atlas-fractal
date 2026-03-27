"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResult = Record<string, any>;

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
      <div className="detail-section__title" style={{ marginBottom: 12 }}>
        Demoted Concepts ({demoted.length})
      </div>
      {demoted.map((d, i) => {
        const npvClass =
          d.npv_score >= 5 ? "positive" : d.npv_score >= 0 ? "marginal" : "negative";

        return (
          <div key={i} className="demoted-item">
            <div className="demoted-item__info">
              <div className="demoted-item__name">
                {d.concept}
                <span className="badge badge--type" style={{ marginLeft: 8 }}>
                  {d.demoted_to}
                </span>
                <span className={`badge badge--${npvClass}`} style={{ marginLeft: 8 }}>
                  NPV {d.npv_score.toFixed(1)}
                </span>
              </div>
              <div className="demoted-item__meta">
                Parent: {d.parent_node_id} &mdash; {d.rationale}
              </div>
            </div>
            {d.can_override && (
              <button
                className="btn btn--secondary btn--small"
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
