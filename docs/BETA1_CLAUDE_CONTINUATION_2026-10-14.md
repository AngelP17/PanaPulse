# Claude continuation: PanaPulse standalone Beta 1 (2026-10-14)

## Confirm state from GitHub before any edits

- **Merged to main:** PRs #13–#19, implementing local state/persistence, Reports, Mobility, onboarding, Services, chat context and Settings. Main HEAD at first inspection: `e8594af`. Recheck HEAD and current PRs rather than assuming this SHA remains current.
- **PR #20 OPEN:** `design/premium-mobile-references`. Design study only, updated with the Yash onboarding screenshot, Nero's design-site list and Tobi's concept → three compositions → render → critique → refine method. It has **no runtime UI changes**.
- **PR #21 OPEN:** `fix/beta1-native-polish-and-release-gates`. Raises global preview badge touch area 30 → 44pt, reconciles outdated readiness checklist, and adds testable QA/release gates. **Not yet merged nor verified by native QA.**
- **This PR (onboarding-path-polish):** Replaces the generic introductory feature card with an original connected-neighborhood vertical path, using existing Porcelana tokens and copy. Area/language/theme and persistence logic are untouched. This is a **first code iteration, not an approved or verified redesign**.

## Required design contract

Read `DESIGN.md`, `docs/BRAND.md`, `src/theme/tokens.ts`, `design/ART_DIRECTION_BETA1.md`, `CLAUDE_HANDOFF_BETA1.md`, `docs/FEATURE_COMPLETE_HANDOFF.md`, `docs/BETA1_READINESS.md` and PR #20's reference study **before** continuing. Porcelana is already approved: ink/porcelain/coral, Manrope, original P, broad gradient, native four-tab layout, source-truthful utility states. Tobi's 3-direction method applies to **composition within Porcelana**, not three competing new brands. No external skill install necessary.

## Next execution sequence (do real work, not another strategy-only PR)

1. **Inspect branch and visual delta:** Capture *true* original vs this PR's onboarding at the same width (393dp), ES/EN, light/dark. If this connected-path version looks weak, sketch two other within-Porcelana compositions, critique at equal resolution, pick the most usable one and refine. Never represent mockups or web captures as native screenshots.
2. **Accessibility:** Verify 360/393/412dp, font scale 2.0, screen reader order, touch targets >=44pt, bottom insets, keyboard and Reduce Motion. Decorative path nodes should not add meaningless spoken content.
3. **Functional:** Fresh onboarding saves corregimiento, ES/EN, Auto/Light/Dark and completion after cold restart; existing migrated users bypass it. Preview/live scenarios remain source-truthful.
4. **Test:** `npm run typecheck`, backend fixture tests (`python -m pytest backend/tests -q`), repository JS regression scripts, then GitHub CI. If this tool environment cannot run tests, mark them NOT RUN and let Claude run them locally or in CI, without claiming success.
5. **After owner accepts onboarding:** separate Home-first premium polish PR, focused on hierarchy/source legibility, with real before/after captures and tests. Then full native QA of Mobility, Services, Reports, Quakes, Ask, Settings, offline states, persistence and accessibility. Track blockers with reproduction steps.
6. **Beta 1 GO/NO-GO:** App-first UX, coherent local data, accessibility and native test evidence must pass. An installable internal release is **not yet authorized**: ask owner explicitly before restarting EAS/APK. API hosting, scraping, live MiBus/IDAAN ingestion, public reports and monetization are deferred.

## Handoff reporting format

Always report: (a) GitHub branch/commit/PR status, (b) **implemented** vs **tested** vs **not tested**, (c) real screenshot links or explicitly missing, (d) defects/remaining blockers, (e) next code task. Do not silently merge visual redesigns or call Beta 1 complete because CI alone is green. Keep PRs small and reviewable.
