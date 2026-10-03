# 一半烟火，一半未来 · Half Old Streets, Half Future

My personal, mobile-first companion for a 7-day Chaoshan & Guangdong group tour (24–30 Nov 2026), replacing the brochure PDF. Static site: plain HTML, CSS and JS, no build step. It works offline once opened.

- **Bilingual:** Chinese and English are shown together throughout.
- **Text size:** the A− / A+ control in the header resizes everything, and the choice is remembered.
- **Live weather:** from [Open-Meteo](https://open-meteo.com) (free, no key).
  - Current weather is shown for every city.
  - Each trip day gets a forecast once it is within 16 days.
  - Before that, it shows the same dates last year.
- **Real map:** [Leaflet](https://leafletjs.com), stored in `vendor/leaflet`, with OpenStreetMap or 高德 Amap tiles. Amap loads faster in mainland China, and coordinates are converted to GCJ-02 for it.
- **Offline:** a service worker caches the page, photos and any map tiles you have viewed. Weather is always fetched live, and the last result is shown when offline.

## Enable GitHub Pages

1. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
2. Open `https://<your-user>.github.io/Travel-Itinerary/` (all paths are relative, so the subpath works).
3. Before the trip, open it once on Wi-Fi, then use "Add to Home Screen", so it works offline.

## Edit the content

Everything shown comes from `js/data.js` (`window.TRIP`). Each text is `{ zh, en }`.

- **Trip dates:** `departureDate` (`"YYYY-MM-DD"`). It can also be changed inside the app, which saves it on that phone.
- **Days:** each day's `city` (an index into `cities`) picks its weather city.
- **Stops:** `lat`/`lng` are WGS-84. Stops marked `approx: true` are not pinned on the map, and their map buttons search by name instead.
- **After changing any file,** bump `VERSION` in `sw.js` so phones pick up the update.
