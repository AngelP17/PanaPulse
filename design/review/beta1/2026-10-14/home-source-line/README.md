# Home stale hero: one timestamp, source kept (WEB captures, not native)

Captured with Chromium at 393dp via react-native-web, offline-deterministic (USGS blocked, so the stale hero shows).
Before = PR #24 base build; after = this branch. Not native QA.

Change: the page-level "Últimos datos: … · USGS" line repeated the fetch time already shown in the hero provenance.
It is removed; the hero provenance now reads "USGS · Últimos datos: …" so attribution and freshness stay in one place.
