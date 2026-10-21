# Touch22 website

Marketing site for **Touch22** (Unitouch Creations LLP), a B2B gold jewellery maker and wholesaler in Zaveri Bazaar, Mumbai, with the **Touch22 AI Studio**: clickable demos of the AI automations planned for the business.

## What's inside

| Page | What it is |
| --- | --- |
| `index.html` | Home: hero, collections, purities, Trending@Touch picks, the AI Studio demo grid, a live WhatsApp follow-up replay, a before/after photo-studio slider, roadmap, gallery and a trade-enquiry form. |
| `catalogue.html` | Ready-stock catalogue: search, category chips, collection/purity filters, sorting, in-stock toggle, a live gold-rate input that reprices everything, product quick view and a trade cart that sends the order on WhatsApp. Filters are shareable links, e.g. `catalogue.html?col=ELIRA&cat=Rings`. |
| `about.html` | Company story, timeline, values and shop-by-category. |
| `contact.html` | Showroom address and map, WhatsApp, socials, enquiry form and FAQ. |
| `demos/index.html` | The full AI Studio app with seven screens. Deep links work, e.g. `demos/#flow`. |
| `orders/index.html` | **Touch22 Order Desk** demo: retailer WhatsApp bot (English, Hindi, Hinglish), automatic T-numbers, factory routing and factory chats, the full order lifecycle (confirm, CAD, production, QC, dispatch, repair/wrong order), follow-ups on the day 6/8/10 rule and a dashboard with factory performance and custom-design insights. Everything is simulated in the browser; use **Next day** to move the clock. |
| `404.html` | Not-found page (GitHub Pages serves it automatically). |
| `assets/js/data.js` | **One place to edit**: contact details (WhatsApp number), default gold rate and the product catalogue. |
| `assets/css/site.css`, `assets/js/site.js`, `assets/js/catalogue.js` | Styles and behaviour. |

Plain HTML, CSS and JavaScript. No build step and no dependencies. The trade cart and the buyer's store name are kept in the browser (localStorage).

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root. The site appears at `https://<user>.github.io/touch22-website/`.
- **Vercel or Netlify:** import the repo; there is no build command and the output directory is the repo root.

## Things to swap before going live

- **Photos.** All images are free stock photos from [Unsplash](https://unsplash.com/license), loaded from `images.unsplash.com`, standing in for Touch22's own product shots. Replace the photo ids in `assets/js/data.js`, the image URLs in the HTML pages and the `STOCK` map in `demos/index.html` with real photos (or drop files in `assets/img/`).
- **WhatsApp number.** Set `CONTACT.whatsapp` in `assets/js/data.js` (country code plus number, digits only). Until then the enquiry form opens WhatsApp and lets the sender pick the chat.
- **Catalogue data.** The 24 designs, weights, stock and making charges in `assets/js/data.js` are sample data; replace them with the daily stock export.
- **Demo data.** Stock, retailers, prices and orders in the demos are sample data. The assistant uses scripted replies when the page isn't running inside Claude.
