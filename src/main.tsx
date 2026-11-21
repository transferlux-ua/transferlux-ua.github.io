import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { findRoute } from "./seo";
import type { Lang } from "./i18n";
import "./styles.css";

declare global { interface Window { __TL__?: { lang: Lang; route: string | null } } }

function fromPath(): { lang: Lang; route: string | null } {
  const m = location.pathname.match(/^\/(en)?\/?(?:routes\/([a-z-]+)\/?)?/);
  return { lang: (m?.[1] as Lang) || "uk", route: m?.[2] ?? null };
}

const boot = window.__TL__ ?? fromPath();
const el = document.getElementById("root")!;
const app = <App lang={boot.lang} route={boot.route ? findRoute(boot.route) : null} />;
if (el.firstElementChild) hydrateRoot(el, app);
else createRoot(el).render(app);
