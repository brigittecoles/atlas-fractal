// packages/atlas-agent/src/data/gics.ts

export type ApqcIndustryKey = "healthcare" | "financial" | "manufacturing" | "technology" | "energy" | "insurance";

const VALID_KEYS: readonly ApqcIndustryKey[] = ["healthcare", "financial", "manufacturing", "technology", "energy", "insurance"];

const GICS_CODE_MAP: Record<string, ApqcIndustryKey> = {
  "10": "energy", "15": "manufacturing", "20": "manufacturing",
  "25": "technology", "30": "manufacturing", "35": "healthcare",
  "40": "financial", "45": "technology", "50": "technology",
  "55": "energy", "60": "financial",
};

const INDUSTRY_ALIASES: Record<string, ApqcIndustryKey> = {
  "health care": "healthcare", "health care equipment & services": "healthcare",
  "health care equipment": "healthcare", "pharmaceuticals, biotechnology & life sciences": "healthcare",
  "pharma": "healthcare", "biotech": "healthcare", "medical": "healthcare",
  financials: "financial", banks: "financial", banking: "financial",
  "diversified financials": "financial", "real estate": "financial",
  insurance: "insurance",
  industrials: "manufacturing", "capital goods": "manufacturing", materials: "manufacturing",
  "consumer staples": "manufacturing", automotive: "manufacturing",
  "information technology": "technology", "software & services": "technology",
  "technology hardware & equipment": "technology", "semiconductors & semiconductor equipment": "technology",
  "communication services": "technology", "consumer discretionary": "technology", telecom: "technology",
  utilities: "energy", "oil & gas": "energy", oil: "energy",
};

export function normalizeIndustry(raw: string): ApqcIndustryKey {
  const trimmed = raw.trim();
  if (GICS_CODE_MAP[trimmed]) return GICS_CODE_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  if ((VALID_KEYS as readonly string[]).includes(lower)) return lower as ApqcIndustryKey;
  if (INDUSTRY_ALIASES[lower]) return INDUSTRY_ALIASES[lower];
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) return key;
  }
  return "manufacturing";
}
