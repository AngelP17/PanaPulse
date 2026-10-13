# PanaPulse motion

Treat motion as navigation feedback, not decoration.

- Tab switches: no animation. Tabs are switched dozens of times a day; a fade there is felt as latency (see DESIGN.md, Motion).
- Porcelana sky: 330ms crossfade between the existing approved gradient palettes.
- PressScale: existing subtle press behavior.
- System Reduce Motion: sky crossfade, press scale and rail draw-in disabled.
- Alerts: no pulsating hazard indicators, flashing red, or emergency confetti.
- Keep navigator and chat composer stable during transitions, with no overlay over content.
- QA: change tabs quickly, toggle Light/Dark/Auto repeatedly, test Reduce Motion and 360dp widths in Android and iOS native apps.
