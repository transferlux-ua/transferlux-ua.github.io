import { useState } from "react";
import { CONTACTS, type T } from "../i18n";
import { Chevron, Mail, Phone, Telegram, WhatsApp } from "./Icons";
import { Lightbox } from "./Lightbox";

/* Fleet: every vehicle is shown the same way, one exterior photo first, then its interior.
   Photos live in /img/fleet/<id>-<n>.jpg (n = 1 is the exterior). Licence plates are replaced
   with a TransferLux plate, every photo has a small TL mark in the bottom left corner. */
type Car = { id: string; name: (t: T) => string; count: number; square?: boolean; pos?: string };
const CARS: Car[] = [
  { id: "sprinter-black", name: (t) => t.fleetBlack, count: 4, pos: "50% 82%" },
  { id: "sprinter-white", name: (t) => t.fleetWhite, count: 4, pos: "50% 62%" },
  { id: "vclass", name: () => "Mercedes‑Benz V‑Class", count: 7, square: true }
];
const src = (id: string, n: number, small?: boolean) => `/img/fleet/${id}-${n}${small ? "-640" : ""}.jpg`;

function CarCard({ car, t }: { car: Car; t: T }) {
  const [open, setOpen] = useState<number | null>(null);
  const name = car.name(t);
  const nums = Array.from({ length: car.count }, (_, i) => i + 1);
  return (
    <article className={`car${car.square ? " car--square" : ""}`}>
      <h3 className="car__name">{name}</h3>
      <div className="car__grid">
        {nums.map((n, i) => (
          <button key={n} type="button" className={`car__tile${n === 1 ? " car__tile--ext" : ""}`} onClick={() => setOpen(i)}
            aria-label={`${name}, ${n === 1 ? t.exterior : t.interior} ${n === 1 ? "" : n - 1}`.trim()}>
            <img src={src(car.id, n, true)} alt={`${name}, ${n === 1 ? t.exterior : t.interior}`} loading="lazy" decoding="async"
              style={n === 1 && car.pos ? { objectPosition: car.pos } : undefined} />
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox srcs={nums.map((n) => src(car.id, n))} index={open} onIndex={setOpen} onClose={() => setOpen(null)}
          title={name} closeLabel={t.close} prevLabel={t.prev} nextLabel={t.next} />
      )}
    </article>
  );
}

export function Fleet({ t }: { t: T }) {
  return (
    <div className="fleet">
      {CARS.map((c) => <CarCard key={c.id} car={c} t={t} />)}
      <p className="muted fleet__ask">{t.fleetAsk}</p>
    </div>
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

export function Contacts({ t }: { t: T }) {
  return (
    <div className="contacts">
      <p className="contacts__who">{t.manager}</p>
      <a className="contact" href={`tel:${CONTACTS.phone}`}><Phone /><span><b>{CONTACTS.phoneLabel}</b><small>{t.call}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.whatsapp} target="_blank" rel="noopener"><WhatsApp /><span><b>WhatsApp</b><small>{CONTACTS.phoneLabel}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.telegram} target="_blank" rel="noopener"><Telegram /><span><b>Telegram</b><small>{CONTACTS.telegramLabel}</small></span><Chevron /></a>
      <a className="contact" href={`mailto:${CONTACTS.email}`}><Mail /><span><b>{t.email}</b><small>{CONTACTS.email}</small></span><Chevron /></a>
      <a className="contact" href={CONTACTS.channel} target="_blank" rel="noopener"><Telegram /><span><b>{t.channel}</b><small>t.me/TransferLux</small></span><Chevron /></a>
    </div>
  );
}
