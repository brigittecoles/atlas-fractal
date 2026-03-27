"use client";
import { useState, useCallback, useEffect } from "react";
import { callAtlasTool } from "../lib/atlas-client";

const SESSION_KEY = "atlas-fractal-session-id";

export function useAtlas() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SESSION_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  }, [sessionId]);

  const callTool = useCallback(async (toolName: string, params: Record<string, unknown> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const enrichedParams = sessionId ? { session_id: sessionId, ...params } : params;
      const result = await callAtlasTool(toolName, enrichedParams);
      if (toolName === "create_session" && result && typeof result === "object" && "session_id" in result) {
        setSessionId((result as any).session_id);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const clearSession = useCallback(() => {
    setSessionId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  return { sessionId, callTool, loading, error, setSessionId, clearSession };
}
