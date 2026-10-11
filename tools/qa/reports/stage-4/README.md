# Stage 4 · Preview 02 practical visual acceptance

## Owner-approved acceptance policy (2026-10-11)

Stage 3 **PR #265 merged into main**, merge `0b2c9310712ad73a9f2d279a9c3cfb2bc468e7d6`. The owner confirms Preview 01 solved most shared framework visual/unification defects. **Preview 02 must NOT be chased to pixel-level agreement with shadcn** when differences are caused by already modified, explicitly accepted QX components.

1. **Approved QX behavior takes precedence**: control height, radius, typography, box-shadow, InputGroup, SelectGroup, Field, focus Origin/outline and native/JS Select dropdown behavior already confirmed in Stage 3. A source/shadcn comparison must not override these fixed framework rules.
2. **Fix actual regressions**: broken layout, clipped content/overflow, wrong contrast or dark/menu inversion, unintentional component heights or spacing, disabled/hover/active/focus mistakes, missing functionality, doubled focus borders/shadows and duplicated preview-specific component paint. Prefer one correction in canonical framework CSS or reusable static composition over per-card tweaks.
3. **Source size deltas are advisory**: compare shadcn for intent, structure, spacing rhythm and coherence. An approved QX control height or radius changing Card geometry **is not a failure**. No arbitrary `height`, `max-height` or transform to force pixel alignment.
4. **Fast batching**: group similar issues across all 31 Cards; don't reopen all Stage 3 corrections. Use 8 Styles × light/dark for theme regression, but run deeper source diagnostics only for visibly broken areas.
5. **No new public token for a single Card**. Preview-specific content layout belongs in `preview.css`; actual components should use framework classes/Theme roles. Follow QX CSS restrictions (Flex only, no framework CSS grid, no @layer/:is/:where, no vw/vh/fr).

## Baseline

31 Cards listed below in `docs/create/preview-02.html`, original pinned source `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`. Stage 4 source renderer is `?item=preview` (not Stage 3 `?item=preview-02`). The original does **not** expose Stage 3's `data-qa-card`; the audit uses its seven-column published ordering and excludes its hidden mobile-only `UIElements` instance. Only mappings with verified column length are compared.

`tools/qa/preview-02-audit.mjs`: strict 31 QX visible Card IDs × 8 Styles × light/dark = 496 valid QX Card boxes and page error checks; diagnostic source metrics and Nova screenshots, including visible Card and inner Header/Content/Footer/Field/Item/Button values. Do **not** assert pixel-equal Card heights, outer radius or typography when they derive from accepted QX components. Missing/unmappable source roots must be reported as unavailable comparisons, not accepted.

## Stage4 genuine interaction repair batch (2026-10-11)
Codespaces Local now owns nested HTTPS/SSH/GitHub CLI QX Tabs panels; outer Tabs only changes its own direct panel siblings. Book Appointment uses multiple Button states and supports 0..4 independently selected time slots. These are functional correctness fixes, not Card pixel realignment. Both are the only current-round highlighted Preview 02 cards.

## Stage4 second functional batch (2026-10-11)
- Restore two missing original-source Dialog interactions using QX Modal (Typography feedback; UI Elements accessory confirmation).
- Restore Codespaces Create loading and disabled feedback for 2 seconds with QX Button Spinner.
- Fix demo typography display labels: QX English preview now shows readable font category names instead of Chinese picklist labels rendered as missing glyphs; generator UI labels and font choices unchanged.
- QA marks only these four Cards this batch, no pixel-matching of already approved Controls.

## Follow-up

- Check Stage 4 dual CI on the exact final HEAD; fix measurement-script failures independently from actual component bugs.
- Inspect actual Preview 02 Cards and group real regressions into focused CSS/layout batches. For each batch update QA marker ledger to ONLY the changed Card regions; official Windows dist+docs bundle from same successful GitHub Actions artifact (no npm/git for owner).
- Stage 5 retains full component × 16 Theme regression and pre-delete legacy generator gates. Do not start Stage 5 or merge Stage4 PR without owner acceptance.

## All 31 Stage4 Cards
1. `style-overview`
2. `typography-specimen`
3. `codespaces-card`
4. `invoice`
5. `icon-preview-grid`
6. `ui-elements`
7. `observability-card`
8. `shipping-address`
9. `environment-variables`
10. `bar-chart-card`
11. `invite-team`
12. `activate-agent-dialog`
13. `skeleton-loading`
14. `pie-chart-card`
15. `no-team-members`
16. `report-bug`
17. `contributors`
18. `feedback-form`
19. `book-appointment`
20. `sleep-report`
21. `github-profile`
22. `weekly-fitness-summary`
23. `file-upload`
24. `analytics-card`
25. `usage-card`
26. `shortcuts`
27. `anomaly-alert`
28. `live-waveform`
29. `visitors`
30. `contributions-activity`
31. `not-found`
