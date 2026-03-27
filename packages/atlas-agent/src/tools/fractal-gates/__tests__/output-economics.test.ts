import { describe, it, expect } from "vitest";
import { handleScoreOutputEconomics } from "../output-economics.js";
import type { OutputEconInput } from "../output-economics.js";

describe("handleScoreOutputEconomics", () => {
  it("valid inputs produce catalog entries and portfolio value", () => {
    const input: OutputEconInput = {
      outputs: [
        {
          name: "Budget Report",
          owner_node_id: "agent-001",
          consumers: ["CFO", "Board"],
          value_type: "revenue_bearing",
          importance: 4,
          quality_criteria: ["accuracy", "timeliness"],
          risk_sensitivity: "medium",
          blast_radius: "department",
        },
        {
          name: "Compliance Audit",
          owner_node_id: "agent-002",
          consumers: ["Legal"],
          value_type: "governance_sensitive",
          importance: 5,
          quality_criteria: ["completeness"],
          risk_sensitivity: "critical",
          blast_radius: "organization",
        },
      ],
    };

    const result = handleScoreOutputEconomics(input);
    expect(result.catalog_entries).toHaveLength(2);
    expect(result.total_portfolio_value).toBe(9); // 4 + 5
    expect(result.catalog_entries[0].name).toBe("Budget Report");
  });

  it("invalid value_type produces warning in catalog entry", () => {
    const input: OutputEconInput = {
      outputs: [
        {
          name: "Bad Output",
          owner_node_id: "agent-001",
          consumers: [],
          value_type: "invalid_type",
          importance: 3,
          quality_criteria: [],
          risk_sensitivity: "low",
          blast_radius: "none",
        },
      ],
    };

    const result = handleScoreOutputEconomics(input);
    expect(result.catalog_entries).toHaveLength(1);
    expect(result.catalog_entries[0].warnings).toBeDefined();
    expect(result.catalog_entries[0].warnings!.some((w: string) => w.includes("value_type"))).toBe(true);
  });

  it("flags high-risk outputs", () => {
    const input: OutputEconInput = {
      outputs: [
        {
          name: "Critical Report",
          owner_node_id: "agent-001",
          consumers: ["CEO"],
          value_type: "mission_critical",
          importance: 5,
          quality_criteria: ["accuracy"],
          risk_sensitivity: "critical",
          blast_radius: "organization",
        },
        {
          name: "High Risk Report",
          owner_node_id: "agent-002",
          consumers: ["CTO"],
          value_type: "trust_bearing",
          importance: 4,
          quality_criteria: ["completeness"],
          risk_sensitivity: "high",
          blast_radius: "department",
        },
        {
          name: "Low Risk Report",
          owner_node_id: "agent-003",
          consumers: ["Team"],
          value_type: "reusable_upstream",
          importance: 2,
          quality_criteria: [],
          risk_sensitivity: "low",
          blast_radius: "team",
        },
      ],
    };

    const result = handleScoreOutputEconomics(input);
    expect(result.high_risk_outputs).toContain("Critical Report");
    expect(result.high_risk_outputs).toContain("High Risk Report");
    expect(result.high_risk_outputs).not.toContain("Low Risk Report");
  });
});
