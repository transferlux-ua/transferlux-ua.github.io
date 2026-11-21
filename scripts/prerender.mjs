// Static pre-render of all pages (home + route pages in 3 languages),
// sitemap.xml with hreflang, robots.txt, 404.html. Runs after vite build.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const ssr = await import(pathToFileURL(path.join(root, "dist-ssr", "entry-server.js")).href);

const pages = ssr.pages();
for (const p of pages) {
  const { html, head, lang } = ssr.render(p.lang, p.route);
  const out = template
    .replace('<html lang="uk">', `<html lang="${lang}">`)
    .replace("<!--head-->", head)
    .replace("<!--app-->", html);
  const file = path.join(dist, p.path, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
}

// sitemap with hreflang alternates
const SITE = ssr.SITE;
const today = new Date().toISOString().slice(0, 10);
const groups = new Map();
for (const p of pages) {
  const key = p.route ?? "home";
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
for (const list of groups.values()) {
  for (const p of list) {
    xml += `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n`;
    for (const a of list) xml += `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${list.find((x) => x.lang === "uk").path}"/>\n  </url>\n`;
  }
}
xml += "</urlset>\n";
fs.writeFileSync(path.join(dist, "sitemap.xml"), xml);
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log(`prerendered ${pages.length} pages`);
