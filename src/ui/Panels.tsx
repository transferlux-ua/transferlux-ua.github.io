import { useEffect, useState } from "react";
import { CITY_BY_ID } from "../../shared/cities";
import { api, type Trip } from "../api";
import { CONTACTS, LOCALE, type Lang, type T } from "../i18n";
import { Chevron, Phone, Telegram, WhatsApp } from "./Icons";

const FLEET = {
  sprinter: {
    title: "Mercedes-Benz Sprinter",
    exterior: ["sprinter-white-two", "sprinter-black-door"],
    interior: ["sprinter-interior-light", "seat-recliner-closeup", "seats-three-light", "interior-light-vip", "interior-white-diamond", "seats-grey-vip", "interior-turquoise", "interior-purple", "interior-brown-orange", "seat-detail-gold"]
  },
  vw: { title: "Volkswagen", exterior: ["vw-black-exterior"], interior: ["vw-interior-brown"] }
};

export function Fleet({ t }: { t: T }) {
  const [car, setCar] = useState<keyof typeof FLEET>("sprinter");
  const [view, setView] = useState<"exterior" | "interior">("exterior");
  const [i, setI] = useState(0);
  const list = FLEET[car][view];
  const img = list[Math.min(i, list.length - 1)];
  const go = (d: number) => setI((x) => (x + d + list.length) % list.length);
  return (
    <div className="fleet">
      <p className="lead">{t.fleetLead}</p>
      <div className="seg seg--sm">
        {(Object.keys(FLEET) as (keyof typeof FLEET)[]).map((k) => (
          <button key={k} type="button" className={car === k ? "is-on" : ""} aria-selected={car === k} onClick={() => { setCar(k); setI(0); }}>{FLEET[k].title}</button>
        ))}
      </div>
      <div className="gallery">
        <img key={img} src={`/img/${img}.jpg`} srcSet={`/img/${img}-640.jpg 640w, /img/${img}.jpg 1280w`} sizes="(max-width: 760px) 100vw, 640px" alt={`${FLEET[car].title}, ${view === "exterior" ? t.exterior : t.interior}`} />
        <div className="gallery__bar">
          <div className="seg seg--sm seg--glass">
            <button type="button" className={view === "exterior" ? "is-on" : ""} onClick={() => { setView("exterior"); setI(0); }}>{t.exterior}</button>
            <button type="button" className={view === "interior" ? "is-on" : ""} onClick={() => { setView("interior"); setI(0); }}>{t.interior}</button>
          </div>
          {list.length > 1 && (
            <div className="gallery__nav">
              <button type="button" className="icon-btn icon-btn--glass" aria-label="prev" onClick={() => go(-1)}><Chevron style={{ transform: "rotate(180deg)" }} /></button>
              <span>{Math.min(i, list.length - 1) + 1} / {list.length}</span>
              <button type="button" className="icon-btn icon-btn--glass" aria-label="next" onClick={() => go(1)}><Chevron /></button>
            </div>
          )}
        </div>
      </div>
      {list.length > 1 && (
        <div className="thumbs">
          {list.map((k, n) => (
            <button key={k} type="button" className={n === i ? "is-on" : ""} onClick={() => setI(n)} aria-label={`${n + 1}`}>
              <img src={`/img/${k}-640.jpg`} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <p className="muted small">{t.photoNote}</p>
    </div>
  );
}

export function Trips({ lang, t, onPick }: { lang: Lang; t: T; onPick: (from: string, to: string) => void }) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.upcoming().then((r) => setTrips(r.trips)).catch(() => { setTrips([]); setFailed(true); }); }, []);
  if (trips === null) return <div className="loading"><span className="spinner" aria-hidden="true" /></div>;
  if (!trips.length) return <div className="notice"><p>{t.tripsEmpty}</p><ContactsMini t={t} /></div>;
  return (
    <ul className="trip-list">
      {trips.map((tr) => (
        <li key={tr.id}>
          <button type="button" className="trip trip--wide" disabled={tr.seats_free === 0} onClick={() => onPick(tr.from_id, tr.to_id)}>
            <span className="trip__route">{CITY_BY_ID[tr.from_id]?.name[lang]}  {CITY_BY_ID[tr.to_id]?.name[lang]}</span>
            <span className="trip__date">{new Date(tr.depart_date + "T12:00:00").toLocaleDateString(LOCALE[lang], { weekday: "short", day: "numeric", month: "long" })}<b>{tr.depart_time}</b></span>
            <span className={`trip__seats${tr.seats_free === 0 ? " is-low" : ""}`}>{t.seatsLeft(tr.seats_free)}</span>
            <span className="trip__cta"><Chevron /></span>
          </button>
        </li>
      ))}
      {failed && null}
    </ul>
  );
}

export function Team({ t }: { t: T }) {
  return (
    <div className="team">
      <img src="/img/team-drivers.jpg" alt={t.teamTitle} width={1099} height={1280} loading="lazy" />
      <p className="lead">{t.teamText}</p>
    </div>
  );
}

export function ContactsMini({ t }: { t: T }) {
  return (
    <div className="contact-row">
      <a className="btn btn--ghost" href={CONTACTS.telegram} target="_blank" rel="noopener"><Telegram />{CONTACTS.telegramLabel}</a>
      <a className="btn btn--ghost" href={CONTACTS.whatsapp} target="_blank" rel="noopener"><WhatsApp />WhatsApp</a>
    </div>
  );
}

export function Contacts({ t }: { t: T }) {
  return (
    <div className="contacts">
      <p className="contacts__who">{t.manager}</p>
      <a className="contact" href={`tel:${CONTACTS.phone}`}><Phone /><span><b>{CONTACTS.phoneLabel}</b><small>{t.call}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.whatsapp} target="_blank" rel="noopener"><WhatsApp /><span><b>WhatsApp</b><small>{CONTACTS.phoneLabel}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.telegram} target="_blank" rel="noopener"><Telegram /><span><b>Telegram</b><small>{CONTACTS.telegramLabel}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.channel} target="_blank" rel="noopener"><Telegram /><span><b>{t.channel}</b><small>t.me/TransferLux</small></span><Chevron /></a>
    </div>
  );
}
