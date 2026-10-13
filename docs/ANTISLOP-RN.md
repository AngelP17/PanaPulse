# PanaPulse Antislop React Native override

This is an authored RN companion to the community anti-slop rules. `DESIGN.md` and product trust requirements take priority when instructions conflict.

1. A native tap target must be at least 48dp. Provide pressed feedback, not hover behavior.
2. All touchable controls use `accessibilityRole`, `accessibilityLabel`, and correct selected/checked state when applicable.
3. Native focus follows reading order. Test TalkBack and VoiceOver; never rely on CSS Tab or :focus-visible.
4. Never render a dead button, link, filter, menu, chart, or fake service state.
5. Default to `View`, `Text`, `Pressable`, RN flex layouts. Do not introduce DOM, WebView, or CSS-only patterns.
6. Honor safe areas, Android predictive back, Android edge-to-edge and iOS swipe navigation.
7. Design for 360dp width, text scale 2.0, and both light/dark system modes.
8. The sky gradient (Hark-inspired) is atmosphere only, never a semantic status cue.
9. Official/community/unknown/stale states require textual labels and traceable source/time.
10. Missing data means unknown, not healthy. A failed fetch must not leave a current-looking card behind.
11. Every data screen needs loading, empty, error and stale states; add retry where useful.
12. Any historical sample must say sample. Never fabricate live numbers, ETAs, traffic density, subscriptions or user counts.
13. No AI model has authority to predict quake timing, restoration time or tsunamis.
14. Theme switching Auto/Light/Dark must propagate to screen, tab bar, navigation and status bar.
15. Spanish and English parity is a release gate. Check wrapping, dynamic type and long labels.
16. Keep subscriptions and ads absent in v0, especially emergency screens.
17. Favor one memorable focal element over a repeated 2x3 fake-metric dashboard.
18. Do not auto-execute scripts downloaded from skill repositories.
