# My Trip — Half Old Streets, Half Future

A personal, mobile-first companion for my 7-day Chaoshan & Guangdong group tour (replaces opening the brochure PDF). Static site: plain HTML, CSS and JS, no build step, no external fonts or scripts, works offline once opened.

## Enable GitHub Pages

1. Push this folder to a GitHub repo named `Travel-Itinerary` (all paths are relative, so the `/Travel-Itinerary/` subpath works).
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
3. Open `https://<your-user>.github.io/Travel-Itinerary/`.
4. Before the trip, open it once on Wi-Fi (then "Add to Home Screen") so it works offline.

You can also just open `index.html` from disk; the service worker is skipped on `file://`.

## Edit the content

Everything shown comes from `js/data.js` (`window.TRIP`). Each text is `{ zh, en }`.

- Departure date: set it inside the app (saved on the phone), or put `"YYYY-MM-DD"` in `departureDate`.
- Days, stops, meals, hotels, flights, food lists, packing list and contacts are all plain arrays/objects there.
- Stop coordinates (`lat`/`lng`) drive the "Open in map" links (Amap and Google Maps).
- After changing any file, bump `VERSION` in `sw.js` so phones pick up the update.
