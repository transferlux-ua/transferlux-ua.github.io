/* Geocoding (OpenStreetMap Nominatim / Photon) and road routing (OSRM).
   Results are cached in D1. Public OSM services ask for a clear User-Agent
   and low request rates, the cache keeps us well within that. */
import { CITY_BY_ID } from "../../shared/cities";
import { CROSSINGS } from "../../shared/crossings";
export { CROSSINGS };

const UA = "TransferLux/2.0 (+https://transferlux-ua.github.io)";

export interface Place { id: string; label: string; cc: string; lat: number; lon: number }

export async function geocodeCity(db: D1Database, id: string): Promise<Place | null> {
  const city = CITY_BY_ID[id];
  if (!city) return null;
  const hit = await db.prepare("SELECT lat, lon, label, cc FROM geo WHERE id = ?").bind("c:" + id).first<{ lat: number; lon: number; label: string; cc: string }>();
  if (hit) return { id, label: city.name.en, cc: city.cc, lat: hit.lat, lon: hit.lon };
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&city=${encodeURIComponent(city.name.en)}&countrycodes=${city.cc.toLowerCase()}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
  let lat: number | null = null, lon: number | null = null;
  if (r.ok) {
    const j = (await r.json()) as { lat: string; lon: string }[];
    if (j[0]) { lat = +j[0].lat; lon = +j[0].lon; }
  }
  if (lat === null) {
    const p = await photon(`${city.name.en}`, city.cc);
    if (p) { lat = p.lat; lon = p.lon; }
  }
  if (lat === null || lon === null) return null;
  await db.prepare("INSERT OR REPLACE INTO geo (id, lat, lon, label, cc, updated) VALUES (?, ?, ?, ?, ?, ?)").bind("c:" + id, lat, lon, city.name.en, city.cc, Date.now()).run();
  return { id, label: city.name.en, cc: city.cc, lat, lon };
}

/** Free text place (city not in our dictionary), Europe only. */
export async function geocodeText(db: D1Database, text: string): Promise<Place | null> {
  const key = "t:" + text.trim().toLowerCase().slice(0, 80);
  const hit = await db.prepare("SELECT lat, lon, label, cc FROM geo WHERE id = ?").bind(key).first<{ lat: number; lon: number; label: string; cc: string }>();
  if (hit) return { id: key, label: hit.label, cc: hit.cc, lat: hit.lat, lon: hit.lon };
  const p = await photon(text);
  if (!p) return null;
  await db.prepare("INSERT OR REPLACE INTO geo (id, lat, lon, label, cc, updated) VALUES (?, ?, ?, ?, ?, ?)").bind(key, p.lat, p.lon, p.label, p.cc, Date.now()).run();
  return { id: key, ...p };
}

const EUROPE = new Set(["UA","PL","CZ","SK","HU","AT","DE","NL","BE","LU","FR","IT","ES","PT","CH","DK","SE","NO","FI","LT","LV","EE","RO","MD","BG","HR","SI","RS","GB","IE","GR","BA","ME","MK","AL","LI","MC","SM","AD"]);

async function photon(q: string, cc?: string): Promise<{ label: string; cc: string; lat: number; lon: number } | null> {
  const url = `https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(q)}&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const j = (await r.json()) as { features: { geometry: { coordinates: [number, number] }; properties: { name: string; countrycode?: string; country?: string } }[] };
  const f = j.features.find((x) => {
    const c = (x.properties.countrycode || "").toUpperCase();
    return cc ? c === cc : EUROPE.has(c);
  });
  if (!f) return null;
  const c = (f.properties.countrycode || "").toUpperCase();
  return { label: `${f.properties.name}${f.properties.country ? ", " + f.properties.country : ""}`, cc: c, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
}


function hav(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function osrm(points: { lat: number; lon: number }[]): Promise<{ km: number; minutes: number } | null> {
  const coords = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const hosts = ["https://router.project-osrm.org/route/v1/driving/", "https://routing.openstreetmap.de/routed-car/route/v1/driving/"];
  for (const h of hosts) {
    try {
      const r = await fetch(`${h}${coords}?overview=false&alternatives=false&steps=false`, { headers: { "User-Agent": UA } });
      if (!r.ok) continue;
      const j = (await r.json()) as { code: string; routes?: { distance: number; duration: number }[] };
      if (j.code === "Ok" && j.routes && j.routes[0]) return { km: j.routes[0].distance / 1000, minutes: Math.round(j.routes[0].duration / 60) };
      if (j.code === "NoRoute") return null;
    } catch { /* try next host */ }
  }
  throw new Error("routing_unavailable");
}

export interface RouteResult { km: number; minutes: number; via: string | null }

const NON_EU_NEIGHBOURS = new Set(["UA", "MD"]);

export async function roadRoute(db: D1Database, a: Place, b: Place): Promise<RouteResult | null> {
  const key = `${a.lat.toFixed(3)},${a.lon.toFixed(3)}|${b.lat.toFixed(3)},${b.lon.toFixed(3)}`;
  const hit = await db.prepare("SELECT km, minutes, via FROM route_cache WHERE k = ?").bind(key).first<RouteResult>();
  if (hit) return hit;
  let best: RouteResult | null = null;
  const crossesEuBorder = (a.cc === "UA") !== (b.cc === "UA") && !(NON_EU_NEIGHBOURS.has(a.cc) && NON_EU_NEIGHBOURS.has(b.cc));
  if (crossesEuBorder) {
    const ranked = [...CROSSINGS].sort((x, y) => hav(a, x) + hav(x, b) - (hav(a, y) + hav(y, b))).slice(0, 2);
    for (const c of ranked) {
      const r = await osrm([a, c, b]);
      if (r && (!best || r.km < best.km)) best = { ...r, via: c.id };
    }
    // South of 50.5°N the shortest road cannot pass Belarus, so a direct
    // route (for example Odesa via Moldova to Romania) is also safe.
    if (Math.max(a.lat, b.lat) < 50.5) {
      const r = await osrm([a, b]);
      if (r && (!best || r.km < best.km)) best = { ...r, via: null };
    }
  } else {
    const r = await osrm([a, b]);
    if (r) best = { ...r, via: null };
  }
  if (!best) return null;
  best.km = Math.round(best.km * 10) / 10;
  await db.prepare("INSERT OR REPLACE INTO route_cache (k, km, minutes, via, updated) VALUES (?, ?, ?, ?, ?)").bind(key, best.km, best.minutes, best.via, Date.now()).run();
  return best;
}
