export const API = (import.meta.env.VITE_API_BASE as string | undefined) || "http://127.0.0.1:8787";

export interface RouteInfo {
  from: { id: string; label: string; cc: string };
  to: { id: string; label: string; cc: string };
  km: number;
  minutes: number;
  via: { id: string; name: { uk: string; ru: string; en: string } } | null;
}
export interface Trip { id: number; from_id: string; to_id: string; depart_date: string; depart_time: string; seats_total: number; seats_free: number }
export interface Rate { rate: number; date: string }

async function get<T>(path: string): Promise<T> {
  const r = await fetch(API + path);
  const j = await r.json().catch(() => ({ error: "bad_json" }));
  if (!r.ok) throw Object.assign(new Error(j.error || "http_" + r.status), { code: j.error || "http_" + r.status });
  return j as T;
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: "bad_json" }));
  if (!r.ok) throw Object.assign(new Error(j.error || "http_" + r.status), { code: j.error || "http_" + r.status });
  return j as T;
}

export const api = {
  route: (from: string, to: string) => get<RouteInfo>(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  rate: () => get<Rate>("/api/rate"),
  trips: (from: string, to: string, date: string) => get<{ trips: Trip[] }>(`/api/trips?from=${from}&to=${to}&date=${date}`),
  upcoming: () => get<{ trips: Trip[] }>("/api/trips/upcoming"),
  booking: (b: Record<string, unknown>) => post<{ id: number; status: string; duplicate?: boolean }>("/api/booking", b),
  request: (b: Record<string, unknown>) => post<{ id: number; status: string }>("/api/request", b)
};

export function newIdem(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
