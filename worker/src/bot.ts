/* TransferLux admin bot (Telegram webhook).
   Only chats registered with /start <ADMIN_CODE> can use it. */
import type { Env } from "./index";
import { CITY_BY_ID } from "../../shared/cities";
import { parseRoute } from "../../shared/parse";

type Btn = { text: string; callback_data?: string; url?: string };

async function tg(env: Env, method: string, body: unknown) {
  if (!env.BOT_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json().catch(() => null);
}
const send = (env: Env, chat: number, text: string, kb?: Btn[][]) =>
  tg(env, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true, ...(kb ? { reply_markup: { inline_keyboard: kb } } : {}) });

const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
const city = (id: string) => CITY_BY_ID[id]?.name.uk ?? id;
const fmtDate = (d: string) => d.split("-").reverse().join(".");
const STATUS: Record<string, string> = { pending: "âŹł ĐžŃ‡Ń–ĐşŃŃ” ĐżŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¶ĐµĐ˝Đ˝ŃŹ", confirmed: "âś… ĐźŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¶ĐµĐ˝Đľ", rejected: "âťŚ Đ’Ń–Đ´Ń…Đ¸Đ»ĐµĐ˝Đľ", cancelled: "đźš« ĐˇĐşĐ°ŃĐľĐ˛Đ°Đ˝Đľ" };

async function isAdmin(env: Env, chat: number) {
  return !!(await env.DB.prepare("SELECT 1 FROM admins WHERE chat_id = ?").bind(chat).first());
}

export async function notifyAdmins(env: Env, card: { text: string; kb: Btn[][] }, _id: number) {
  const admins = await env.DB.prepare("SELECT chat_id FROM admins").all<{ chat_id: number }>();
  for (const a of admins.results) await send(env, a.chat_id, "đź†• <b>ĐťĐľĐ˛Đ° Đ·Đ°ŃŹĐ˛ĐşĐ°</b>\n\n" + card.text, card.kb);
}

export async function bookingCard(env: Env, id: number): Promise<{ text: string; kb: Btn[][] }> {
  const b = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first<Record<string, any>>();
  if (!b) return { text: "Đ—Đ°ŃŹĐ˛ĐşŃ Đ˝Đµ Đ·Đ˝Đ°ĐąĐ´ĐµĐ˝Đľ", kb: [] };
  let route = `${esc(b.from_text)} â†’ ${esc(b.to_text)}`;
  let when = b.travel_date ? fmtDate(b.travel_date) : "";
  if (b.kind === "regular" && b.trip_id) {
    const t = await env.DB.prepare("SELECT * FROM trips WHERE id = ?").bind(b.trip_id).first<Record<string, any>>();
    if (t) { route = `${city(t.from_id)} â†’ ${city(t.to_id)}`; when = `${fmtDate(t.depart_date)} ${t.depart_time} (Ń€ĐµĐąŃ #${t.id}, Đ˛Ń–Đ»ŃŚĐ˝Đľ ${t.seats_free})`; }
  }
  const price = b.price_cents != null ? `${(b.price_cents / 100).toFixed(2)} â‚¬` : "Đ·Đ° Đ·Đ°ĐżĐ¸Ń‚ĐľĐĽ";
  const phoneDigits = String(b.phone).replace(/\D/g, "");
  const text =
    `<b>#${b.id}</b> Â· ${b.kind === "regular" ? "Đ ĐµĐłŃĐ»ŃŹŃ€Đ˝Đ¸Đą Ń€ĐµĐąŃ" : "Đ†Đ˝Đ´Đ¸Đ˛Ń–Đ´ŃĐ°Đ»ŃŚĐ˝Đ° ĐżĐľŃ—Đ·Đ´ĐşĐ°"}\n` +
    `${route}\nđź“… ${esc(when)}\n` +
    `đź‘¤ ${esc(b.name)} Â· đź“ž ${esc(b.phone)}${b.contact ? " Â· " + esc(b.contact) : ""}\n` +
    `Đ”ĐľŃ€ĐľŃĐ»Ń–: ${b.adults}, Đ´Ń–Ń‚Đ¸: ${b.children}${b.km ? ` Â· ${b.km} ĐşĐĽ` : ""}\n` +
    `Đ’Đ°Ń€Ń‚Ń–ŃŃ‚ŃŚ: ${price}\n` +
    (b.notes ? `đź’¬ ${esc(b.notes)}\n` : "") +
    `ĐˇŃ‚Đ°Ń‚ŃŃ: ${STATUS[b.status] ?? b.status}`;
  const kb: Btn[][] = [];
  if (b.status === "pending") kb.push([{ text: "âś… ĐźŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¸Ń‚Đ¸", callback_data: `bc:${b.id}` }, { text: "âťŚ Đ’Ń–Đ´Ń…Đ¸Đ»Đ¸Ń‚Đ¸", callback_data: `br:${b.id}` }]);
  if (b.status === "confirmed") kb.push([{ text: "đźš« ĐˇĐşĐ°ŃŃĐ˛Đ°Ń‚Đ¸ Đ±Ń€ĐľĐ˝ŃŚ", callback_data: `bx:${b.id}` }]);
  if (phoneDigits) kb.push([{ text: "WhatsApp", url: `https://wa.me/${phoneDigits}` }]);
  return { text, kb };
}

function tripText(t: Record<string, any>) {
  return `<b>Đ ĐµĐąŃ #${t.id}</b> ${t.status === "cancelled" ? "đźš« ĐˇĐšĐĐˇĐžĐ’ĐĐťĐž" : ""}\n${city(t.from_id)} â†’ ${city(t.to_id)}\nđź“… ${fmtDate(t.depart_date)} Đľ ${t.depart_time}\nđź’ş Đ’Ń–Đ»ŃŚĐ˝Đľ ${t.seats_free} Đ· ${t.seats_total}`;
}
function tripKb(t: Record<string, any>): Btn[][] {
  if (t.status !== "active") return [];
  return [
    [{ text: "â’1 ĐĽŃ–ŃŃ†Đµ", callback_data: `s:${t.id}:-1` }, { text: "+1 ĐĽŃ–ŃŃ†Đµ", callback_data: `s:${t.id}:1` }],
    [{ text: "đź“‹ Đ—Đ°ŃŹĐ˛ĐşĐ¸", callback_data: `tb:${t.id}` }, { text: "đźš« ĐˇĐşĐ°ŃŃĐ˛Đ°Ń‚Đ¸ Ń€ĐµĐąŃ", callback_data: `tc:${t.id}` }]
  ];
}

/** "05.12", "05.12.2026", "2026-12-05" -> YYYY-MM-DD */
function parseDate(s: string): string | null {
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?$/);
  if (!m) return null;
  const now = new Date();
  let y = m[3] ? +m[3] : now.getFullYear();
  if (y < 100) y += 2000;
  const d = +m[1], mo = +m[2];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (!m[3] && iso < now.toISOString().slice(0, 10)) iso = `${y + 1}${iso.slice(4)}`;
  return iso;
}
const parseTime = (s: string) => (/^\d{1,2}:\d{2}$/.test(s) ? s.padStart(5, "0") : null);

const HELP =
  "<b>TransferLux, ĐşĐµŃ€ŃĐ˛Đ°Đ˝Đ˝ŃŹ Ń€ĐµĐąŃĐ°ĐĽĐ¸</b>\n\n" +
  "<b>/add</b> ĐšĐ¸Ń—Đ˛ Đ’Đ°Ń€ŃĐ°Đ˛Đ° 05.12 08:00 8\n  Đ´ĐľĐ´Đ°Ń‚Đ¸ Ń€ĐµĐąŃ (ĐĽŃ–ŃŃ‚Đľ, ĐĽŃ–ŃŃ‚Đľ, Đ´Đ°Ń‚Đ°, Ń‡Đ°Ń, ĐĽŃ–ŃŃ†ŃŚ)\n" +
  "<b>/trips</b> Đ˝Đ°ĐąĐ±Đ»Đ¸Đ¶Ń‡Ń– Ń€ĐµĐąŃĐ¸ Đ· ĐşĐ˝ĐľĐżĐşĐ°ĐĽĐ¸\n" +
  "<b>/seats</b> 12 5  Đ˛ŃŃ‚Đ°Đ˝ĐľĐ˛Đ¸Ń‚Đ¸ Đ˛Ń–Đ»ŃŚĐ˝Ń– ĐĽŃ–ŃŃ†ŃŹ Ń€ĐµĐąŃŃ #12\n" +
  "<b>/move</b> 12 06.12 09:30  Đ·ĐĽŃ–Đ˝Đ¸Ń‚Đ¸ Đ´Đ°Ń‚Ń Ń– Ń‡Đ°Ń\n" +
  "<b>/cancel</b> 12  ŃĐşĐ°ŃŃĐ˛Đ°Ń‚Đ¸ Ń€ĐµĐąŃ\n" +
  "<b>/bookings</b> Đ·Đ°ŃŹĐ˛ĐşĐ¸, Ń‰Đľ ĐľŃ‡Ń–ĐşŃŃŽŃ‚ŃŚ ĐżŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¶ĐµĐ˝Đ˝ŃŹ\n" +
  "<b>/all</b> ĐľŃŃ‚Đ°Đ˝Đ˝Ń– 20 Đ·Đ°ŃŹĐ˛ĐľĐş\n\n" +
  "ĐťĐľĐ˛Ń– Đ·Đ°ŃŹĐ˛ĐşĐ¸ Đ· ŃĐ°ĐąŃ‚Ń ĐżŃ€Đ¸Ń…ĐľĐ´ŃŹŃ‚ŃŚ ŃŃŽĐ´Đ¸ Đ°Đ˛Ń‚ĐľĐĽĐ°Ń‚Đ¸Ń‡Đ˝Đľ.";

export async function handleTelegram(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.WEBHOOK_SECRET || req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
  const u = (await req.json().catch(() => null)) as any;
  if (!u) return new Response("ok");
  ctx.waitUntil(processUpdate(env, u).catch(() => {}));
  return new Response("ok");
}

async function processUpdate(env: Env, u: any) {
  if (u.callback_query) return onCallback(env, u.callback_query);
  const msg = u.message;
  if (!msg?.text || msg.chat?.type !== "private") return;
  const chat: number = msg.chat.id;
  const text: string = msg.text.trim();
  const [cmd, ...rest] = text.split(/\s+/);
  const command = cmd.split("@")[0].toLowerCase();

  if (command === "/start") {
    if (await isAdmin(env, chat)) return send(env, chat, HELP);
    if (env.ADMIN_CODE && rest[0] === env.ADMIN_CODE) {
      await env.DB.prepare("INSERT OR REPLACE INTO admins (chat_id, name, created) VALUES (?, ?, ?)").bind(chat, [msg.from?.first_name, msg.from?.username].filter(Boolean).join(" @"), Date.now()).run();
      return send(env, chat, "âś… Đ’Đ°Ń Đ´ĐľĐ´Đ°Đ˝Đľ ŃŹĐş Đ°Đ´ĐĽŃ–Đ˝Ń–ŃŃ‚Ń€Đ°Ń‚ĐľŃ€Đ°.\n\n" + HELP);
    }
    return send(env, chat, "Đ”ĐľŃŃ‚ŃĐż Đ»Đ¸ŃĐµ Đ´Đ»ŃŹ Đ°Đ´ĐĽŃ–Đ˝Ń–ŃŃ‚Ń€Đ°Ń‚ĐľŃ€Ń–Đ˛ TransferLux.");
  }
  if (!(await isAdmin(env, chat))) return send(env, chat, "Đ”ĐľŃŃ‚ŃĐż Đ»Đ¸ŃĐµ Đ´Đ»ŃŹ Đ°Đ´ĐĽŃ–Đ˝Ń–ŃŃ‚Ń€Đ°Ń‚ĐľŃ€Ń–Đ˛ TransferLux.");

  switch (command) {
    case "/help": return send(env, chat, HELP);
    case "/add": {
      // last three tokens: date time seats; everything before is the route
      if (rest.length < 5) return send(env, chat, "Đ¤ĐľŃ€ĐĽĐ°Ń‚: /add ĐšĐ¸Ń—Đ˛ Đ’Đ°Ń€ŃĐ°Đ˛Đ° 05.12 08:00 8");
      const seats = parseInt(rest[rest.length - 1], 10);
      const time = parseTime(rest[rest.length - 2]);
      const date = parseDate(rest[rest.length - 3]);
      const r = parseRoute(rest.slice(0, -3).join(" "));
      if (!r.from || !r.to) return send(env, chat, "ĐťĐµ Đ˛ĐżŃ–Đ·Đ˝Đ°Đ˛ ĐĽŃ–ŃŃ‚Đ°. ĐźŃ€Đ¸ĐşĐ»Đ°Đ´: /add ĐšĐ¸Ń—Đ˛ Đ’Đ°Ń€ŃĐ°Đ˛Đ° 05.12 08:00 8");
      if (!date || !time || !(seats > 0 && seats < 100)) return send(env, chat, "ĐźĐµŃ€ĐµĐ˛Ń–Ń€Ń‚Đµ Đ´Đ°Ń‚Ń (05.12), Ń‡Đ°Ń (08:00) Ń– ĐşŃ–Đ»ŃŚĐşŃ–ŃŃ‚ŃŚ ĐĽŃ–ŃŃ†ŃŚ.");
      const t = await env.DB.prepare("INSERT INTO trips (from_id, to_id, depart_date, depart_time, seats_total, seats_free, created) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *").bind(r.from.id, r.to.id, date, time, seats, seats, Date.now()).first<Record<string, any>>();
      return send(env, chat, "âś… Đ ĐµĐąŃ Đ´ĐľĐ´Đ°Đ˝Đľ, Đ˛Ń–Đ˝ ŃĐ¶Đµ Đ˝Đ° ŃĐ°ĐąŃ‚Ń–.\n\n" + tripText(t!), tripKb(t!));
    }
    case "/trips": {
      const rows = await env.DB.prepare("SELECT * FROM trips WHERE status = 'active' AND depart_date >= date('now') ORDER BY depart_date, depart_time LIMIT 15").all<Record<string, any>>();
      if (!rows.results.length) return send(env, chat, "ĐĐşŃ‚Đ¸Đ˛Đ˝Đ¸Ń… Ń€ĐµĐąŃŃ–Đ˛ Đ˝ĐµĐĽĐ°Ń”. Đ”ĐľĐ´Đ°ĐąŃ‚Đµ: /add ĐšĐ¸Ń—Đ˛ Đ’Đ°Ń€ŃĐ°Đ˛Đ° 05.12 08:00 8");
      for (const t of rows.results) await send(env, chat, tripText(t), tripKb(t));
      return;
    }
    case "/seats": {
      const id = parseInt(rest[0], 10), n = parseInt(rest[1], 10);
      if (!(id > 0) || !(n >= 0 && n < 100)) return send(env, chat, "Đ¤ĐľŃ€ĐĽĐ°Ń‚: /seats 12 5");
      const t = await env.DB.prepare("UPDATE trips SET seats_free = ?, seats_total = MAX(seats_total, ?) WHERE id = ? RETURNING *").bind(n, n, id).first<Record<string, any>>();
      return t ? send(env, chat, "ĐžĐ˝ĐľĐ˛Đ»ĐµĐ˝Đľ.\n\n" + tripText(t), tripKb(t)) : send(env, chat, "Đ ĐµĐąŃ Đ˝Đµ Đ·Đ˝Đ°ĐąĐ´ĐµĐ˝Đľ.");
    }
    case "/move": {
      const id = parseInt(rest[0], 10), date = parseDate(rest[1] ?? ""), time = parseTime(rest[2] ?? "");
      if (!(id > 0) || !date || !time) return send(env, chat, "Đ¤ĐľŃ€ĐĽĐ°Ń‚: /move 12 06.12 09:30");
      const t = await env.DB.prepare("UPDATE trips SET depart_date = ?, depart_time = ? WHERE id = ? RETURNING *").bind(date, time, id).first<Record<string, any>>();
      return t ? send(env, chat, "ĐžĐ˝ĐľĐ˛Đ»ĐµĐ˝Đľ. ĐźĐľĐ˛Ń–Đ´ĐľĐĽŃ‚Đµ ĐżĐ°ŃĐ°Đ¶Đ¸Ń€Ń–Đ˛ ĐżŃ€Đľ Đ·ĐĽŃ–Đ˝Ń.\n\n" + tripText(t), tripKb(t)) : send(env, chat, "Đ ĐµĐąŃ Đ˝Đµ Đ·Đ˝Đ°ĐąĐ´ĐµĐ˝Đľ.");
    }
    case "/cancel": {
      const id = parseInt(rest[0], 10);
      if (!(id > 0)) return send(env, chat, "Đ¤ĐľŃ€ĐĽĐ°Ń‚: /cancel 12");
      return cancelTrip(env, chat, id);
    }
    case "/bookings": {
      const rows = await env.DB.prepare("SELECT id FROM bookings WHERE status = 'pending' ORDER BY id DESC LIMIT 15").all<{ id: number }>();
      if (!rows.results.length) return send(env, chat, "ĐťĐľĐ˛Đ¸Ń… Đ·Đ°ŃŹĐ˛ĐľĐş Đ˝ĐµĐĽĐ°Ń”.");
      for (const r of rows.results) { const c = await bookingCard(env, r.id); await send(env, chat, c.text, c.kb); }
      return;
    }
    case "/all": {
      const rows = await env.DB.prepare("SELECT id, kind, from_text, to_text, travel_date, name, status FROM bookings ORDER BY id DESC LIMIT 20").all<Record<string, any>>();
      if (!rows.results.length) return send(env, chat, "Đ—Đ°ŃŹĐ˛ĐľĐş Ń‰Đµ Đ˝ĐµĐĽĐ°Ń”.");
      const lines = rows.results.map((b) => `#${b.id} ${STATUS[b.status]?.split(" ")[0] ?? ""} ${esc(CITY_BY_ID[b.from_text]?.name.uk ?? b.from_text)} â†’ ${esc(CITY_BY_ID[b.to_text]?.name.uk ?? b.to_text)} ${b.travel_date ? fmtDate(b.travel_date) : ""} Â· ${esc(b.name)}`);
      return send(env, chat, lines.join("\n"));
    }
    default:
      return send(env, chat, HELP);
  }
}

async function cancelTrip(env: Env, chat: number, id: number) {
  const t = await env.DB.prepare("UPDATE trips SET status = 'cancelled' WHERE id = ? AND status = 'active' RETURNING *").bind(id).first<Record<string, any>>();
  if (!t) return send(env, chat, "Đ ĐµĐąŃ Đ˝Đµ Đ·Đ˝Đ°ĐąĐ´ĐµĐ˝Đľ Đ°Đ±Đľ Đ˛Đ¶Đµ ŃĐşĐ°ŃĐľĐ˛Đ°Đ˝Đľ.");
  const affected = await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE trip_id = ? AND status IN ('pending','confirmed') RETURNING id, name, phone").bind(id).all<Record<string, any>>();
  let note = "";
  if (affected.results.length) note = "\n\nĐ—Đ°ŃŹĐ˛ĐşĐ¸ ŃĐşĐ°ŃĐľĐ˛Đ°Đ˝Đľ, Đ·Đ˛'ŃŹĐ¶Ń–Ń‚ŃŚŃŃŹ Đ· ĐżĐ°ŃĐ°Đ¶Đ¸Ń€Đ°ĐĽĐ¸:\n" + affected.results.map((b) => `#${b.id} ${esc(b.name)} ${esc(b.phone)}`).join("\n");
  return send(env, chat, "đźš« Đ ĐµĐąŃ ŃĐşĐ°ŃĐľĐ˛Đ°Đ˝Đľ, Đ˝Đ° ŃĐ°ĐąŃ‚Ń– ĐąĐľĐłĐľ Đ±Ń–Đ»ŃŚŃĐµ Đ˝ĐµĐĽĐ°Ń”.\n\n" + tripText(t) + note);
}

async function onCallback(env: Env, q: any) {
  const chat: number = q.message?.chat?.id;
  const msgId: number = q.message?.message_id;
  const answer = (text: string) => tg(env, "answerCallbackQuery", { callback_query_id: q.id, text });
  if (!chat || !(await isAdmin(env, chat))) return answer("ĐťĐµĐĽĐ°Ń” Đ´ĐľŃŃ‚ŃĐżŃ");
  const [k, a, b] = String(q.data || "").split(":");
  const id = parseInt(a, 10);

  if (k === "s") {
    const d = parseInt(b, 10);
    const t = await env.DB.prepare("UPDATE trips SET seats_free = MAX(0, seats_free + ?), seats_total = MAX(seats_total, seats_free + ?) WHERE id = ? AND status = 'active' RETURNING *").bind(d, d, id).first<Record<string, any>>();
    if (!t) return answer("Đ ĐµĐąŃ Đ˝ĐµĐ´ĐľŃŃ‚ŃĐżĐ˝Đ¸Đą");
    await tg(env, "editMessageText", { chat_id: chat, message_id: msgId, text: tripText(t), parse_mode: "HTML", reply_markup: { inline_keyboard: tripKb(t) } });
    return answer(`Đ’Ń–Đ»ŃŚĐ˝Đľ ${t.seats_free}`);
  }
  if (k === "tc") {
    await answer("ĐˇĐşĐ°ŃĐľĐ˛ŃŃŽ Ń€ĐµĐąŃ");
    return cancelTrip(env, chat, id);
  }
  if (k === "tb") {
    await answer("Đ—Đ°ŃŹĐ˛ĐşĐ¸ Ń€ĐµĐąŃŃ");
    const rows = await env.DB.prepare("SELECT id FROM bookings WHERE trip_id = ? ORDER BY id").bind(id).all<{ id: number }>();
    if (!rows.results.length) return send(env, chat, `ĐťĐ° Ń€ĐµĐąŃ #${id} Đ·Đ°ŃŹĐ˛ĐľĐş Đ˝ĐµĐĽĐ°Ń”.`);
    for (const r of rows.results) { const c = await bookingCard(env, r.id); await send(env, chat, c.text, c.kb); }
    return;
  }
  if (k === "bc" || k === "br" || k === "bx") {
    const b = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first<Record<string, any>>();
    if (!b) return answer("Đ—Đ°ŃŹĐ˛ĐşŃ Đ˝Đµ Đ·Đ˝Đ°ĐąĐ´ĐµĐ˝Đľ");
    if (k === "bc") {
      if (b.status !== "pending") return answer("ĐˇŃ‚Đ°Ń‚ŃŃ ŃĐ¶Đµ Đ·ĐĽŃ–Đ˝ĐµĐ˝Đľ");
      await env.DB.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ? AND status = 'pending'").bind(id).run();
    } else {
      const from = k === "br" ? "pending" : "confirmed";
      const res = await env.DB.prepare(`UPDATE bookings SET status = ? WHERE id = ? AND status = ? RETURNING id`).bind(k === "br" ? "rejected" : "cancelled", id, from).first();
      if (!res) return answer("ĐˇŃ‚Đ°Ń‚ŃŃ ŃĐ¶Đµ Đ·ĐĽŃ–Đ˝ĐµĐ˝Đľ");
      // release held seats back to the trip
      if (b.trip_id) await env.DB.prepare("UPDATE trips SET seats_free = MIN(seats_total, seats_free + ?) WHERE id = ?").bind(b.adults + b.children, b.trip_id).run();
    }
    const c = await bookingCard(env, id);
    await tg(env, "editMessageText", { chat_id: chat, message_id: msgId, text: c.text, parse_mode: "HTML", reply_markup: { inline_keyboard: c.kb } });
    return answer(k === "bc" ? "ĐźŃ–Đ´Ń‚Đ˛ĐµŃ€Đ´Đ¶ĐµĐ˝Đľ. Đ—Đ˛'ŃŹĐ¶Ń–Ń‚ŃŚŃŃŹ Đ· ĐşĐ»Ń–Ń”Đ˝Ń‚ĐľĐĽ." : "Đ“ĐľŃ‚ĐľĐ˛Đľ");
  }
  return answer("");
}
