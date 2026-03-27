import { apqcProcesses, apqcL1Categories, type APQCProcess } from "../data/apqc.js";
import { porterActivities } from "../data/porter.js";
import { normalizeIndustry } from "../data/gics.js";

export interface SearchProcessesInput {
  industry: string;
  keywords?: string[];
  type?: "operating" | "support";
}

export function handleSearchProcesses(input: SearchProcessesInput): {
  processes: Array<{
    id: string;
    name: string;
    l1_id: string;
    l1_name: string;
    type: string;
    value_proposition: string;
    ebitda_est_impact_pct: number;
  }>;
  total_count: number;
} {
  const industry = normalizeIndustry(input.industry);
  const filtered = apqcProcesses.filter((p) => {
    // Must have tech stack for this industry
    if (!p.tech_stacks[industry]) return false;
    // Type filter
    if (input.type && p.type !== input.type) return false;
    // Keyword filter — match against name, value_proposition, and work_products
    if (input.keywords && input.keywords.length > 0) {
      const searchText = [p.name, p.value_proposition, ...p.work_products]
        .join(" ")
        .toLowerCase();
      return input.keywords.some((kw) => searchText.includes(kw.toLowerCase()));
    }
    return true;
  });

  return {
    processes: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      l1_id: p.l1_id,
      l1_name: p.l1_name,
      type: p.type,
      value_proposition: p.value_proposition,
      ebitda_est_impact_pct: p.ebitda.est_impact_pct,
    })),
    total_count: filtered.length,
  };
}

export function handleGetProcessDetail(processId: string): APQCProcess | null {
  return apqcProcesses.find((p) => p.id === processId) ?? null;
}

/**
 * Returns reference data for mapping APQC L1 categories to Porter value chain activities.
 * These are NON-PRESCRIPTIVE suggestions — Claude should reason about the specific client
 * context to determine actual mappings.
 */
export function handleMapToValueChain(_processIds: string[]) {
  return {
    porter_activities: porterActivities,
    apqc_l1_categories: apqcL1Categories,
    reference_mappings: apqcL1Categories.map((l1) => ({
      l1_id: l1.id,
      l1_name: l1.name,
      typical_porter_activities: getTypicalPorterActivities(l1.id),
    })),
  };
}

/**
 * Returns common (non-prescriptive) L1 -> Porter activity associations.
 * These are reference suggestions for Claude to reason with, NOT hardcoded client mappings.
 */
function getTypicalPorterActivities(l1Id: string): string[] {
  const mapping: Record<string, string[]> = {
    "1.0": ["Firm Infrastructure"],                                          // Vision & Strategy
    "2.0": ["Technology Development", "Operations"],                         // Develop Products & Services
    "3.0": ["Marketing & Sales"],                                            // Market & Sell
    "4.0": ["Inbound Logistics", "Operations", "Outbound Logistics"],        // Deliver Physical Products
    "5.0": ["Operations", "Service"],                                        // Deliver Services
    "6.0": ["Service"],                                                      // Manage Customer Service
    "7.0": ["Human Resource Management"],                                    // Human Capital
    "8.0": ["Technology Development"],                                       // Manage IT
    "9.0": ["Firm Infrastructure"],                                          // Financial Resources
    "10.0": ["Firm Infrastructure", "Procurement"],                          // Acquire & Manage Assets
    "11.0": ["Firm Infrastructure"],                                         // Risk, Compliance, Resiliency
    "12.0": ["Procurement", "Firm Infrastructure"],                          // External Relationships
    "13.0": ["Firm Infrastructure", "Technology Development"],               // Business Capabilities
  };
  return mapping[l1Id] ?? ["Firm Infrastructure"];
}
