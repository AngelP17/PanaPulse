# PanaPulse interactive product preview

**Scope:** This document describes the separate showcase/development mode. Connected native and web beta builds disable preview scenarios and bundled seismic substitution. See [current architecture](architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md).

The preview showcases the **finished-product interaction model** using coherent, locally generated scenarios, not a debugging screen.

## Product behavior
- A single persistent, tappable `VISTA PREVIA · {escenario}` indicator appears below the app header on every screen when enabled. Tapping opens Settings. This distinguishes sample service data without repeating disclaimers on each tile.
- Three mutually consistent scenarios: Everyday / Disruptions / Recovery. Selecting one updates Home, Mobility, Essential Services, Reports, and the built-in assistant.
- **Home** shows a scenario-aware primary update, organized service cards, an optional saved commute, community activity, and a **separate genuine USGS record** attributed with its actual original timestamp. The scenario does not forge a USGS event or forecast.
- **Mobility** shows advancing Metro/MiBus arrival countdowns and allows a route to be saved/removed. The Home commute responds to this action.
- **Services** shows detailed power and water scenario states with a community shortcut. Real provider health and links remain accessible in Settings.
- **Reports** allows submitting a local preview report, incrementing the community report number everywhere. Preview reports are never stored as actual reports or sent to a production backend.
- **Ask PanaPulse** uses the selected scenario for questions about transit, utilities and neighborhood reports. When asked about earthquakes, it answers from actual USGS data, never the fictional scenarios. Unknown preview questions receive a concise scenario overview instead of a generic "feed unavailable".
- The two languages and existing Porcelana Light/Dark/Auto modes remain supported.

## Source distinction
- Preview is a **controlled product walkthrough**, not current Panama service telemetry. Keep the header preview indicator visible in all preview screenshots and preserve source integrity in the underlying code.
- The actual USGS catalog and archived aftershock products are never altered. Old USGS forecasts must not be described as future periods starting now.
- Live-source mode (preview OFF) remains honest and unmodified. The Settings "Data sources" section explains actual connectivity and official channels.
- No official IDAAN, MiBus, Metro, ENSA, or Naturgy status is inferred from a fictional preview record.
- Real notices from the power collector can be inspected when leaving preview; the deployment of that collector remains a separate task.

## Acceptance test
1. Enable preview and set Disruptions. Open Home, Services, Mobility, Reports and Ask. The same interruption, water and transit context should be visible everywhere with **no duplicated offline disclaimers**.
2. Ask `¿Cómo está el Metro?` and `¿Hay cortes de luz?`. Receive scenario-grounded replies, not "no data connected".
3. Create a report and confirm the count increases in Home and Services. Turn preview off and confirm the report has not been written to real community data.
4. Remove your saved commute in Mobility, verify Home removes it, save it again and verify Home restores it.
5. Change to Recovery, verify displayed conditions and chat change. Wait a minute and confirm transit countdown changes.
6. Open Sismos and verify USGS values and issue dates are always genuine, including when data is archived.
7. Check Light/Dark/Auto, Spanish/English, narrow phone widths, large font sizes, Reduce Motion, and mobile browser safe areas.
8. Run TypeScript and backend tests in GitHub CI and the deterministic preview regression test.

**Native-device screenshot testing and actual backend deployments remain outstanding.**
