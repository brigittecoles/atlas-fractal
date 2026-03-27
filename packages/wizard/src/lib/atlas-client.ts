const ATLAS_URL = process.env.NEXT_PUBLIC_ATLAS_URL || "http://localhost:3001";

export async function callAtlasTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${ATLAS_URL}/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: toolName, params }),
  });
  if (!res.ok) throw new Error(`ATLAS error: ${res.status}`);
  return res.json();
}
