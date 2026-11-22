import { useEffect, useMemo, useRef, useState } from "react";
import { parseRoute, suggestCities } from "../../shared/parse";
import { CITY_BY_ID, type City } from "../../shared/cities";
import { quote, toUah, fmtEur, fmtUah } from "../../shared/price";
import { api, newIdem, type RouteInfo, type Rate, type Trip } from "../api";
import { LOCALE, CONTACTS, type Lang, type T } from "../i18n";
import { Sheet } from "./Sheet";
import { Swap, Minus, Plus, Chevron, Telegram, WhatsApp, Phone, Mail } from "./Icons";
import { Contacts } from "./Panels";

type Mode = "regular" | "individual";
const cityName = (c: City | null, lang: Lang) => (c ? c.name[lang] : "");

function todayISO(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function fmtDuration(min: number, t: T) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} ${t.hours} ${m} ${t.minutes}` : `${h} ${t.hours}`;
}
function fmtDate(iso: string, lang: Lang) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(LOCALE[lang], { weekday: "short", day: "numeric", month: "long" });
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <span className="field__label">{label}</span>
      <div className="stepper__ctrl">
        <button type="button" className="icon-btn" aria-label={`${label} -`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus /></button>
        <output aria-live="polite">{value}</output>
        <button type="button" className="icon-btn" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus /></button>
      </div>
    </div>
  );
}

/** Typed city field with suggestions. Any text is accepted: known cities resolve to an id, others go to the geocoder. */
function CityInput({ value, label, ph, lang, onText, onPick }: { value: string; label: string; ph: string; lang: Lang; onText: (v: string) => void; onPick: (c: City) => void }) {
  const [focus, setFocus] = useState(false);
  const [hi, setHi] = useState(-1);
  const list = useMemo(() => suggestCities(value, 6), [value]);
  // hide the list when the text already is exactly one suggestion
  const exact = list.length > 0 && list[0].name[lang].toLowerCase() === value.trim().toLowerCase();
  const show = focus && list.length > 0 && !exact;
  const pick = (c: City) => { onPick(c); setHi(-1); setFocus(false); };
  return (
    <div className="pill-wrap">
      <label className="pill city-in">
        <span className="pill__k">{label}</span>
        <input value={value} placeholder={ph} autoComplete="off" spellCheck={false} enterKeyHint="next"
          role="combobox" aria-expanded={show} aria-autocomplete="list"
          onChange={(e) => { onText(e.target.value); setHi(-1); setFocus(true); }}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(list.length - 1, h + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
            else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); pick(list[hi]); }
            else if (e.key === "Escape") setFocus(false);
          }} />
      </label>
      {show && (
        <div className="pop" role="listbox">
          {list.map((c, i) => (
            <button type="button" role="option" aria-selected={i === hi} key={c.id} className={`pop__item${i === hi ? " is-hi" : ""}`}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)}>
              {c.name[lang]}<small>{c.cc}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A single field resolves to a dictionary city when it clearly names one. */
function resolveCity(text: string): City | null {
  if (text.trim().length < 2) return null;
  const r = parseRoute(text);
  return r.from && !r.to && r.unknown.length === 0 ? r.from : null;
}

export interface SearchState { fromText: string; toText: string; date: string; adults: number; children: number; mode: Mode }

export function Search({ lang, t, preset, autoOpen }: { lang: Lang; t: T; preset?: { from: string; to: string }; autoOpen?: boolean }) {
  const [s, setS] = useState<SearchState>(() => ({
    fromText: preset ? CITY_BY_ID[preset.from].name[lang] : "",
    toText: preset ? CITY_BY_ID[preset.to].name[lang] : "",
    date: "", adults: 1, children: 0, mode: "regular"
  }));
  // the page is pre rendered at build time, so the default date is set in the browser
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  useEffect(() => {
    setMinDate(todayISO());
    setS((p) => (p.date ? p : { ...p, date: todayISO(1) }));
  }, []);
  const [open, setOpen] = useState(!!autoOpen);
  const from = useMemo(() => resolveCity(s.fromText), [s.fromText]);
  const to = useMemo(() => resolveCity(s.toText), [s.toText]);

  const set = (patch: Partial<SearchState>) => setS((p) => ({ ...p, ...patch }));
  // free text fallback for cities outside the dictionary (the server geocodes them)
  const fromQ = from?.id ?? s.fromText.trim();
  const toQ = to?.id ?? s.toText.trim();
  const canGo = fromQ.length >= 2 && toQ.length >= 2 && fromQ !== toQ && !!s.date;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (canGo) setOpen(true); };

  return (
    <>
      <form className="search" onSubmit={submit} noValidate>
        <div className="seg" role="tablist" aria-label={t.modeRegular}>
          {(["regular", "individual"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={s.mode === m} className={s.mode === m ? "is-on" : ""} onClick={() => set({ mode: m })}>
              {m === "regular" ? t.modeRegular : t.modeIndividual}
            </button>
          ))}
        </div>
        {s.mode === "individual" ? (
          <div className="ask">
            <p className="ask__title">{t.askTitle}</p>
            <p className="muted">{t.askText}</p>
            <Contacts t={t} />
          </div>
        ) : (<>
        <div className="route-pills">
          <CityInput value={s.fromText} label={t.from} ph={t.fromPh} lang={lang} onText={(v) => set({ fromText: v })} onPick={(c) => set({ fromText: c.name[lang] })} />
          <button type="button" className="icon-btn swap" aria-label={t.swap} onClick={() => set({ fromText: s.toText, toText: s.fromText })}><Swap /></button>
          <CityInput value={s.toText} label={t.to} ph={t.toPh} lang={lang} onText={(v) => set({ toText: v })} onPick={(c) => set({ toText: c.name[lang] })} />
        </div>
        <div className="search__row">
          <label className="field field--date">
            <span className="field__label">{t.date}</span>
            <input type="date" value={s.date} min={minDate} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <Stepper label={t.adults} value={s.adults} min={1} max={20} onChange={(v) => set({ adults: v })} />
          <Stepper label={t.children} value={s.children} min={0} max={20} onChange={(v) => set({ children: v })} />
        </div>
        <button className="btn btn--primary btn--block" type="submit" disabled={!canGo}>
          {t.searchBtn}<Chevron />
        </button>
        </>)}
      </form>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${cityName(from, lang) || fromQ}  ${cityName(to, lang) || toQ}`} closeLabel={t.close}>
        <Result lang={lang} t={t} s={s} fromQ={fromQ} toQ={toQ} onMode={(m) => set({ mode: m })} />
      </Sheet>
    </>
  );
}

function Result({ lang, t, s, fromQ, toQ, onMode }: { lang: Lang; t: T; s: SearchState; fromQ: string; toQ: string; onMode: (m: Mode) => void }) {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rate, setRate] = useState<Rate | null | "down">(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const loc = LOCALE[lang];

  useEffect(() => {
    let live = true;
    setRoute(null); setErr(null); setTrips(null); setTrip(null);
    api.route(fromQ, toQ).then((r) => live && setRoute(r)).catch((e) => live && setErr(e.code === "no_road_route" ? t.errRoute : /not_found/.test(e.code) ? t.errPlace : t.errRouteDown));
    api.rate().then((r) => live && setRate(r)).catch(() => live && setRate("down"));
    return () => { live = false; };
  }, [fromQ, toQ]);

  useEffect(() => {
    if (s.mode !== "regular" || !route || !CITY_BY_ID[route.from.id] || !CITY_BY_ID[route.to.id]) { setTrips([]); return; }
    let live = true;
    api.trips(route.from.id, route.to.id, s.date).then((r) => live && setTrips(r.trips)).catch(() => live && setTrips([]));
    return () => { live = false; };
  }, [route, s.date, s.mode]);

  if (err) return <div className="notice notice--warn"><p>{err}</p><ContactRow t={t} /></div>;
  if (!route) return <div className="loading"><span className="spinner" aria-hidden="true" />{t.loading}</div>;

  const q = quote(route.km, s.adults, s.children);
  const r = rate && rate !== "down" ? rate : null;
  const viaName = route.via ? route.via.name[lang] : null;

  return (
    <div className="result">
      <dl className="facts">
        <div><dt>{t.distanceRoad}</dt><dd>{new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(route.km)} {t.km}</dd></div>
        <div><dt>{t.onRoad}</dt><dd>{fmtDuration(route.minutes, t)}<small>{t.noBorder}</small></dd></div>
        {viaName && <div><dt>{t.via}</dt><dd>{viaName}</dd></div>}
      </dl>

      {s.mode === "regular" && (
        <div className="price">
          <div className="price__row"><span>{t.adultTicket}</span><b>{fmtEur(q.adultCents, loc)}</b>{r && <em>{fmtUah(toUah(q.adultCents, r.rate), loc)}</em>}</div>
          <div className="price__row"><span>{t.childTicket}</span><b>{fmtEur(q.childCents, loc)}</b>{r && <em>{fmtUah(toUah(q.childCents, r.rate), loc)}</em>}</div>
          <div className="price__row price__row--total"><span>{t.total}<small>{t.passengers(s.adults, s.children)}</small></span><b>{fmtEur(q.totalCents, loc)}</b>{r && <em>{fmtUah(toUah(q.totalCents, r.rate), loc)}</em>}</div>
          <p className="price__note">{r ? t.rateNote(new Intl.NumberFormat(loc, { minimumFractionDigits: 4 }).format(r.rate), r.date) : rate === "down" ? t.rateDown : ""}</p>
        </div>
      )}

      {s.mode === "regular" && !trip && (
        <section className="trips">
          <h3>{t.tripsTitle}</h3>
          {trips === null ? <div className="loading"><span className="spinner" aria-hidden="true" /></div> : trips.length === 0 ? (
            <div className="notice"><p>{t.noTrips}</p><p className="muted">{t.noTripsHint}</p><button type="button" className="btn btn--ghost" onClick={() => onMode("individual")}>{t.requestIndividual}</button></div>
          ) : (
            <ul className="trip-list">
              {trips.map((tr) => (
                <li key={tr.id}>
                  <button type="button" className="trip" disabled={tr.seats_free < s.adults + s.children} onClick={() => setTrip(tr)}>
                    <span className="trip__date">{fmtDate(tr.depart_date, lang)}<b>{tr.depart_time}</b></span>
                    <span className={`trip__seats${tr.seats_free < s.adults + s.children ? " is-low" : ""}`}>{t.seatsLeft(tr.seats_free)}</span>
                    <span className="trip__cta">{t.choose}<Chevron /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {s.mode === "regular" && trip && (
        <BookingForm lang={lang} t={t} kind="regular" s={s} route={route} trip={trip} onBack={() => setTrip(null)} />
      )}
      {s.mode === "individual" && <DirectContact lang={lang} t={t} s={s} route={route} />}
    </div>
  );
}

/** Individual trip: no price, the client writes to the manager in the channel he prefers. */
function DirectContact({ lang, t, s, route }: { lang: Lang; t: T; s: SearchState; route: RouteInfo }) {
  const a = CITY_BY_ID[route.from.id]?.name[lang] ?? route.from.label;
  const b = CITY_BY_ID[route.to.id]?.name[lang] ?? route.to.label;
  const msg = t.msgIndividual(a, b, fmtDate(s.date, lang), t.passengers(s.adults, s.children));
  const enc = encodeURIComponent(msg);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(msg).then(() => setCopied(true)).catch(() => {}); };
  return (
    <div className="direct">
      <p className="lead">{t.individualLead}</p>
      <div className="msg-preview">{msg}</div>
      <div className="contacts">
        <a className="contact" href={`${CONTACTS.telegram}?text=${enc}`} target="_blank" rel="noopener" onClick={copy}><Telegram /><span><b>Telegram</b><small>{CONTACTS.telegramLabel}</small></span><Chevron /></a>
        <a className="contact" href={`${CONTACTS.whatsapp}?text=${enc}`} target="_blank" rel="noopener"><WhatsApp /><span><b>WhatsApp</b><small>{CONTACTS.phoneLabel}</small></span><Chevron /></a>
        <a className="contact" href={`tel:${CONTACTS.phone}`}><Phone /><span><b>{t.call}</b><small>{CONTACTS.phoneLabel}</small></span><Chevron /></a>
        <a className="contact" href={`mailto:${CONTACTS.email}?subject=TransferLux&body=${enc}`}><Mail /><span><b>{t.email}</b><small>{CONTACTS.email}</small></span><Chevron /></a>
      </div>
      <p className="muted small">{copied ? t.msgCopied : t.msgHint}</p>
    </div>
  );
}

export function ContactRow({ t }: { t: T }) {
  return (
    <div className="contact-row">
      <a className="btn btn--ghost" href={CONTACTS.telegram} target="_blank" rel="noopener"><Telegram />{CONTACTS.telegramLabel}</a>
      <a className="btn btn--ghost" href={CONTACTS.whatsapp} target="_blank" rel="noopener"><WhatsApp />WhatsApp</a>
      <a className="btn btn--ghost" href={`mailto:${CONTACTS.email}`}><Mail />{t.email}</a>
    </div>
  );
}

function BookingForm({ lang, t, kind, s, route, trip, onBack }: { lang: Lang; t: T; kind: Mode; s: SearchState; route: RouteInfo; trip?: Trip; onBack?: () => void }) {
  const idem = useRef(newIdem());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("telegram");
  const [notes, setNotes] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [num, setNum] = useState<number | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2 || digits.length < 9 || digits.length > 15) { setErr(t.errValidation); return; }
    setErr(null); setState("sending");
    const base = { name, phone, contact, notes, lang, idem: idem.current, adults: s.adults, children: s.children, website: hp };
    try {
      const res = kind === "regular" && trip
        ? await api.booking({ ...base, trip_id: trip.id })
        : await api.request({ ...base, from: CITY_BY_ID[route.from.id]?.name.uk ?? route.from.label, to: CITY_BY_ID[route.to.id]?.name.uk ?? route.to.label, from_id: route.from.id, to_id: route.to.id, date: s.date, km: route.km });
      setNum(res.id); setState("done");
    } catch (x: any) {
      const c = x?.code;
      setErr(c === "validation" ? t.errValidation : c === "not_enough_seats" || c === "trip_not_available" ? t.errSeats : c === "already_booked" ? t.errDup : c === "rate_limited" ? t.errRate : t.errNet);
      setState("idle");
      if (c !== "validation") idem.current = newIdem();
    }
  };

  if (state === "done") {
    return (
      <div className="done" role="status">
        <p className="done__title">{t.okTitle}</p>
        <p className="done__num">{t.number}: <b>{num}</b></p>
        <p className="done__status">{t.okStatus}</p>
        <p className="muted">{kind === "regular" ? t.okText : t.okTextInd}</p>
      </div>
    );
  }
  return (
    <form className="book" onSubmit={send} noValidate>
      <div className="book__head">
        {onBack && <button type="button" className="link" onClick={onBack}>{t.tripsTitle}</button>}
        <h3>{t.bookTitle}</h3>
        {trip && <p className="muted">{fmtDate(trip.depart_date, lang)}, {trip.depart_time} · {t.seatsLeft(trip.seats_free)}</p>}
      </div>
      <label className="field"><span className="field__label">{t.name}</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} /></label>
      <label className="field"><span className="field__label">{t.phone}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+380" required maxLength={25} /></label>
      <fieldset className="chips">
        <legend className="field__label">{t.contactBy}</legend>
        {[["telegram", t.cTelegram], ["whatsapp", t.cWhatsapp], ["phone", t.cCall]].map(([v, l]) => (
          <label key={v} className={contact === v ? "is-on" : ""}><input type="radio" name="contact" value={v} checked={contact === v} onChange={() => setContact(v)} />{l}</label>
        ))}
      </fieldset>
      <label className="field"><span className="field__label">{t.notes}</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh} rows={2} maxLength={600} /></label>
      <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website" aria-hidden="true" />
      {err && <div className="notice notice--warn" role="alert"><p>{err}</p>{err === t.errNet && <ContactRow t={t} />}</div>}
      <button className="btn btn--primary btn--block" type="submit" disabled={state === "sending"}>{state === "sending" ? t.sending : t.send}</button>
      <p className="muted small">{t.termsAgree}</p>
    </form>
  );
}
