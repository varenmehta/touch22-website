# Touch22 website

Marketing site for **Touch22** (Unitouch Creations LLP), a B2B gold jewellery maker and wholesaler in Zaveri Bazaar, Mumbai, with the **Touch22 AI Studio**: clickable demos of the AI automations planned for the business.

## What's inside

| Path | What it is |
| --- | --- |
| `index.html` | Landing page: hero, collections (ELIRA, NAVYA, NAAZ), purities, the AI Studio demo grid, a live WhatsApp follow-up replay, a before/after photo-studio slider, roadmap, gallery and a trade-enquiry form that opens WhatsApp. |
| `demos/index.html` | The full AI Studio app with seven screens: Ask Touch22, Cart follow-up, Content studio, Photo studio, Retailer care, Trending@Touch and the Full plan. Deep links work, e.g. `demos/#flow`. |
| `assets/css/site.css`, `assets/js/site.js` | Landing page styles and behaviour. |

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root. The site appears at `https://<user>.github.io/touch22-website/`.
- **Vercel or Netlify:** import the repo; there is no build command and the output directory is the repo root.

## Things to swap before going live

- **Photos.** All images are free stock photos from [Unsplash](https://unsplash.com/license), loaded from `images.unsplash.com`, standing in for Touch22's own product shots. Replace the URLs in `index.html` and the `STOCK` map in `demos/index.html` with real photos (or drop files in `assets/img/`).
- **WhatsApp number.** Set `CONTACT.whatsapp` at the top of `assets/js/site.js` (country code plus number, digits only). Until then the enquiry form opens WhatsApp and lets the sender pick the chat.
- **Demo data.** Stock, retailers, prices and orders in the demos are sample data. The assistant uses scripted replies when the page isn't running inside Claude.
