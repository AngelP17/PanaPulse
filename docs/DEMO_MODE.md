# PanaPulse interactive demo mode

A deliberately **opt-in, local simulation**, used to show what future Metro, MiBus, electricity, water, and community-report screens could look like with connected data. It is **not** a substitute for a verified feed.

## Controls
- Settings → Demo preview → Enabled.
- Everyday, Disruptions, and Recovery choose three distinct deterministic scenarios.
- Arrival estimates count down as the app clock advances; these numbers are fictional and are not estimates from transit providers.
- Power/water states and community report counts are fabricated solely for UI demonstrations. Counts change with the scenario and five-minute time windows.
- Simulator state and preference are stored locally; default remains OFF.
- Every affected screen carries the explicit bilingual DEMO/SIMULATED banner.
- Quake feed stays independently sourced from live USGS data or clearly dated bundled USGS snapshots. Simulator does not modify earthquake records.
- Chat receives real app context, not demo fixtures. Reports submitted by the user remain locally saved and are not combined with simulated community reports.

## Safety acceptance
1. Open Settings with Demo disabled; verify fake arrivals and statuses are absent.
2. Enable Demo. Test all scenarios on Home, Mobility, Services and Reports, ES/EN and Light/Dark.
3. Wait across one minute boundary; countdown values must update.
4. Switch Demo OFF. Only real/unavailable source state should remain.
5. Observe explicit simulated notices on every demo tile; no CTA should imply a fictional outage was confirmed.
6. Toggle Automatic, Light, Dark on Android and iOS, including system Reduce Motion.
7. Check narrow widths, 200% font scale, and TalkBack/VoiceOver. Native screenshots pending.

## Implementation
- Pure fixture generator: `src/data/demo.ts`, bounded deterministic values.
- Preferences: `src/state/AppContext.tsx`.
- UI: `Home`, `Mobility`, `Services`, `Report`, `Settings`.
- Motion: restrained screen fade and theme gradient crossfade.
- Real provider status is never overwritten, and user reports aren't populated with the simulation.

## Next production steps
Connect licensed transit feeds and verified official power/water notice sources, deploy backend collectors, add a reliable user-location picker, and implement community report aggregation with abuse protections. Do not remove demo labels or substitute simulated data as production facts.
