import { CONTACTS, type T } from "../i18n";
import { Chevron, Mail, Phone, Telegram, WhatsApp } from "./Icons";

/* Fleet: a short selection on purpose. More photos and the choice of a vehicle go through the manager.
   BLACK gets the new exterior photo of the black Sprinter first once it is added to /img. */
const MAIN = "sprinter-white-two";
const BLACK = ["sprinter-black-door"];
const WHITE = ["seat-recliner-closeup", "interior-white-diamond"];
const VCLASS_MAIN = "vclass-01";
const VCLASS = ["vclass-02", "vclass-03", "vclass-04", "vclass-05", "vclass-06", "vclass-07"];

function Photo({ name, alt, wide }: { name: string; alt: string; wide?: boolean }) {
  return (
    <img className={wide ? "fleet__main" : undefined} src={`/img/${name}.jpg`} srcSet={`/img/${name}-640.jpg 640w, /img/${name}.jpg 1280w`}
      sizes={wide ? "(max-width: 760px) 100vw, 720px" : "(max-width: 760px) 50vw, 360px"} alt={alt} loading="lazy" decoding="async" />
  );
}

export function Fleet({ t }: { t: T }) {
  return (
    <div className="fleet">
      <p className="lead">{t.fleetLead}</p>
      <Photo name={MAIN} alt="Mercedes-Benz Sprinter TransferLux" wide />
      <section className="fleet__group">
        <h3>{t.fleetBlack}</h3>
        <div className={`fleet__grid${BLACK.length === 1 ? " fleet__grid--one" : ""}`}>{BLACK.map((p) => <Photo key={p} name={p} alt={t.fleetBlack} />)}</div>
      </section>
      <section className="fleet__group">
        <h3>{t.fleetWhite}</h3>
        <div className="fleet__grid">{WHITE.map((p) => <Photo key={p} name={p} alt={t.fleetWhite} />)}</div>
      </section>
      <section className="fleet__group">
        <h3>Mercedes-Benz V-Class</h3>
        <Photo name={VCLASS_MAIN} alt="Mercedes-Benz V-Class TransferLux" wide />
        <div className="fleet__grid fleet__grid--square">{VCLASS.map((p) => <Photo key={p} name={p} alt="Mercedes-Benz V-Class" />)}</div>
      </section>
      <div className="notice">
        <p>{t.fleetAsk}</p>
      </div>
      <Contacts t={t} />
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
