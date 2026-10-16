import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://cleaning-hanna.github.io";
const langs = ["pl", "uk", "ru", "en"];
const locale = { pl: "pl_PL", uk: "uk_UA", ru: "ru_RU", en: "en_US" };
const sourceJs = fs.readFileSync(path.join(root, "app.js"), "utf8");
const definitions = sourceJs.slice(0, sourceJs.indexOf("const LANGUAGE_KEY"));
if (!definitions.includes("const translations")) throw Error("Translations not found");
const dictionary = vm.runInNewContext(definitions + ";translations");
const template = fs.readFileSync(path.join(root, "src", "index.template.html"), "utf8");

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function xmlEscape(value) { return escapeHtml(value).replace(/'/g, "&apos;"); }
function alternateLinks() {
  return [...langs.map(lang => `  <link rel="alternate" hreflang="${lang}" href="${domain}/${lang}/">`), `  <link rel="alternate" hreflang="x-default" href="${domain}/">`].join("\n");
}
function structuredData(lang) {
  const t = dictionary[lang];
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": domain + "/#organization",
        name: "Hanna Cleaning",
        url: domain + "/",
        telephone: "+48508741714",
        email: "cleaning.hanna@proton.me",
        areaServed: { "@type": "City", name: "Kraków" }
      },
      {
        "@type": "Service",
        "@id": domain + "/#cleaning-service",
        provider: { "@id": domain + "/#organization" },
        name: t.service1Title,
        description: t.metaDescription,
        serviceType: [
          t.service1Title, t.service2Title, t.service3Title, t.service4Title,
          t.service5Title, t.service6Title, t.extra1Title, t.extra2Title
        ],
        areaServed: { "@type": "City", name: "Kraków", address: { "@type": "PostalAddress", addressLocality: "Kraków", addressCountry: "PL" } }
      },
      {
        "@type": "WebPage",
        "@id": `${domain}/${lang}/#webpage`,
        url: `${domain}/${lang}/`,
        name: t.metaTitle,
        description: t.metaDescription,
        inLanguage: lang,
        about: { "@id": domain + "/#cleaning-service" }
      }
    ]
  };
  // Escape closing HTML script sequence; no user-controlled data is injected.
  return "  <script type=\"application/ld+json\">\n" + JSON.stringify(data, null, 2).replace(/<\//g, "<\\/") + "\n  </script>";
}
function generate(lang, atRoot = false) {
  const t = dictionary[lang];
  let html = template.replace('<html lang="pl">', `<html lang="${lang}">`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.metaDescription) + b);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.metaTitle) + b);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.metaOgDescription) + b);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, (_, a, b) => a + domain + "/" + lang + "/" + b);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, (_, a, b) => a + locale[lang] + b);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + domain + "/" + lang + "/" + b);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(t.metaTitle)}</title>`);
  html = html.replace(/(<[^<>]*\bdata-i18n="([^"]+)"[^<>]*>)([^<>]*)(<\/[^<>]*>)/g, (match, start, key, content, end) => {
    if (!(key in t)) throw Error(`Missing ${key} translation in ${lang}`);
    return start + escapeHtml(t[key]) + end;
  });
  html = html.replace(/(<img [^>]*\balt=")[^"]*("[^>]*\bdata-i18n-alt="heroImageAlt")/, (_, a, b) => a + escapeHtml(t.heroImageAlt) + b);
  html = html.replace(/(<nav class="site-nav" id="site-nav" aria-label=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.navServices) + b);
  html = html.replace(/(<button class="menu-toggle"[^>]*aria-label=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.ariaMenuOpen) + b);
  html = html.replace(/(<button type="button" class="back-to-top"[^>]*aria-label=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.ariaTop) + b);
  html = html.replace(/(<button type="button" class="back-to-top"[^>]*title=")[^"]*(")/, (_, a, b) => a + escapeHtml(t.ariaTop) + b);
  const prefix = atRoot ? "./" : "../";
  html = html.replaceAll('href="./favicon.svg"', `href="${prefix}favicon.svg"`)
    .replaceAll('href="./styles.css"', `href="${prefix}styles.css"`)
    .replaceAll('src="./app.js"', `src="${prefix}app.js"`)
    .replaceAll('href="./living-room.jpg"', `href="${prefix}living-room.jpg"`)
    .replaceAll('src="./living-room.jpg"', `src="${prefix}living-room.jpg"`);
  html = html.replace("</head>", `${alternateLinks()}\n  <meta property="og:image" content="${domain}/living-room.jpg">\n  <meta name="twitter:card" content="summary_large_image">\n${atRoot ? "" : structuredData(lang) + "\n"}</head>`);
  if (atRoot) {
    // Root is a browser-language entrypoint, while /pl/ etc. are stable indexable pages.
    html = html.replace("</head>", '  <meta name="robots" content="noindex,follow">\n</head>');
  }
  // Keep language links in HTML for users without JS and crawler discovery.
  html = html.replace("  <button type=\"button\" class=\"back-to-top\"", `  <noscript><nav class="container" aria-label="Languages"><a href="/pl/">PL</a> · <a href="/uk/">UA</a> · <a href="/ru/">RU</a> · <a href="/en/">EN</a></nav></noscript>\n  <button type="button" class="back-to-top"`);
  return html;
}
for (const lang of langs) {
  const dir = path.join(root, lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), generate(lang));
}
fs.writeFileSync(path.join(root, "index.html"), generate("pl", true));
const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const lang of langs) {
  sitemap.push("  <url>", `    <loc>${domain}/${lang}/</loc>`);
  for (const alt of langs) sitemap.push(`    <xhtml:link rel="alternate" hreflang="${alt}" href="${xmlEscape(domain + "/" + alt + "/")}"/>`);
  sitemap.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/"/>`, "  </url>");
}
sitemap.push("</urlset>", "");
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap.join("\n"));
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`);
console.log("Built root and " + langs.join(", ") + " static localized pages.");

