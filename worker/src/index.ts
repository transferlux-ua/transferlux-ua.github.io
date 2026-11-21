/* TransferLux API (Cloudflare Worker + D1)
   GET  /api/rate                       EUR/UAH official NBU rate (cached 1h)
   GET  /api/route?from=&to=            road distance + price base
   GET  /api/trips?from=&to=&date=      regular trips with free seats
   GET  /api/trips/upcoming             next 45 days
   POST /api/booking                    regular trip request (holds seats until manager decides)
   POST /api/request                    individual trip, price on request
   POST /tg                             Telegram webhook (admin bot) */
import { CITY_BY_ID } from "../../shared/cities";
import { quote } from "../../shared/price";
import { geocodeCity, geocodeText, roadRoute, CROSSINGS, Place } from "./geo";
import { handleTelegram, notifyAdmins, bookingCard } from "./bot";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  SITE_URL: string;
  BOT_TOKEN?: string;
  ADMIN_CODE?: string;
  WEBHOOK_SECRET?: string;
}

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  return allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }
    : {};
}

function json(req: Request, env: Env, data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(req, env), ...extra } });
}

/* ---------- exchange rate ---------- */
export async function getRate(env: Env): Promise<{ rate: number; date: string } | null> {
  const hit = await env.DB.prepare("SELECT v, updated FROM kv WHERE k = 'rate'").first<{ v: string; updated: number }>();
  if (hit && Date.now() - hit.updated < 3600_000) return JSON.parse(hit.v);
  try {
    // rate valid TODAY in Kyiv (without a date NBU may already return tomorrow's rate)
    const d = todayKyiv().replace(/-/g, "");
    const r = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&date=${d}&json`, { headers: { "User-Agent": "TransferLux/2.0" } });
    if (!r.ok) throw new Error("nbu " + r.status);
    const j = (await r.json()) as { rate: number; exchangedate: string }[];
    if (!j[0] || !(j[0].rate > 0)) throw new Error("nbu empty");
    const v = { rate: j[0].rate, date: j[0].exchangedate };
    await env.DB.prepare("INSERT OR REPLACE INTO kv (k, v, updated) VALUES ('rate', ?, ?)").bind(JSON.stringify(v), Date.now()).run();
    return v;
  } catch {
    // never present an old rate as current: only accept a cache younger than 36h, and say its date
    if (hit && Date.now() - hit.updated < 36 * 3600_000) return JSON.parse(hit.v);
    return null;
  }
}

/* ---------- places ---------- */
async function resolve(env: Env, q: string): Promise<Place | null> {
  if (CITY_BY_ID[q]) return geocodeCity(env.DB, q);
  if (q.length < 2 || q.length > 80) return null;
  return geocodeText(env.DB, q);
}

export async function routeBetween(env: Env, fromQ: string, toQ: string) {
  const [a, b] = await Promise.all([resolve(env, fromQ), resolve(env, toQ)]);
  if (!a || !b) return { error: !a ? "from_not_found" : "to_not_found" } as const;
  const r = await roadRoute(env.DB, a, b);
  if (!r) return { error: "no_road_route" } as const;
  const via = r.via ? CROSSINGS.find((c) => c.id === r.via) : null;
  return { from: { id: a.id, label: a.label, cc: a.cc }, to: { id: b.id, label: b.label, cc: b.cc }, km: r.km, minutes: r.minutes, via: via ? { id: via.id, name: via.name } : null };
}

/* ---------- validation helpers ---------- */
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "");
const int = (v: unknown, min: number, max: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
function phoneOk(p: string) {
  const d = p.replace(/\D/g, "");
  return /^[+\d\s()\-.]+$/.test(p) && d.length >= 9 && d.length <= 15;
}
async function ipHash(req: Request): Promise<string> {
  const ip = req.headers.get("CF-Connecting-IP") || "0";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tlx:" + ip));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function tooMany(env: Env, hash: string): Promise<boolean> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM bookings WHERE ip_hash = ? AND created > ?").bind(hash, Date.now() - 15 * 60_000).first<{ n: number }>();
  return (r?.n ?? 0) >= 6;
}

function todayKyiv(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
}

/* ---------- handlers ---------- */
async function handleBooking(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json(req, env, { error: "bad_json" }, 400);
  if (b.website) return json(req, env, { error: "spam" }, 400); // honeypot
  const tripId = int(b.trip_id, 1, 1e9);
  const adults = int(b.adults, 1, 20);
  const children = int(b.children, 0, 20);
  const name = clean(b.name, 80);
  const phone = clean(b.phone, 25);
  const idem = clean(b.idem, 64);
  if (!tripId || adults === null || children === null || name.length < 2 || !phoneOk(phone) || idem.length < 8)
    return json(req, env, { error: "validation" }, 400);
  const seats = adults + children;
  const hash = await ipHash(req);

  const prev = await env.DB.prepare("SELECT id, status FROM bookings WHERE idem = ?").bind(idem).first<{ id: number; status: string }>();
  if (prev) return json(req, env, { id: prev.id, status: prev.status, duplicate: true });
  const dup = await env.DB.prepare("SELECT id FROM bookings WHERE trip_id = ? AND phone = ? AND status IN ('pending','confirmed')").bind(tripId, phone).first<{ id: number }>();
  if (dup) return json(req, env, { error: "already_booked", id: dup.id }, 409);
  if (await tooMany(env, hash)) return json(req, env, { error: "rate_limited" }, 429);

  const trip = await env.DB.prepare("SELECT * FROM trips WHERE id = ? AND status = 'active'").bind(tripId).first<{ id: number; from_id: string; to_id: string; depart_date: string; depart_time: string }>();
  if (!trip || trip.depart_date < todayKyiv()) return json(req, env, { error: "trip_not_available" }, 404);

  const route = await routeBetween(env, trip.from_id, trip.to_id).catch(() => null);
  const km = route && "km" in route ? route.km : null;
  const priceCents = km ? quote(km, adults, children).totalCents : null;

  // atomic seat hold: only succeeds when enough seats are free (no overbooking)
  const held = await env.DB.prepare("UPDATE trips SET seats_free = seats_free - ? WHERE id = ? AND status = 'active' AND seats_free >= ? RETURNING seats_free").bind(seats, tripId, seats).first<{ seats_free: number }>();
  if (!held) return json(req, env, { error: "not_enough_seats" }, 409);
  let id: number;
  try {
    const ins = await env.DB.prepare(
      "INSERT INTO bookings (kind, trip_id, from_text, to_text, travel_date, adults, children, name, phone, contact, notes, price_cents, km, lang, status, idem, ip_hash, created) VALUES ('regular', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?) RETURNING id"
    ).bind(tripId, trip.from_id, trip.to_id, trip.depart_date, adults, children, name, phone, clean(b.contact, 20), clean(b.notes, 600), priceCents, km, clean(b.lang, 5), idem, hash, Date.now()).first<{ id: number }>();
    id = ins!.id;
  } catch (e) {
    await env.DB.prepare("UPDATE trips SET seats_free = seats_free + ? WHERE id = ?").bind(seats, tripId).run();
    return json(req, env, { error: "duplicate" }, 409);
  }
  ctx.waitUntil(notifyAdmins(env, await bookingCard(env, id), id));
  return json(req, env, { id, status: "pending", price_cents: priceCents });
}

async function handleRequest(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json(req, env, { error: "bad_json" }, 400);
  if (b.website) return json(req, env, { error: "spam" }, 400);
  const adults = int(b.adults, 1, 60);
  const children = int(b.children, 0, 60);
  const name = clean(b.name, 80);
  const phone = clean(b.phone, 25);
  const from = clean(b.from, 120);
  const to = clean(b.to, 120);
  const date = clean(b.date, 10);
  const idem = clean(b.idem, 64);
  if (adults === null || children === null || name.length < 2 || !phoneOk(phone) || from.length < 2 || to.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || idem.length < 8)
    return json(req, env, { error: "validation" }, 400);
  const prev = await env.DB.prepare("SELECT id, status FROM bookings WHERE idem = ?").bind(idem).first<{ id: number; status: string }>();
  if (prev) return json(req, env, { id: prev.id, status: prev.status, duplicate: true });
  const hash = await ipHash(req);
  if (await tooMany(env, hash)) return json(req, env, { error: "rate_limited" }, 429);
  const km = typeof b.km === "number" && b.km > 0 && b.km < 10000 ? Math.round(b.km * 10) / 10 : null;
  const ins = await env.DB.prepare(
    "INSERT INTO bookings (kind, from_text, to_text, travel_date, adults, children, name, phone, contact, notes, km, lang, status, idem, ip_hash, created) VALUES ('individual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?) RETURNING id"
  ).bind(from, to, date, adults, children, name, phone, clean(b.contact, 20), clean(b.notes, 600), km, clean(b.lang, 5), idem, hash, Date.now()).first<{ id: number }>();
  ctx.waitUntil(notifyAdmins(env, await bookingCard(env, ins!.id), ins!.id));
  return json(req, env, { id: ins!.id, status: "pending" });
}

async function listTrips(env: Env, from: string | null, to: string | null, date: string | null) {
  const today = todayKyiv();
  let sql = "SELECT id, from_id, to_id, depart_date, depart_time, seats_total, seats_free FROM trips WHERE status = 'active' AND depart_date >= ?";
  const args: unknown[] = [today];
  if (from) { sql += " AND from_id = ?"; args.push(from); }
  if (to) { sql += " AND to_id = ?"; args.push(to); }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(date + "T12:00:00Z");
    const lo = new Date(d.getTime() - 3 * 86400_000).toISOString().slice(0, 10);
    const hi = new Date(d.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
    sql += " AND depart_date BETWEEN ? AND ?"; args.push(lo < today ? today : lo, hi);
  } else {
    const hi = new Date(Date.now() + 45 * 86400_000).toISOString().slice(0, 10);
    sql += " AND depart_date <= ?"; args.push(hi);
  }
  sql += " ORDER BY depart_date, depart_time LIMIT 50";
  const r = await env.DB.prepare(sql).bind(...args).all();
  return r.results;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req, env) });
    try {
      if (url.pathname === "/tg" && req.method === "POST") return handleTelegram(req, env, ctx);
      if (url.pathname === "/api/health") return json(req, env, { ok: true });
      if (url.pathname === "/api/rate") {
        const r = await getRate(env);
        return r ? json(req, env, { ...r, source: "NBU" }, 200, { "Cache-Control": "public, max-age=600" }) : json(req, env, { error: "rate_unavailable" }, 503);
      }
      if (url.pathname === "/api/route") {
        const from = clean(url.searchParams.get("from"), 80), to = clean(url.searchParams.get("to"), 80);
        if (!from || !to) return json(req, env, { error: "validation" }, 400);
        try {
          const r = await routeBetween(env, from, to);
          return json(req, env, r, "error" in r ? 422 : 200, "error" in r ? {} : { "Cache-Control": "public, max-age=86400" });
        } catch {
          return json(req, env, { error: "routing_unavailable" }, 503);
        }
      }
      if (url.pathname === "/api/trips/upcoming") return json(req, env, { trips: await listTrips(env, null, null, null) });
      if (url.pathname === "/api/trips") {
        const from = url.searchParams.get("from"), to = url.searchParams.get("to");
        return json(req, env, { trips: await listTrips(env, from && CITY_BY_ID[from] ? from : null, to && CITY_BY_ID[to] ? to : null, url.searchParams.get("date")) });
      }
      if (url.pathname === "/api/booking" && req.method === "POST") return handleBooking(req, env, ctx);
      if (url.pathname === "/api/request" && req.method === "POST") return handleRequest(req, env, ctx);
      return json(req, env, { error: "not_found" }, 404);
    } catch (e) {
      return json(req, env, { error: "server_error" }, 500);
    }
  }
};
