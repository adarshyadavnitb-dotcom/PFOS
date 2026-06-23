import { ApiData, NewExpense } from "./types";

const BASE = "/api/pfos";

export class ApiError extends Error {}

async function call(path: string, token: string, init?: RequestInit): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${encodeURIComponent(token)}`, init);
  if (res.status === 401) throw new ApiError("Invalid access token");
  if (!res.ok) throw new ApiError(`Request failed (${res.status})`);
  const text = await res.text();
  if (!text) throw new ApiError("Empty response from server");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Unexpected response from server");
  }
}

export function fetchData(token: string): Promise<ApiData> {
  return call("/data", token);
}

export function addExpense(token: string, e: NewExpense): Promise<{ transaction_id?: string }> {
  return call("/add", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
}

export function generateInsight(token: string): Promise<{ success: boolean; insight: string }> {
  return call("/insight", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}
