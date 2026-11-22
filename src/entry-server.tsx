import { renderToString } from "react-dom/server";
import { App, pathFor } from "./App";
import { SEO_ROUTES, findRoute, slug } from "./seo";
import { DICT, LANGS, LOCALE, PREFIX, CONTACTS, type Lang } from "./i18n";
import { CITY_BY_ID } from "../shared/cities";
import { quote } from "../shared/price";
import { CROSSING_NAMES } from "../shared/crossings";

export const SITE = "https://transferlux-ua.github.io";

export function pages() {
  const out: { path: string; lang: Lang; route: string | null }[] = [];
  for (const lang of LANGS) {
    out.push({ path: PREFIX[lang], lang, route: null });
    for (const r of SEO_ROUTES) out.push({ path: pathFor(lang, r), lang, route: slug(r) });
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function render(lang: Lang, routeSlug: string | null) {
  const route = routeSlug ? findRoute(routeSlug) : null;
  const t = DICT[lang];
  const html = renderToString(<App lang={lang} route={route} />);
  let title = t.metaTitle, desc = t.metaDesc;
  if (route) {
    const a = CITY_BY_ID[route.from].name[lang], b = CITY_BY_ID[route.to].name[lang];
    const q = quote(route.km, 1, 1);
    const eur = (c: number) => (c / 100).toFixed(2).replace(".", lang === "en" ? "." : ",") + " €";
    const via = route.via ? ` ${t.border}: ${CROSSING_NAMES[route.via][lang]}.` : "";
    title = `${t.routePageTitle(a, b)} | TransferLux`;
    desc = `${t.routePageTitle(a, b)}. ${t.distanceRoad}: ${Math.round(route.km)} ${t.km}.${via} ${t.priceAdult}: ${eur(q.adultCents)}, ${t.priceChild.toLowerCase()}: ${eur(q.childCents)}.`;
  }
  const url = SITE + pathFor(lang, route);
  const alts = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE + pathFor(l, route)}">`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE + pathFor("uk", route)}">`;
  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org", name: "TransferLux", url: SITE + "/",
      logo: SITE + "/brand/icon-512.png", telephone: CONTACTS.phone, email: CONTACTS.email, sameAs: [CONTACTS.channel],
      contactPoint: [{ "@type": "ContactPoint", telephone: CONTACTS.phone, contactType: "reservations", availableLanguage: ["Ukrainian", "English"] }]
    }
  ];
  if (route) {
    ld.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "TransferLux", item: SITE + PREFIX[lang] },
        { "@type": "ListItem", position: 2, name: `${CITY_BY_ID[route.from].name[lang]} ${CITY_BY_ID[route.to].name[lang]}`, item: url }
      ]
    });
  }
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${url}">`,
    alts,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="TransferLux">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/img/sprinter-white-two.jpg">`,
    `<meta property="og:locale" content="${LOCALE[lang].replace("-", "_")}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>`,
    `<script>window.__TL__=${JSON.stringify({ lang, route: routeSlug })}</script>`
  ].join("\n");
  return { html, head, lang };
}
