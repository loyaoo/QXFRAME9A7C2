# Stage 4 · Preview 02 source-locked visual acceptance

Owner review on 2026-10-11: Stage 3 Preview 01 is visually usable and may proceed. This is not an assertion of every nested pixel matching the pinned source; carry those broad/full-component regressions to Stage 5.

**Scope**: exactly 31 Cards in `docs/create/preview-02.html`, based on the pinned `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c` Preview renderer (`?item=preview`, not Preview-02).

**Baseline**: `node tools/qa/preview-02-audit.mjs` compares original source and QX in the same Chromium and same system font, 8 styles × light/dark, recording 496 mapped Card pairs, surface geometry and sample Header/Content/Footer/Field/Item/Button roles. Source-only and QX-only IDs and differences are explicit diagnostics, not silent passes. Compare static SVG charts only for available geometry/style, not data equivalence. Native Select popup and JS Select retain the already-green shared framework CSS/interaction owners.

**Wave order**: forms / controls (shipping-address, feedback-form, github-profile, report-bug, invite-team, book-appointment), generic Card/Item/Empty/badge/CTA (codespaces-card, invoice, contributors, no-team-members, etc.), chart/metrics static SVG (usage, sleep, analytics, visitors, bar/pie, waveform), mixed canvas. Prioritize shared framework slots, keep preview-only content layout in preview.css; do not recreate shadcn runtime or introduce display:grid.

**Frozen**: PR #265 Stage3 stays Draft/unmerged and main/backup unchanged. Stage4 is a separately reviewable Draft PR; user will accept its Windows complete dist+docs offline ZIP before merging. The Stage4 branch is based on Stage3 HEAD and the initial main-targeted PR includes Stage3 commits until #265 is merged. After owner explicitly approves Stage3 merge, narrow the Stage4 PR diff normally. CI benchmark source is pinned and must not be altered to hide differences.

**31 pinned target cards**:
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

**Initial status**: baseline instrumentation only; no Stage4 cards yet declared visually aligned; no new offline highlight required until a visual code batch lands.
