import { useCallback, useEffect, useState } from "react";
import { DICT, LANGS, LOCALE, PREFIX, CONTACTS, type Lang } from "./i18n";
import { CITY_BY_ID } from "../shared/cities";
import { quote, fmtEur } from "../shared/price";
import { CROSSING_NAMES } from "../shared/crossings";
import { SEO_ROUTES, HOME_ROUTES, slug, type SeoRoute } from "./seo";
import { Search, fmtDuration } from "./ui/Search";
import { Sheet } from "./ui/Sheet";
import { Scheme } from "./ui/Scheme";
import { Fleet, Trips, Team, Contacts } from "./ui/Panels";
import { Mark, Menu, Arrows, Telegram, WhatsApp, Phone } from "./ui/Icons";

type Panel = "fleet" | "trips" | "team" | "contacts" | "menu" | null;
export interface AppProps { lang: Lang; route?: SeoRoute | null }

export const pathFor = (lang: Lang, route?: SeoRoute | null) => PREFIX[lang] + (route ? `routes/${slug(route)}/` : "");

export function App({ lang: initialLang, route }: AppProps) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [panel, setPanel] = useState<Panel>(null);
  const [preset, setPreset] = useState<{ from: string; to: string; n: number } | null>(route ? { from: route.from, to: route.to, n: 0 } : null);
  const t = DICT[lang];
  const loc = LOCALE[lang];
  const close = useCallback(() => setPanel(null), []);

  const switchLang = (l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", pathFor(l, route) + location.hash);
      document.documentElement.lang = l;
      document.title = route ? `${t.routePageTitle(CITY_BY_ID[route.from].name[l], CITY_BY_ID[route.to].name[l])} | TransferLux` : DICT[l].metaTitle;
    }
  };
  useEffect(() => {
    document.title = route ? `${t.routePageTitle(CITY_BY_ID[route.from].name[lang], CITY_BY_ID[route.to].name[lang])} | TransferLux` : t.metaTitle;
  }, [lang]);

  const names: Record<string, string> = { ua: { uk: "Україна", ru: "Украина", en: "Ukraine" }[lang] };
  for (const k of ["paris", "brussels", "amsterdam", "berlin", "prague", "vienna", "milan", "warsaw", "budapest"]) names[k] = CITY_BY_ID[k].name[lang];

  const nav: [Panel, string][] = [["fleet", t.navFleet], ["trips", t.navTrips], ["team", t.navTeam], ["contacts", t.navContacts]];
  const r = route;
  const rFrom = r ? CITY_BY_ID[r.from].name[lang] : "";
  const rTo = r ? CITY_BY_ID[r.to].name[lang] : "";

  return (
    <>
      <header className="top">
        <a className="brand" href={PREFIX[lang]} aria-label="TransferLux">
          <Mark className="brand__mark" /><span className="brand__word">TransferLux</span>
        </a>
        <nav className="nav" aria-label="main">
          {nav.map(([k, l]) => <button key={k} type="button" onClick={() => setPanel(k)}>{l}</button>)}
        </nav>
        <div className="top__right">
          <div className="langs" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <a key={l} href={pathFor(l, route)} hrefLang={l} className={l === lang ? "is-on" : ""} aria-current={l === lang ? "true" : undefined}
                onClick={(e) => { e.preventDefault(); switchLang(l); }}>{l === "uk" ? "UA" : l.toUpperCase()}</a>
            ))}
          </div>
          <a className="icon-btn top__tg" href={CONTACTS.telegram} target="_blank" rel="noopener" aria-label="Telegram"><Telegram /></a>
          <button type="button" className="icon-btn top__menu" aria-label={t.menu} onClick={() => setPanel("menu")}><Menu /></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__text">
            {r ? (
              <>
                <p className="eyebrow">{t.heroA} <Arrows className="eyebrow__arrows" /> {t.heroB}</p>
                <h1 className="h1 h1--route">{t.routePageTitle(rFrom, rTo)}</h1>
              </>
            ) : (
              <>
                <h1 className="h1"><span>{t.heroA}</span><Arrows className="h1__arrows" /><span>{t.heroB}</span></h1>
                <p className="sub">{t.heroSub}</p>
              </>
            )}
            <Search key={preset ? `${preset.from}-${preset.to}-${preset.n}` : "s"} lang={lang} t={t} preset={preset ?? undefined} autoOpen={!!preset && preset.n > 0} />
          </div>
          <figure className="hero__media">
            <img src="/img/vw-black-exterior.jpg" srcSet="/img/vw-black-exterior-640.jpg 640w, /img/vw-black-exterior.jpg 1280w" sizes="(max-width: 900px) 100vw, 46vw" alt="TransferLux Volkswagen" {...{ fetchpriority: "high" }} width={1060} height={1280} />
            <div className="hero__scheme"><Scheme names={names} title={t.schemeTitle} /></div>
          </figure>
        </section>

        {r && (
          <section className="block route-facts">
            <h2 className="h2">{t.routeFacts}</h2>
            <dl className="facts facts--big">
              <div><dt>{t.distanceRoad}</dt><dd>{new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(r.km)} {t.km}</dd></div>
              <div><dt>{t.travelTime}</dt><dd>{fmtDuration(r.minutes, t)}<small>{t.noBorder}</small></dd></div>
              {r.via && <div><dt>{t.border}</dt><dd>{CROSSING_NAMES[r.via]?.[lang]}</dd></div>}
              <div><dt>{t.priceAdult}</dt><dd>{fmtEur(quote(r.km, 1, 0).adultCents, loc)}</dd></div>
              <div><dt>{t.priceChild}</dt><dd>{fmtEur(quote(r.km, 0, 1).childCents, loc)}</dd></div>
            </dl>
            <p className="prose">{t.routeText(rFrom, rTo, new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(r.km), fmtDuration(r.minutes, t), r.via ? CROSSING_NAMES[r.via]?.[lang] ?? null : null)}</p>
          </section>
        )}

        <section className="block">
          <h2 className="h2">{r ? t.otherRoutes : t.popular}</h2>
          <ul className="routes">
            {(r ? SEO_ROUTES.filter((x) => x !== r && (x.from === r.from || x.to === r.to)).slice(0, 8) : HOME_ROUTES).map((x) => (
              <li key={slug(x)}>
                <a href={pathFor(lang, x)}>
                  <span>{CITY_BY_ID[x.from].name[lang]}<i aria-hidden="true" />{CITY_BY_ID[x.to].name[lang]}</span>
                  <small>{new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(x.km)} {t.km}</small>
                  <b>{t.fromPrice} {fmtEur(quote(x.km, 1, 0).adultCents, loc)}</b>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="foot">
        <div className="foot__brand"><Mark /><span>TransferLux</span></div>
        <p className="muted">{t.footer}</p>
        <div className="foot__links">
          <a href={`tel:${CONTACTS.phone}`}><Phone />{CONTACTS.phoneLabel}</a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener"><WhatsApp />WhatsApp</a>
          <a href={CONTACTS.telegram} target="_blank" rel="noopener"><Telegram />{CONTACTS.telegramLabel}</a>
          <a href={CONTACTS.channel} target="_blank" rel="noopener"><Telegram />{t.channel}</a>
        </div>
        <p className="muted small">© {new Date().getFullYear()} TransferLux</p>
      </footer>

      <Sheet open={panel === "fleet"} title={t.fleetTitle} onClose={close} closeLabel={t.close} wide><Fleet t={t} /></Sheet>
      <Sheet open={panel === "trips"} title={t.tripsAll} onClose={close} closeLabel={t.close}><Trips lang={lang} t={t} onPick={(from, to) => { setPanel(null); setPreset((p) => ({ from, to, n: (p?.n ?? 0) + 1 })); }} /></Sheet>
      <Sheet open={panel === "team"} title={t.teamTitle} onClose={close} closeLabel={t.close} wide><Team t={t} /></Sheet>
      <Sheet open={panel === "contacts"} title={t.contactsTitle} onClose={close} closeLabel={t.close}><Contacts t={t} /></Sheet>
      <Sheet open={panel === "menu"} title={t.menu} onClose={close} closeLabel={t.close}>
        <nav className="menu">
          {nav.map(([k, l]) => <button key={k} type="button" onClick={() => setPanel(k)}>{l}</button>)}
        </nav>
        <div className="langs langs--lg" role="group" aria-label="Language">
          {LANGS.map((l) => <button key={l} type="button" className={l === lang ? "is-on" : ""} onClick={() => switchLang(l)}>{l === "uk" ? "UA" : l.toUpperCase()}</button>)}
        </div>
        <Contacts t={t} />
      </Sheet>
    </>
  );
}
