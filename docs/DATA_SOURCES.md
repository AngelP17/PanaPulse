# Data sources (checked 2026-10-12)

| Module | Source | Status | Notes |
|---|---|---|---|
| Sismos | USGS FDSN event API + detail API | **Connected** (native: live every 5 min; web: snapshot) | Panama bbox 5.5–11.5N, 84–76W, M4.5+ |
| Pronóstico de réplicas | USGS Operational Aftershock Forecast (`oaf` product, `forecast.json`) | **Connected** | Shown only when USGS publishes one; quoted verbatim |
| Luz | Naturgy / ENSA notices | Not connected | 14-day feasibility test pending; Naturgy portal refreshes every 24 h |
| Agua | IDAAN notices | Not connected | Press/social posts, needs extraction worker |
| Metro L1/L2 | Metro de Panamá | **No open feed exists** | datosabiertos.gob.pa has station coordinates (2022) and ridership, no GTFS, schedules or real-time |
| MiBus | MiBus | **No open feed exists** | Only GTFS is merlos/panatrans-dataset (2016 KML, archived 2020, ODbL). MiBus Maps/GPS reported broken since 2024 |

## Path to transit data (ranked)
1. **Static Metro layer now:** import L1/L2 station coordinates from datosabiertos.gob.pa (open data) for
   a station list + map. Real, legal, cheap.
2. **Official disruption notices:** Metro/MiBus announce service changes on their channels. Ingest with
   the notice-extraction worker (cheap model → validator → `official` only with a source URL).
3. **Ask for access:** email Metro de Panamá / MiBus / ATTT for a GTFS or GTFS-RT feed. Panama has an
   open-data law and portal; a civic app asking is a reasonable request.
4. **Community signals:** "¿Se fue solo a mí?" style reports for "Metro detenido" — always labeled community.
Do NOT scrape third-party apps (Moovit, Google) for ETAs: license risk and the underlying GPS is unreliable.
