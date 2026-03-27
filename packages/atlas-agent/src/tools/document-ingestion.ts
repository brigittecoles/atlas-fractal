import { randomUUID } from "node:crypto";
import type {
  ExtractedDocument,
  CompanyProfile,
  Financials,
} from "../types/index.js";
import type { SessionStore } from "../session/index.js";

// -- Supported file types --

const SUPPORTED_TYPES = ["pdf", "xlsx", "docx", "csv", "txt"] as const;
type SupportedFileType = (typeof SUPPORTED_TYPES)[number];

function isSupportedType(t: string): t is SupportedFileType {
  return (SUPPORTED_TYPES as readonly string[]).includes(t);
}

// -- Input / output types --

export interface IngestDocumentInput {
  session_id: string;
  file_name: string;
  file_content: string; // base64 encoded
  file_type: string;
  document_type?: "pl" | "strategy" | "org_chart" | "general";
}

export interface IngestDocumentResult {
  document_id: string;
  extracted_data: {
    text: string;
    tables: Record<string, unknown>[];
    financials?: Financials;
    entities: string[];
  };
  summary: string;
  warnings: string[];
}

export interface IngestDocumentError {
  error: "unsupported_format" | "unreadable" | "empty_content";
  message: string;
  supported?: string[];
}

export interface SummarizeDocumentResult {
  summary: string;
  key_findings: string[];
}

export interface SummarizeDocumentError {
  error: "not_found" | "session_not_found";
  message: string;
}

export interface EnrichProfileResult {
  profile: Partial<CompanyProfile>;
  financials?: Financials;
  entities: string[];
  document_count: number;
}

export interface EnrichProfileError {
  error: "no_documents" | "session_not_found";
  message: string;
}

// -- Parsers --

async function parsePdf(buffer: Buffer): Promise<{ text: string; tables: Record<string, unknown>[] }> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return { text: data.text || "", tables: [] };
  } catch {
    return { text: "", tables: [] };
  }
}

function parseExcel(buffer: Buffer): { text: string; tables: Record<string, unknown>[] } {
  try {
    const XLSX = require("xlsx") as typeof import("xlsx");
    const wb = XLSX.read(buffer);
    const tables: Record<string, unknown>[] = [];
    let text = "";

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      tables.push(...rows);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += `[Sheet: ${sheetName}]\n${csv}\n\n`;
    }

    return { text: text.trim(), tables };
  } catch {
    return { text: "", tables: [] };
  }
}

async function parseWord(buffer: Buffer): Promise<{ text: string; tables: Record<string, unknown>[] }> {
  try {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value || "", tables: [] };
  } catch {
    return { text: "", tables: [] };
  }
}

function parseCsv(text: string): { text: string; tables: Record<string, unknown>[] } {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { text, tables: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const tables: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    tables.push(row);
  }

  return { text, tables };
}

function parseTxt(text: string): { text: string; tables: Record<string, unknown>[] } {
  return { text, tables: [] };
}

// -- Entity extraction (simple heuristic) --

function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  const properNounRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match: RegExpExecArray | null;
  while ((match = properNounRegex.exec(text)) !== null) {
    entities.add(match[1]);
  }
  const acronymRegex = /\b([A-Z]{2,})\b/g;
  while ((match = acronymRegex.exec(text)) !== null) {
    entities.add(match[1]);
  }
  return Array.from(entities);
}

// -- Financials extraction (simple heuristic from tables/text) --

function extractFinancials(
  tables: Record<string, unknown>[],
  text: string
): Financials | undefined {
  const metricMap = new Map<string, number>();

  for (const row of tables) {
    const keys = Object.keys(row);
    if (keys.length >= 2) {
      const metricKey = String(row[keys[0]] ?? "").toLowerCase();
      const value = parseFloat(String(row[keys[1]] ?? ""));
      if (!isNaN(value)) {
        metricMap.set(metricKey, value);
      }
    }
  }

  const revenue = metricMap.get("revenue");
  const ebitdaMargin = metricMap.get("ebitda margin") ?? metricMap.get("ebitda_margin");
  const cogsRatio = metricMap.get("cogs ratio") ?? metricMap.get("cogs_ratio");
  const sgaRatio = metricMap.get("sga ratio") ?? metricMap.get("sga_ratio");
  const laborPercent = metricMap.get("labor percent") ?? metricMap.get("labor_percent");

  if (revenue !== undefined || ebitdaMargin !== undefined) {
    return {
      revenue: revenue ?? 0,
      ebitda_margin: ebitdaMargin ?? 0,
      cogs_ratio: cogsRatio ?? 0,
      sga_ratio: sgaRatio ?? 0,
      labor_percent: laborPercent ?? 0,
      is_estimated: true,
    };
  }

  const revenueMatch = text.match(/revenue[:\s]*\$?([\d,.]+)\s*(m|million|b|billion)?/i);
  if (revenueMatch) {
    let rev = parseFloat(revenueMatch[1].replace(/,/g, ""));
    const unit = (revenueMatch[2] ?? "").toLowerCase();
    if (unit === "m" || unit === "million") rev *= 1_000_000;
    if (unit === "b" || unit === "billion") rev *= 1_000_000_000;

    const marginMatch = text.match(/ebitda\s*margin[:\s]*([\d.]+)%?/i);
    const margin = marginMatch ? parseFloat(marginMatch[1]) / 100 : 0;

    return {
      revenue: rev,
      ebitda_margin: margin,
      cogs_ratio: 0,
      sga_ratio: 0,
      labor_percent: 0,
      is_estimated: true,
    };
  }

  return undefined;
}

// -- Generate summary --

function generateSummary(text: string, fileName: string): string {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  if (sentences.length === 0) {
    return `Document: ${fileName} (no extractable content)`;
  }

  const preview = sentences.slice(0, 3).join(" ");
  return preview.length > 300 ? preview.slice(0, 297) + "..." : preview;
}

// -- Tool handlers --

export async function handleIngestDocument(
  input: IngestDocumentInput,
  store: SessionStore
): Promise<IngestDocumentResult | IngestDocumentError> {
  // Validate file type
  if (!isSupportedType(input.file_type)) {
    return {
      error: "unsupported_format",
      message: `File type "${input.file_type}" is not supported.`,
      supported: [...SUPPORTED_TYPES],
    };
  }

  // Decode base64
  const buffer = Buffer.from(input.file_content, "base64");

  // Check for empty content
  if (buffer.length === 0) {
    return {
      error: "unreadable",
      message: "File content is empty.",
    };
  }

  // Parse based on type
  const warnings: string[] = [];
  let parsed: { text: string; tables: Record<string, unknown>[] };

  try {
    switch (input.file_type) {
      case "pdf":
        parsed = await parsePdf(buffer);
        break;
      case "xlsx":
        parsed = parseExcel(buffer);
        break;
      case "docx":
        parsed = await parseWord(buffer);
        break;
      case "csv":
        parsed = parseCsv(buffer.toString("utf-8"));
        break;
      case "txt":
        parsed = parseTxt(buffer.toString("utf-8"));
        break;
      default:
        parsed = { text: "", tables: [] };
    }
  } catch (err) {
    warnings.push(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
    parsed = { text: "", tables: [] };
  }

  if (parsed.text.length === 0 && parsed.tables.length === 0) {
    warnings.push("No content could be extracted from the file.");
  }

  // Extract entities
  const entities = extractEntities(parsed.text);

  // Extract financials for P&L documents
  const documentType = input.document_type ?? "general";
  const financials =
    documentType === "pl" ? extractFinancials(parsed.tables, parsed.text) : undefined;

  // Build document
  const documentId = randomUUID();
  const summary = generateSummary(parsed.text, input.file_name);

  const doc: ExtractedDocument = {
    document_id: documentId,
    file_name: input.file_name,
    file_type: input.file_type,
    document_type: documentType,
    extracted_data: {
      text: parsed.text,
      tables: parsed.tables,
      financials,
      entities,
    },
    summary,
    warnings,
  };

  // Store in session -- initialize company_context if null
  const session = store.get(input.session_id);
  if (session) {
    if (!session.company_context) {
      session.company_context = {
        profile: {
          name: "",
          gics_sector: "",
          gics_industry_group: "",
          gics_industry: "",
          gics_sub_industry: "",
          revenue: 0,
          employees: 0,
          ownership: "private",
          strategic_context: "",
        },
        documents: [],
        public_data: [],
      };
    }
    session.company_context.documents.push(doc);
    store.update(input.session_id, { company_context: session.company_context });
  }

  const result: IngestDocumentResult = {
    document_id: documentId,
    extracted_data: {
      text: parsed.text,
      tables: parsed.tables,
      financials,
      entities,
    },
    summary,
    warnings,
  };

  // Record event in session history only on success (no error key)
  if (!("error" in result)) {
    store.appendEvent(input.session_id, {
      type: "tool_call",
      tool_name: "ingest_document",
      summary: `Ingested ${input.file_name} (${input.file_type}, ${documentType})`,
    });
  }

  return result;
}

export async function handleSummarizeDocument(
  sessionId: string,
  documentId: string,
  store: SessionStore
): Promise<SummarizeDocumentResult | SummarizeDocumentError> {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  const docs = session.company_context?.documents ?? [];
  const doc = docs.find((d) => d.document_id === documentId);
  if (!doc) {
    return { error: "not_found", message: `Document "${documentId}" not found in session.` };
  }

  // key_findings: use entities if available, otherwise first 3 sentences
  let keyFindings: string[];
  if (doc.extracted_data.entities.length > 0) {
    keyFindings = doc.extracted_data.entities.slice(0, 5);
  } else {
    const sentences = doc.extracted_data.text
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 5);
    keyFindings = sentences.slice(0, 3);
  }

  // Record event
  store.appendEvent(sessionId, {
    type: "tool_call",
    tool_name: "summarize_document",
    summary: `Summarized document ${doc.file_name}`,
  });

  return {
    summary: doc.summary,
    key_findings: keyFindings,
  };
}

export async function handleEnrichCompanyProfile(
  sessionId: string,
  store: SessionStore
): Promise<EnrichProfileResult | EnrichProfileError> {
  const session = store.get(sessionId);
  if (!session) {
    return { error: "session_not_found", message: `Session "${sessionId}" not found.` };
  }

  const docs = session.company_context?.documents ?? [];
  if (docs.length === 0) {
    return { error: "no_documents", message: "No documents have been ingested for this session." };
  }

  // Aggregate entities from all documents (deduplicated)
  const entitySet = new Set<string>();
  for (const doc of docs) {
    for (const entity of doc.extracted_data.entities) {
      entitySet.add(entity);
    }
  }
  const entities = Array.from(entitySet);

  // Merge financials from P&L documents
  let mergedFinancials: Financials | undefined;
  for (const doc of docs) {
    if (doc.document_type === "pl" && doc.extracted_data.financials) {
      if (!mergedFinancials) {
        mergedFinancials = { ...doc.extracted_data.financials };
      } else {
        const f = doc.extracted_data.financials;
        if (f.revenue > 0) mergedFinancials.revenue = f.revenue;
        if (f.ebitda_margin > 0) mergedFinancials.ebitda_margin = f.ebitda_margin;
        if (f.cogs_ratio > 0) mergedFinancials.cogs_ratio = f.cogs_ratio;
        if (f.sga_ratio > 0) mergedFinancials.sga_ratio = f.sga_ratio;
        if (f.labor_percent > 0) mergedFinancials.labor_percent = f.labor_percent;
      }
    }
  }

  // Build partial profile from extracted data
  const profile: Partial<CompanyProfile> = {};

  if (entities.length > 0) {
    profile.name = entities[0];
  }

  if (mergedFinancials) {
    profile.revenue = mergedFinancials.revenue;
  }

  // Update session company context
  if (session.company_context) {
    if (profile.name && !session.company_context.profile.name) {
      session.company_context.profile.name = profile.name;
    }
    if (mergedFinancials && mergedFinancials.revenue > 0) {
      session.company_context.profile.revenue = mergedFinancials.revenue;
    }
    store.update(sessionId, { company_context: session.company_context });
  }

  // Record event
  store.appendEvent(sessionId, {
    type: "tool_call",
    tool_name: "enrich_company_profile",
    summary: `Enriched company profile from ${docs.length} document(s): ${entities.length} entities, financials ${mergedFinancials ? "found" : "not found"}`,
  });

  return {
    profile,
    financials: mergedFinancials,
    entities,
    document_count: docs.length,
  };
}
