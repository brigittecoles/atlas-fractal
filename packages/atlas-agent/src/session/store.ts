import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { Session, SessionEvent, SessionStatus } from "../types/session.js";
import type { UniversalFractalNode } from "../types/fractal-node.js";
import type { FractalAgentSystem, DemotedConcept } from "../types/fractal-system.js";

export class SessionStore {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private filePath(id: string): string {
    return join(this.dir, `${id}.json`);
  }

  private save(session: Session): void {
    writeFileSync(this.filePath(session.id), JSON.stringify(session, null, 2), "utf-8");
  }

  create(): Session {
    const now = new Date().toISOString();
    const session: Session = {
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      status: "intake",
      company_context: null,
      selected_processes: [],
      fractal_system: null,
      translated_system: null,
      history: [],
    };
    this.save(session);
    return session;
  }

  get(id: string): Session | null {
    const path = this.filePath(id);
    if (!existsSync(path)) return null;
    const data = readFileSync(path, "utf-8");
    return JSON.parse(data) as Session;
  }

  update(id: string, patch: Partial<Session>): void {
    const session = this.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    const now = new Date().toISOString();
    session.updated_at = now;
    Object.assign(session, patch);
    this.save(session);
  }

  list(): Session[] {
    const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const data = readFileSync(join(this.dir, f), "utf-8");
      return JSON.parse(data) as Session;
    });
  }

  delete(id: string): void {
    const path = this.filePath(id);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  appendEvent(id: string, event: Omit<SessionEvent, "timestamp">): void {
    const session = this.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    const fullEvent: SessionEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    session.history.push(fullEvent);
    session.updated_at = new Date().toISOString();
    this.save(session);
  }

  cleanup(ttlDays: number): void {
    const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
    const sessions = this.list();
    for (const session of sessions) {
      if (new Date(session.updated_at).getTime() < cutoff) {
        this.delete(session.id);
      }
    }
  }

  addNode(sessionId: string, node: UniversalFractalNode, parentNodeId: string | null): void {
    const session = this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Initialize fractal_system if null
    if (!session.fractal_system) {
      session.fractal_system = {
        schema_version: "6.0-fractal",
        company_context: session.company_context ?? {
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
        },
        value_chain_areas: [],
        demoted_concepts: [],
        output_catalog: [],
        consolidation_log: [],
        target_platform: "",
      };
    }

    if (parentNodeId === null) {
      // Top-level node — add to value_chain_areas
      session.fractal_system.value_chain_areas.push(node);
    } else {
      // Find parent recursively and append
      const found = this.findAndAppend(session.fractal_system.value_chain_areas, parentNodeId, node);
      if (!found) {
        throw new Error(`Parent node not found: ${parentNodeId}`);
      }
    }

    session.updated_at = new Date().toISOString();
    this.save(session);
  }

  private findAndAppend(nodes: UniversalFractalNode[], parentId: string, child: UniversalFractalNode): boolean {
    for (const node of nodes) {
      if (node.identity.id === parentId) {
        node.children.push(child);
        return true;
      }
      if (node.children.length > 0) {
        if (this.findAndAppend(node.children, parentId, child)) {
          return true;
        }
      }
    }
    return false;
  }

  addDemotedConcept(sessionId: string, concept: DemotedConcept): void {
    const session = this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (!session.fractal_system) {
      throw new Error("Fractal system not initialized. Call addNode first.");
    }
    session.fractal_system.demoted_concepts.push(concept);
    session.updated_at = new Date().toISOString();
    this.save(session);
  }
}
