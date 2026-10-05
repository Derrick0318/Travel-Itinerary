# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Travellers on the Brighton Travel & Tour group tour "一半烟火，一半未来" (7 days, 6 nights, Guangdong and Chaoshan, 24–30 Nov 2026), flying from Brunei. The site is made by one member of the group and shared with the whole tour group. People open the same link on their own phones, mostly while travelling (on the coach, at a stop, at the hotel at night) and sometimes on a laptop before the trip. Readers are Chinese- and English-speaking Bruneian/Malaysian travellers of mixed ages; some will want larger text.

## Product Purpose

Replace opening the scanned brochure PDF. At a glance, a traveller should know where the group is today, what is next, which meals are included, where tonight's hotel is, the flight times, the weather, and who to call. Success means people use the link instead of the PDF during the trip.

## Positioning

A traveller-made companion for this exact tour, not a booking or sales page. It follows the tour's own theme: the film 《给阿嬷的情书》 (A Love Letter to Grandma), whose filming locations in Jieyang are on Day 3.

## Operating Context

- Mostly phones, often on mobile data in mainland China, where Google services and many CDNs are blocked. Some travellers use roaming, some use local Wi-Fi.
- Opened repeatedly during the trip; it should work offline after one visit.
- Times run on UTC+8 (Brunei and China).
- Hosted as a static site on GitHub Pages (repo Derrick0318/Travel-Itinerary).

## Capabilities and Constraints

- Static HTML/CSS/JS with no build step. Content lives in `js/data.js`.
- Chinese and English are always shown together; there is no language toggle.
- Adjustable text size, saved per phone.
- Countdown to departure and "today is Day N" during the trip.
- Live weather (Open-Meteo, no key) for every city; per-day forecast within 16 days, last year's weather before that.
- A real map (self-hosted Leaflet, OpenStreetMap or Amap tiles with GCJ-02 conversion).
- Day-by-day itinerary, flights, hotels, meals, optional tours (RMB 298 / 300), includes/excludes, brochure remarks, contacts with call/WhatsApp, a packing checklist, a signature-food list.
- Offline service worker. No external fonts or scripts at runtime; anything needed is stored in the repo.
- Must not look like or claim to be an official Brighton Travel page.

## Brand Commitments

- The tour title 一半烟火，一半未来 and the film 《给阿嬷的情书》 are the tour's own theme.
- Itinerary facts come from the Brighton brochure prepared by Amy; the agency's name and contact numbers are shown as factual information, not branding.

## Evidence on Hand

- Brochure PDF (kept locally, not published): the source of every itinerary fact.
- 13 free-licensed Wikimedia Commons photos in `assets/img/`, each with an author and licence credit that must be shown.
- No photos of the actual hotels, the robot restaurant, or several stops. Do not fabricate them.
- No testimonials, ratings or prices beyond the optional tours. Do not invent any.

## Product Principles

1. Today first: during the trip, the current day, the next stop and tonight's hotel are always one tap away.
2. Bilingual without friction: every fact reads in Chinese and English side by side.
3. Works on a weak connection: offline after one visit, nothing that breaks behind the Great Firewall.
4. Faithful to the brochure: never invent facts; mark anything uncertain (approximate map pins, inferred meals).
5. Easy for every age: large tap targets and adjustable text.

## Accessibility & Inclusion

Mixed-age group: text size control is required, contrast must meet WCAG AA in light and dark, tap targets at least 44px, and motion respects reduced-motion settings.
