# Showcase video: how it was made

`../Touch22-Order-Desk-showcase.mp4` is a real recording of the Order Desk demo (`orders/`) running in headless Chromium.

- `stage.html`: the branded frame: intro and outro cards, step captions on the left, the app in a window, cursor, highlights and camera zoom.
- `run.js`: drives the demo step by step (WhatsApp order, T-number, factory routing, factory reply, CAD approval, follow-ups, QC, repair, reports) and records it with the Chrome screencast.
- `server.js`: serves `stage.html` and `/orders/` from one origin.

To re-record: copy `mono-light.png` and `word-dark.png` from `orders/img/` next to these files, run `node server.js`, then `node run.js` (needs Playwright), then:

```
ffmpeg -f concat -safe 0 -i frames.txt -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 20 -movflags +faststart -an out.mp4
```
