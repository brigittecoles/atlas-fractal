// --- Financials ---

export interface Financials {
  revenue: number;
  ebitda_margin: number;
  cogs_ratio: number;
  sga_ratio: number;
  labor_percent: number;
  is_estimated: boolean;
}

// --- Extracted Document ---

export interface ExtractedDocument {
  document_id: string;
  file_name: string;
  file_type: string;
  document_type: string;
  extracted_data: {
    text: string;
    tables: string[];
    financials?: Financials;
    entities: string[];
  };
  summary: string;
  warnings: string[];
}

// --- Ownership ---

export type OwnershipType = "pe-backed" | "public" | "private" | "gov" | "non-profit";

// --- Company Profile ---

export interface CompanyProfile {
  name: string;
  gics_sector: string;
  gics_industry_group: string;
  gics_industry: string;
  gics_sub_industry: string;
  revenue: number;
  employees: number;
  ownership: OwnershipType;
  pe_sponsor?: string;
  strategic_context: string;
}

// --- Company Context ---

export interface CompanyContext {
  profile: CompanyProfile;
  documents: ExtractedDocument[];
  public_data: string[];
}
