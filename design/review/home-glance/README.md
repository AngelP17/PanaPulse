# Home glance refactor: screenshots (2026-10-12)

Web renders of the real Expo code at 412×915. Not Android.

- `before_after_{es,en}.jpg`, `before_after_scrolled_{es,en}.jpg`: same data both sides (the bundled USGS snapshot, power feed unavailable), so the "after" shows the honest *stale / unavailable* state. This is what the hosted artifact shows, because the sandbox blocks live requests.
- `scenarios.jpg`, `scenarios_scrolled.jpg`: the other hero states.
  - **Notable / Calm:** the real recorded USGS response (2026-10-12) served as a live response at capture time. "Calm" filters out events of M5.0 and above.
  - **PAGER test:** the same data with the M6.0 event's PAGER level changed from yellow to **orange**, to check the alert-red treatment. Simulated, not a real alert.
  - Power notices in these scenarios are **test fixtures** (2 notices for Notable, 0 for Calm, unavailable for PAGER test).

Harness: `scen.mjs` (Playwright route interception), kept outside the repo.
