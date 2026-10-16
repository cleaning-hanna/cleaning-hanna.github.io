# Hanna Cleaning · Kraków

Lightweight, responsive, multilingual one-page website for Hanna's apartment cleaning and household help services in Kraków.

- **Languages:** Polish, Ukrainian, Russian, English. Selects the first supported browser language; Polish otherwise. Manual selection is saved locally.
- **Stack:** Plain HTML, CSS, and JavaScript. No build process, tracking, forms, or third-party JavaScript.
- **Hosting:** GitHub Pages, main branch, root folder.
- **Contact:** +48 508 741 714 · cleaning.hanna@proton.me

## Local preview

Open `index.html` in a browser or run `python3 -m http.server 8000` in this folder, then visit http://localhost:8000.

## Photo credit

Living room photo: [SHVETS production / Pexels](https://www.pexels.com/photo/a-white-sofa-beside-a-potted-rubber-tree-7561276/). Licensed for free commercial use under the Pexels License. The photo is illustrative, not a picture of Hanna's work.

## Publishing

GitHub repo: https://github.com/cleaning-hanna/cleaning-hanna.github.io

Settings → Pages → Deploy from a branch → main / (root).
Live URL: https://cleaning-hanna.github.io/



## Multilingual SEO

Run `node scripts/generate-seo.mjs` after modifying `src/index.template.html` or translations in `app.js`. Generated localized pages are `pl/index.html`, `uk/index.html`, `ru/index.html`, `en/index.html`. The root is a non-indexed language entrypoint, defaulting to Polish and respecting a saved language preference. Direct language URLs never redirect to another language.

The generator also outputs `sitemap.xml` and `robots.txt`. Each indexed page has static translated HTML, its own canonical URL and reciprocal `hreflang` links (including `x-default`), language-specific metadata and JSON-LD describing the actual service. The JSON-LD intentionally does not claim an unverified address, opening hours, prices, reviews or local-business Google rich-result eligibility.

Search Console: add the URL-prefix property `https://cleaning-hanna.github.io/` and submit `https://cleaning-hanna.github.io/sitemap.xml`. Ownership verification may require the business owner's Google account.

Google Maps: create or claim a Google Business Profile owned by Hanna. If Hanna serves clients at their premises and has no staffed storefront, configure a service-area business and hide the residential address. Do not invent a physical address or choose hours without Hanna's confirmation.
