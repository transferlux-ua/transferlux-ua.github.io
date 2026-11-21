/* Smart route parsing without paid AI.
   "Прага Київ", "Из Оломоуца в Берлин", "Хочу из Львова в Париж", "kiev praga"
   1) normalize + transliterate to plain latin, 2) drop filler words,
   3) match tokens / bigrams against the city dictionary with
      case-ending tolerance (Львова -> Львів) and typo tolerance (Levenshtein),
   4) use prepositions (з/із/из/from, в/у/до/to/на) to decide direction. */
import { CITIES, City } from "./cities";

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", ё: "e", є: "ye", ж: "zh", з: "z", и: "i", і: "i", ї: "yi",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "c",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

export function latin(s: string): string {
  let out = "";
  // Cyrillic is mapped BEFORE accent stripping, otherwise ї/й lose their marks
  for (const raw of s.toLowerCase().normalize("NFC")) {
    if (CYR[raw] !== undefined) { out += CYR[raw]; continue; }
    const ch = raw.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (CYR[ch] !== undefined) out += CYR[ch];
    else if (ch === "ł") out += "l";
    else if (ch === "ø") out += "o";
    else if (ch === "ß") out += "ss";
    else if (ch === "æ") out += "ae";
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/['’`ʼ]/.test(ch)) out += "";
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

const FROM_WORDS = new Set(["z", "iz", "zi", "from", "vid", "ot", "od", "vyizd", "start"]);
const TO_WORDS = new Set(["v", "u", "vo", "do", "to", "na", "nach", "in"]);
const FILLER = new Set([
  "khochu", "khochy", "khotiv", "khotil", "khotila", "treba", "nado", "nuzhno", "potribno", "please", "want", "i", "ya", "me",
  "poyikhati", "poikhati", "poekhat", "doyikhati", "doekhat", "yikhati", "ekhat", "poyizdka", "poezdka", "trip", "travel",
  "go", "ride", "transfer", "bus", "avtobus", "marshrut", "route", "kvytok", "bilet", "ticket", "skilky", "skolko", "kosht",
  "tsina", "cena", "price", "cost", "the", "a", "and", "ta", "ta", "pozhaluysta", "bud", "laska", "z", "na", "zavtra", "segodnya", "sohodni"
]);

function lev(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
      rowMin = Math.min(rowMin, dp[j]);
    }
    if (rowMin > max) return max + 1;
  }
  return dp[b.length];
}

interface Key { city: City; key: string; base: string; words: number }
let KEYS: Key[] | null = null;
function keys(): Key[] {
  if (KEYS) return KEYS;
  const out: Key[] = [];
  const seen = new Set<string>();
  for (const city of CITIES) {
    for (const a of city.aliases) {
      const key = latin(a);
      if (!key || seen.has(city.id + "|" + key)) continue;
      seen.add(city.id + "|" + key);
      const base = key.length >= 4 ? key.replace(/[aeiouy]$/, "") : key;
      out.push({ city, key, base, words: key.split(" ").length });
    }
  }
  KEYS = out;
  return out;
}

/** score: 0 exact, 1 inflected/close, 2 typo; Infinity no match */
function scoreToken(tok: string, k: Key): number {
  if (tok === k.key) return 0;
  if (tok.length >= 3 && k.base.length >= 3 && tok.startsWith(k.base) && tok.length - k.base.length <= 3) return 1;
  if (tok.length >= 4 && k.key.startsWith(tok) && k.key.length - tok.length <= 1) return 1;
  const max = k.key.length >= 8 ? 2 : k.key.length >= 5 ? 1 : 0;
  if (max === 0) return Infinity;
  const d = Math.min(lev(tok, k.key, max), lev(tok.replace(/[aeiouy]{1,2}$/, ""), k.base, max));
  return d <= max ? 1 + d : Infinity;
}

export interface CityMatch { city: City; score: number; start: number; end: number; text: string }

/** Best city for a token sequence starting at i (tries 3, 2, 1 words). */
function matchAt(tokens: string[], i: number): CityMatch | null {
  let best: CityMatch | null = null;
  for (let n = 3; n >= 1; n--) {
    if (i + n > tokens.length) continue;
    const phrase = tokens.slice(i, i + n).join(" ");
    if (phrase.length < 3) continue;
    for (const k of keys()) {
      if (k.words !== n) continue;
      const s = scoreToken(phrase, k);
      if (s === Infinity) continue;
      const better = !best || s < best.score || (s === best.score && n > best.end - best.start);
      if (better) best = { city: k.city, score: s, start: i, end: i + n, text: phrase };
    }
    if (best && best.end - best.start === n && best.score <= 1) break;
  }
  return best;
}

export interface ParsedRoute {
  from: City | null;
  to: City | null;
  /** text parts we could not match to the dictionary (for geocoder fallback) */
  unknown: string[];
}

export function parseRoute(input: string): ParsedRoute {
  const tokens = latin(input.replace(/[-–—→>]+/g, " ")).split(" ").filter(Boolean);
  const found: { m: CityMatch; role: "from" | "to" | null }[] = [];
  const unknown: string[] = [];
  let pending: "from" | "to" | null = null;
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i];
    if (FROM_WORDS.has(t)) { pending = "from"; i++; continue; }
    if (TO_WORDS.has(t)) { pending = "to"; i++; continue; }
    const m = matchAt(tokens, i);
    if (m) {
      found.push({ m, role: pending });
      pending = null;
      i = m.end;
      continue;
    }
    if (!FILLER.has(t) && t.length >= 3 && !/^\d+$/.test(t)) unknown.push(t);
    i++;
  }
  let from: City | null = null;
  let to: City | null = null;
  for (const f of found) if (f.role === "from" && !from) from = f.m.city;
  for (const f of found) if (f.role === "to" && !to) to = f.m.city;
  for (const f of found) {
    if (f.m.city === from || f.m.city === to) continue;
    if (!from) from = f.m.city;
    else if (!to) to = f.m.city;
  }
  return { from, to, unknown };
}

/** Suggestions for an autocomplete field. */
export function suggestCities(input: string, limit = 6): City[] {
  const q = latin(input);
  if (q.length < 2) return [];
  const scored = new Map<string, { city: City; s: number }>();
  for (const k of keys()) {
    let s = Infinity;
    if (k.key.startsWith(q)) s = 0;
    else if (k.key.split(" ").some((w) => w.startsWith(q))) s = 0.5;
    else if (q.length >= 3) s = scoreToken(q, k);
    if (s === Infinity) continue;
    const prev = scored.get(k.city.id);
    if (!prev || s < prev.s) scored.set(k.city.id, { city: k.city, s });
  }
  return [...scored.values()].sort((a, b) => a.s - b.s).slice(0, limit).map((x) => x.city);
}
