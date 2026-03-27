import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SessionStore } from "../../session/index.js";
import {
  handleIngestDocument,
  handleSummarizeDocument,
  handleEnrichCompanyProfile,
} from "../document-ingestion.js";

let store: SessionStore;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-doc-test-"));
  store = new SessionStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function toBase64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

describe("handleIngestDocument", () => {
  it("given base64-encoded text content, returns extracted text and document_id", async () => {
    const session = store.create();
    const textContent = "Acme Corp Annual Report 2024\nRevenue: $500M\nEBITDA Margin: 22%";
    const result = await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "report.txt",
        file_content: toBase64(textContent),
        file_type: "txt",
        document_type: "general",
      },
      store
    );

    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.document_id).toBeDefined();
    expect(typeof result.document_id).toBe("string");
    expect(result.extracted_data.text).toContain("Acme Corp");
    expect(result.extracted_data.text).toContain("Revenue");
  });

  it("returns error for unsupported format", async () => {
    const session = store.create();
    const result = await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "video.mp4",
        file_content: toBase64("fake video data"),
        file_type: "mp4",
        document_type: "general",
      },
      store
    );

    expect(result).toHaveProperty("error", "unsupported_format");
    if (!("error" in result)) return;
    expect(result.supported).toEqual(["pdf", "xlsx", "docx", "csv", "txt"]);
  });

  it("returns error for empty content", async () => {
    const session = store.create();
    const result = await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "empty.txt",
        file_content: toBase64(""),
        file_type: "txt",
        document_type: "general",
      },
      store
    );

    expect(result).toHaveProperty("error", "unreadable");
  });

  it("stores the document in the session after ingestion", async () => {
    const session = store.create();
    const textContent = "Strategy document for Acme Corp";
    await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "strategy.txt",
        file_content: toBase64(textContent),
        file_type: "txt",
        document_type: "strategy",
      },
      store
    );

    const updated = store.get(session.id)!;
    expect(updated.company_context).not.toBeNull();
    expect(updated.company_context!.documents.length).toBe(1);
    expect(updated.company_context!.documents[0].file_name).toBe("strategy.txt");
  });
});

describe("handleSummarizeDocument", () => {
  it("returns summary and key_findings for a document in session", async () => {
    const session = store.create();
    const textContent =
      "Acme Corp is a leading healthcare provider. They serve 2M patients annually. Revenue grew 15% YoY.";
    await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "overview.txt",
        file_content: toBase64(textContent),
        file_type: "txt",
        document_type: "general",
      },
      store
    );

    const updated = store.get(session.id)!;
    const docId = updated.company_context!.documents[0].document_id;

    const result = await handleSummarizeDocument(session.id, docId, store);

    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.summary).toBeDefined();
    expect(typeof result.summary).toBe("string");
    expect(result.key_findings).toBeDefined();
    expect(Array.isArray(result.key_findings)).toBe(true);
  });

  it("returns error for unknown document_id", async () => {
    const session = store.create();
    const result = await handleSummarizeDocument(session.id, "nonexistent-doc-id", store);
    expect(result).toHaveProperty("error");
  });
});

describe("handleEnrichCompanyProfile", () => {
  it("assembles CompanyContext from ingested documents", async () => {
    const session = store.create();
    await handleIngestDocument(
      {
        session_id: session.id,
        file_name: "about.txt",
        file_content: toBase64("Acme Corp is a technology company based in San Francisco."),
        file_type: "txt",
        document_type: "general",
      },
      store
    );

    const result = await handleEnrichCompanyProfile(session.id, store);

    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.profile).toBeDefined();
    expect(result.document_count).toBe(1);
  });

  it("returns error for session with no documents", async () => {
    const session = store.create();
    const result = await handleEnrichCompanyProfile(session.id, store);
    expect(result).toHaveProperty("error");
  });
});
