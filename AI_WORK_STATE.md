# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-09-30
- Repository: `loyaoo/QXFRAME9A7C2`
- Repository HEAD: always query Git on resume; do not cache a self-invalidating HEAD in this file.
- Active branch / PR / CI: always query GitHub on resume; do not cache transient branch names, PR states or “latest” run IDs here.
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` (historical filename retained; body defines 9 Runtime Controllers + pure CSS Theme/Token).
- Overall handbook implementation progress: base 9-controller migration is 100%; final-audit remediation, focus follow-ups and the Picker/Autocomplete/Notification/Table/Image UX closeout are implemented with regression coverage.
- Current Phase: Menu root Scroll visibility correction.
- Current Task: `MENU-SCROLL-AUTO-008`

## CURRENT

### MENU-SCROLL-AUTO-008 — Menu root Scroll auto visibility correction
Status: IMPLEMENTED — PENDING PR CI
Task progress: 85%

Current truth:
- Menu root Scroll ownership remains canonical `Menu -> Scroll`.
- Admin no longer calls `Scroll.showScrollbar()`; the root Scroll remains on the framework default `scrollbarVisibility:'auto'`.
- Browser acceptance now requires the Menu scrollbar to be hidden while idle, visible during scrolling, and hidden again after the configured idle delay.
- Native Admin host scrolling remains disabled; the framework Scroll remains the only visible scrollbar owner.

Next exact step:
- Open the PR, run exact-head CI, and merge only if the auto-visibility browser lifecycle passes.
- After merge, verify main CI + Pages and mark this task COMPLETE.

### ARCH-MERGE-CLOSEOUT-007 — merge / main / Pages closeout
Status: COMPLETE
Task progress: 100%

Completion evidence:
- PR #186 merged into `main` as `a78e0a4a5fda5d72441074fe85090aaf9a23051f`.
- Superseded PR #185 was closed unmerged after its valid Menu-root Scroll/admin acceptance intent had been absorbed by #186.
- Main QXFRAME CI #930 for merge SHA `a78e0a4a5fda5d72441074fe85090aaf9a23051f` passed Windows tools, Completion audit, Full release verification, npm pack, standalone dist + docs demo build, canonical browser verification and artifact uploads.
- The same main run uploaded the GitHub Pages artifact and `deploy-pages` completed successfully.
- No implementation work remains for ARCH-UNIFICATION-006 or ARCH-MERGE-CLOSEOUT-007.

Resume rule:
- Query current Git / PR / CI / Pages state first. Do not re-run the popup/reorder/OverlayFrame migration or reopen superseded PR #185 unless new repository evidence proves a regression.

### ARCH-UNIFICATION-006 — Popup / Reorder / OverlayFrame shared-runtime closeout
Status: COMPLETE
Task progress: 100%

Outcome:
- Popup-family physical runtime is unified as `business component -> PopupComponent/PopupField/PickerField -> PopupRuntime/PopupFrame -> Trigger -> OverlayController/PositionAdapter`.
- PopupFrame owns popup Scroll resources; business popup components no longer construct parallel popup Scroll/Trigger paths.
- Menu main/root navigation remains an intentional business-level Scroll owner; submenu/overflow popup scrolling is PopupFrame-owned.
- Table main viewport, Tabs main navigation, Tags scroll mode, Transfer/Upload/WheelPanel/Sort remain intentional non-popup Scroll owners.
- Tree hierarchical drag/drop is a domain adapter over ReorderInteraction; Tree no longer owns a second raw drag lifecycle.
- Modal and Drawer share OverlayFrameRuntime for common frame DOM, body Scroll, OverlayFrameShell, OverlayController, PopupSurface, transitions and open/close/destroy resource lifecycle, while retaining component-specific geometry/motion profiles.
- Admin Menu uses the canonical Menu-owned Scroll and explicitly requests persistent visible chrome through Scroll.showScrollbar(); the admin shell no longer exposes a second native scrollbar.
- PR #185's valid Menu-root Scroll/admin acceptance intent was absorbed into the unified implementation; its architecture is superseded by PR #186.

Guardrails retained:
- One owner / one truth; no compatibility parallel runtime.
- Trigger remains trigger/Overlay/position/motion coordinator; popup Scroll belongs to PopupFrame, not Trigger or business popup components.
- Tree before/inside/after semantics stay in Tree while drag lifecycle stays in ReorderInteraction.
- Theme/Token remain pure CSS.
- Picker draft/commit/cancel semantics, Autocomplete input-first behavior, keyboard-vs-pointer focus-origin separation, generic overflow policy and min-width policy remain unchanged.
- No ARIA/a11y/RTL reintroduction.

Regression gates:
- `verify:capability-unification` rejects direct business Trigger creation, direct popup Scroll ownership, Tree-local raw drag lifecycle, and Modal/Drawer-local frame resource ownership.
- Existing popup-field, popup facade, Scroll, Tree/Reorder, Modal/Drawer and final-audit verifiers were updated to assert the canonical owners rather than the superseded duplicate paths.
- Canonical Admin browser coverage validates Menu custom Scroll DOM/scrollability/track+thumb visibility/movement and the real Orders DatePicker first-frame popup position.

Verification evidence:
- PR #186 implementation head `846140367ad247d9044398804ea9d91d74105ad2`.
- QXFRAME CI #926 passed Windows tools, Completion audit, Full release verification, npm pack, standalone dist + docs demo build, canonical docs verification, canonical Admin browser regression, and artifact uploads.
- The canonical Admin browser accepted `menuCustomScrollPresent`, disabled host native scroll, a scrollable Menu viewport, visible framework track/thumb, actual Scroll movement, collapsed Menu geometry, global search close behavior, and stable Orders DatePicker popup placement.
- Earlier CI failures in this task exposed and fixed two real DatePicker PopupFrame mount-order defects; PopupFrame's strict panel-descendant ownership invariant was preserved rather than weakened.
- Select/DatePicker first-frame positioning regressions remain covered and passed with motion enabled.

Resume rule:
- No implementation work remains for ARCH-UNIFICATION-006. On resume, query Git/PR/CI/Pages first and only act on current repository state; do not re-run this architecture migration from the beginning.

### SCROLL-UNIFICATION-005 — unified Scroll ownership + first-frame popup positioning
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Merged via PR #184 as `1fda904db5548f53ccdb9628c5f5c6e797f5abaf`.
Baseline: `main@7cbaa7b18d7953c267a8c525eab8ccc6aecb20f1`.

User requirements:
- Runtime components with their own scrollable surfaces should use framework Scroll by default instead of independently exposing native scrollbar chrome.
- Native scrolling remains the browser physics layer and is allowed for intentional hidden/fallback/CSS-only surfaces, but every visible native track/thumb must consume the same Scroll geometry/color tokens.
- Select/DatePicker and other Trigger-based popup panels must be correctly positioned on their first visible frame; no end-of-enter horizontal correction/jump.

Implemented Scroll ownership:
- ItemCollection defaults `scrollAdapter` to `Scroll.attachViewport` unless explicitly opted out with false/null.