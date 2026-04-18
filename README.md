# Modesto GarageFest Route Planner

A single-page tool for planning an optimal driving route through Modesto GarageFest — filter by item category, set a max radius from your starting address, and get an ordered route that opens in Google Maps.

**Live:** https://westleysmith.github.io/Garage-Fest/

## What it does

- Scrapes the ~270+ sales from the [Visit Modesto GarageFest map](https://visitmodesto.com/modesto-garage-fest/) (a WordPress Agile Store Locator plugin)
- Lets you mark categories as **Must / Want / Meh** and weights each sale by the tags its host chose
- Filters out anything farther than your max-radius-in-miles from your start address
- Runs a nearest-neighbor + 2-opt heuristic to order the chosen stops
- Opens the final route in Google Maps (chunked if more than ~23 waypoints)

## Using it

1. Open https://westleysmith.github.io/Garage-Fest/ on your phone or laptop
2. Enter your starting address (or use the default)
3. Pick categories — the defaults are loaded but you can tweak per person
4. Hit **Generate Route** — the list + map update
5. Tap any stop to expand its details, or hit the red **×** to remove it from the route
6. Tap **Open in Google Maps** when you're ready to drive

Each person gets their own local copy of the filter state — it's a single static page, nothing is saved server-side.

## Data

- `data/modesto_garagefest_2026.csv` — all 272 sales as CSV (id, title, address, lat/lng, categories)
- `data/modesto_garagefest_2026.json` — same data as JSON (also embedded in `index.html`)
- `index.html` — the planner itself, fully self-contained (~95 KB)

Data is a snapshot from event day 2026-04-18. The Visit Modesto map is taken down after 4 PM on event day so the page won't rebuild after that.

## Rebuilding next year

```bash
# 1. Open https://visitmodesto.com/modesto-garage-fest/ in a browser on event day
# 2. Open DevTools console, copy the output of:
#    ASL_REMOTE.nonce
# 3. Run:
node scripts/fetch_and_build.mjs <nonce>
```

The script re-fetches the live map, rebuilds `data/*.json`, `data/*.csv`, and re-embeds the JSON into `index.html`.

## Categories

GarageFest hosts self-tag their sale with one or more of:

Accessories & Jewelry · Antiques · Appliances · Arts & Crafts · Auto Parts · Baby & Kid Items · Books & Records · Clothing · Collectibles · Electronics · Garden · Household · Kitchen · Memorabilia · Music · Outdoors · Sports Equipment · Tools · Toys & Games

Most sales leave the free-text description blank, so the planner uses category tags + title keywords (`estate`, `moving`, `multi-family`, `huge`, `blowout`, etc.) to boost likely "big haul" sales.

## Credits

- Event data: [Visit Modesto](https://visitmodesto.com/modesto-garage-fest/)
- Map tiles: ESRI World Street Map
- Geocoding: [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/)
- Map library: [Leaflet](https://leafletjs.com/)
