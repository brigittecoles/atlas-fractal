import { describe, it, expect } from "vitest";
import { handleSearchProcesses, handleGetProcessDetail, handleMapToValueChain } from "../apqc.js";

describe("handleSearchProcesses", () => {
  it("filters by industry — healthcare returns only processes with healthcare tech stacks", () => {
    const result = handleSearchProcesses({ industry: "healthcare" });
    expect(result.processes.length).toBeGreaterThan(0);
    expect(result.total_count).toBe(result.processes.length);
    for (const p of result.processes) {
      const detail = handleGetProcessDetail(p.id);
      expect(detail).not.toBeNull();
      expect(detail!.tech_stacks).toHaveProperty("healthcare");
    }
  });

  it("filters by keywords — matches process name or value_proposition", () => {
    const result = handleSearchProcesses({ industry: "healthcare", keywords: ["strategy"] });
    expect(result.processes.length).toBeGreaterThan(0);
    for (const p of result.processes) {
      const detail = handleGetProcessDetail(p.id);
      const searchText = [detail!.name, detail!.value_proposition, ...detail!.work_products].join(" ").toLowerCase();
      expect(searchText).toContain("strategy");
    }
  });

  it("filters by type — operating", () => {
    const result = handleSearchProcesses({ industry: "technology", type: "operating" });
    expect(result.processes.length).toBeGreaterThan(0);
    for (const p of result.processes) {
      expect(p.type).toBe("operating");
    }
  });

  it("returns summary fields, not full process objects", () => {
    const result = handleSearchProcesses({ industry: "technology", keywords: ["customer"] });
    expect(result.processes.length).toBeGreaterThan(0);
    const p = result.processes[0];
    expect(p).toHaveProperty("id");
    expect(p).toHaveProperty("name");
    expect(p).toHaveProperty("l1_id");
    expect(p).toHaveProperty("l1_name");
    expect(p).toHaveProperty("type");
    expect(p).toHaveProperty("value_proposition");
    expect(p).toHaveProperty("ebitda_est_impact_pct");
  });
});

describe("handleGetProcessDetail", () => {
  it("returns full APQCProcess by ID", () => {
    const detail = handleGetProcessDetail("3.2");
    expect(detail).not.toBeNull();
    expect(detail!.id).toBe("3.2");
    expect(detail!.name).toBeDefined();
    expect(detail!.tech_stacks).toBeDefined();
    expect(detail!.work_products).toBeDefined();
    expect(detail!.agents).toBeDefined();
    expect(detail!.ebitda).toBeDefined();
  });

  it("returns null for unknown ID", () => {
    const detail = handleGetProcessDetail("99.99");
    expect(detail).toBeNull();
  });
});

describe("handleMapToValueChain", () => {
  it("returns all 9 Porter activities", () => {
    const result = handleMapToValueChain([]);
    expect(result.porter_activities).toHaveLength(9);
    const names = result.porter_activities.map((a) => a.name);
    expect(names).toContain("Inbound Logistics");
    expect(names).toContain("Marketing & Sales");
    expect(names).toContain("Firm Infrastructure");
    expect(names).toContain("Procurement");
  });

  it("returns all 13 APQC L1 categories", () => {
    const result = handleMapToValueChain([]);
    expect(result.apqc_l1_categories).toHaveLength(13);
  });

  it("returns reference mappings — L1 to typical Porter activities", () => {
    const result = handleMapToValueChain([]);
    expect(result.reference_mappings).toHaveLength(13);

    const visionMapping = result.reference_mappings.find((m) => m.l1_id === "1.0");
    expect(visionMapping).toBeDefined();
    expect(visionMapping!.typical_porter_activities).toContain("Firm Infrastructure");
  });
});
