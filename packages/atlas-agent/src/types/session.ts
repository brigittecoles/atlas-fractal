import type { CompanyContext } from "./company-context.js";
import type { FractalAgentSystem, TranslatedFractalSystem } from "./fractal-system.js";

// --- Session Status ---

export type SessionStatus = "intake" | "processes" | "design" | "configure" | "export" | "completed";

// --- Session Event ---

export type SessionEventType = "tool_call" | "human_edit" | "status_change" | "gate_override";

export interface SessionEvent {
  timestamp: string;
  type: SessionEventType;
  tool_name?: string;
  node_id?: string;
  summary: string;
}

// --- Selected Process ---

export interface SelectedProcess {
  process_id: string;
  process_name: string;
  l1_id: string;
  l1_name: string;
  porter_activity: string;
  client_justification: string;
  ebitda_score: number;
}

// --- Session ---

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  status: SessionStatus;
  company_context: CompanyContext | null;
  selected_processes: SelectedProcess[];
  fractal_system: FractalAgentSystem | null;
  translated_system: TranslatedFractalSystem | null;
  history: SessionEvent[];
}
