# PanaPulse Demo Mode: consistent scenario surfaces

Demo Mode is a **separate, explicit presentation layer**, not a live data feed. It is off by default and can be enabled in Settings.

## Why this change was necessary
Previously the simulator added sample cards above the real-source cards. That made Home, Services and Mobility display `SIMULATED` next to `NO DATA` because the underlying source adapters were still disconnected.

Now, when Demo Mode is enabled, Home, Mobility, Services and Quakes **render demo-only category views**. Reports has a separate demo report panel while retaining the real local report form. The live-source views are restored when Demo Mode is disabled.

## Shared scenarios
`src/data/demo.ts` generates deterministic scenes using the existing clock and selected scenario:
- **Everyday:** sample scheduled maintenance, stable transit estimates, example water situation, small simulated report count, and a fictional earthquake.
- **Disruptions:** fictional delays, outage and low pressure, higher report count, and a fictional earthquake.
- **Recovery:** simulated transit and utility restoration, intermediate report count and a fictional earthquake.

All demo screens display `MODO DEMO · DATOS SIMULADOS` / `DEMO MODE · SIMULATED DATA` and render **SIMULADO / SIMULATED** status chips. The quake is a fictional example, not an actual USGS event, and does not deep-link to a nonexistent official earthquake. Official forecast probabilities are not invented. These examples must not be used for any safety or travel decisions.

## Separation rules
- Never assign a real provider verification state to a demo value.
- Simulated notices and ETAs are not written to official-source state or backend ingestion tables.
- Reports created by the user remain distinct from demonstration community counts.
- Chat continues to use actual sourced context and is not a simulation of the demo panels.
- Keep Porcelana, Spanish/English, native navigation, and Reduce Motion support unchanged.

## Acceptance checks
1. Enable Demo and view **Home, Mobility, Quakes, Services, Reports**. No mock panel should be accompanied by a contradictory real `SIN DATOS` panel.
2. Switch Everyday → Disruptions → Recovery. The same scenario must appear across tabs. Ensure reports counts agree everywhere.
3. Wait one minute; fictional transit ETAs should change predictably.
4. Turn Demo off; the original real-source views and honest unavailable states return.
5. Test ES/EN, dark/light/auto, Android/iOS, narrow widths, large font sizes and Reduce Motion.
6. Run CI TypeScript and backend tests; screenshots and real-device testing are required before final release.
