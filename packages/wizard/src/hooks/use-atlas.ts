"use client";
import { useState, useCallback } from "react";
import { callAtlasTool } from "../lib/atlas-client";

export function useAtlas() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTool = useCallback(
    async (toolName: string, params: Record<string, unknown> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const enrichedParams = sessionId
          ? { session_id: sessionId, ...params }
          : params;
        const result = await callAtlasTool(toolName, enrichedParams);
        // Auto-capture session_id from create_session
        if (
          toolName === "create_session" &&
          result &&
          typeof result === "object" &&
          "session_id" in result
        ) {
          setSessionId((result as Record<string, unknown>).session_id as string);
        }
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return { sessionId, callTool, loading, error, setSessionId };
}
