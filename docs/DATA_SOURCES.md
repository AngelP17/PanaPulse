# Data sources

Updated October 21, 2026 for the connected implementation. Repository integration and a successful local source fetch do not establish a running public service or ongoing provider availability. Exact verification evidence belongs in the [connected audit](CONNECTED_BETA_AUDIT.md).

| Module | Source | Connected implementation | Boundary |
| --- | --- | --- | --- |
| Sismos | USGS FDSN events and detail API | Backend collector; native/web consume the same `/v0/seismic` bundle | Panama region 5.5–11.5N, 84–76W; mobile catalog M4.5+ over 30 days. Original source times are retained. |
| Aftershock forecast | Published USGS `oaf` / `forecast.json` | Collector stores published windows and issue times | Only published products; expired periods are historical, never forecasts starting now. |
| Scheduled electricity | ENSA maintenance page; Naturgy weekly notices | Provider parsers, periodic worker, selected-area API and source health | Scheduled work only. Empty/stale notices do not establish service availability. See [power data](POWER_DATA.md). |
| Neighborhood observations | Structured submissions to PanaPulse | Shared electricity/water reports, withdrawal, moderation and coarse aggregates | Community-unverified, no exact locations/free text; installation counts are not verified people. |
| Agua | IDAAN official channel | Link only | No verified incident collector is connected. |
| Metro L1/L2 | Metro de Panamá official channel | Link only | No authorized live service/arrival feed is connected. |
| MiBus | MiBus official channel | Link only | No authorized GTFS-RT or prediction feed is connected. |

Connected mode never substitutes the bundled seismic fixture or fictional scenarios for these sources. It can retain previously received seismic data with its original timestamp and stale attribution. The separately labeled showcase still supports historical product demonstrations; it is not a beta data source.

## Future provider work

1. Confirm a permitted source and its reuse conditions before adding ingestion.
2. Prefer official structured notices and licensed static/real-time transit data. Validate geographic scope, timestamps, content changes and unavailable states against real responses.
3. Fetch once through a bounded backend worker, then serve many clients. Do not scrape per visitor or per assistant request.
4. Add fixtures, live-source verification and outage/contract-change monitoring before claiming that integration is available.

Do not scrape third-party route apps for ETAs or infer operator telemetry from a demonstration. Earlier October 12 research about public feed availability is historical context, not a perpetual claim that no feed can exist. Any newly available feed requires a fresh access and data-quality review.
