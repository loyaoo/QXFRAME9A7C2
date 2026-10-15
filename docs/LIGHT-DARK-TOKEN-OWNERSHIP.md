# LIGHT-DARK-GLOBAL-001: single Token ownership

Status: implementation on Draft PR #267; final acceptance requires latest same-HEAD CI and Chromium.

## Core contract

- One generated public Theme registry: --qxframe9a7c2-theme-* values. Colors have one light-dark(light,dark) expression under :root, not two parallel mode definitions.
- .dark and inverse Menu/native ::picker(select) switch color-scheme, not Theme colors.
- One state/appearance ownership per component. CSS properties are painted by the component, not a later duplicate visual pipeline.
- No historic v1/v2/v3 or generic recipe prefix as a workaround for duplicated names; do not maintain compatibility aliases for these removed private names.

## Resolved collisions

| Concern | Actual owner | Reason |
| --- | --- | --- |
| Button background/border | --_qxframe9a7c2-action-bg / --_qxframe9a7c2-action-border | Same action, including style states. Merge. |
| Input and picker field background/border | --_qxframe9a7c2-control-bg / --_qxframe9a7c2-control-border | Same control family, shared focus and hover state. Merge. |
| Card shadow | --_qxframe9a7c2-card-shadow, rendered once by card.css | Card controls selected/hover/outlined/loading. Remove second direct painter. |
| Popup background/text/border/shadow | --_qxframe9a7c2-popup-* family roles | Same family roles; context chooses Menu vs Popover, without self-referential projection or global direct paint. |
| Navigation background | --_qxframe9a7c2-navigation-bg for whole container; --_qxframe9a7c2-menu-item-bg for one item | Distinct DOM surfaces, existing MenuItem channel reused. |
| SelectGroup choice vs checkbox/radio mark | --_qxframe9a7c2-choice-* for label; --_qxframe9a7c2-check-indicator-* for check marker | Distinct DOM objects, precise names. |

A new variable is justified only when it models a genuinely different subject, scope or state owner. Do not add version prefixes or another projection stage.

## Acceptance

All existing theme combinations, light/dark and inverse Menu cases, Chromium component visual states, CSS ratchets and native picker computed paint must remain green. PR #267 stays Draft until visual approval. Frozen Tree and Controller files must remain unchanged.

## 2026-10-14: resolved Button paint and inverse Tooltip/Choice ownership

- Button: original `button.css` remains the only background, border, text and shadow painter. The Theme visual module supplies existing normal/hover/focus/active/disabled variant state slots; the old late direct paint and `action-current` state surrogate are removed. An explicit `is-shadow` remains controlled by the component.
- TreeSelect: the checked/indeterminate indicator uses the same primary/primary-foreground Choice painter as Checkbox; the former TreeSelect-only Menu background foreground override is removed. Tree CSS/JS remain frozen.
- Tooltip: Tooltip uses the inverse **surface** pair (Theme foreground/background), just as Slider Tips. Inverted **Menu** changes `color-scheme` only for Menu-family popup roots; Tooltip is explicitly excluded from Menu inversion and Menu semantic projection, so it does not get inverted twice. Tooltip arrow consumes its own surface color.

## 2026-10-14: WheelPanel selection and Picker partition ownership

- **Single painter:** `.qxframe9a7c2-wheel-panel-center-guide` in `picker-family.css` alone paints its border and background. No `.picker-field-panel`-specific guide repaint is permitted; standalone WheelPanel, TimePanel, WheelPicker and TimePicker use the same source.
- **Coupled Theme pair:** guide uses existing `theme-menu-accent`, selected row ink uses `theme-menu-accent-foreground`. Compiler already generates subtle alpha Primary + readable Popover foreground and bold solid Primary + Primary foreground; the local `color-scheme` supplies light/dark/inverse without more tokens or selector lists.
- **Passive dividers:** WheelPanel column, Cascader column and TimePicker Now top edge all consume existing `theme-field-border`, not 26% Menu foreground or unrelated semantic border channels. Hover, keyboard Focus and checked indicators keep their own roles.
- **Preview03 overview:** four metrics now use actual `Card > CardContent`; private Preview03 CSS controls flex arrangement only, with the framework owning Card surface/outline/shadow/radius/insets.

- **Popup passive borders:** retired the redundant `menu-border-neutral` 26%-Menu-foreground mix. The Popup semantic border, subtle border, control border and ColorPanel passive Hover border now consume the same registered `theme-field-border` as Wheel/Cascader/TimePicker dividers. Theme accent continues to own selected/active/focus borders.

## 2026-10-14: WheelPanel Scroll/guide stacking correction

- Real `wheel-panel.js` appends the center guide to `wheel-panel-scroll` *after* creating a sibling `.qxframe9a7c2-scroll`. The columns' outer stacking index cannot order those two siblings.
- `picker-family.css` assigns **only** `.wheel-panel-scroll > .scroll` the existing `z-local-above=2` value, leaving `.wheel-panel-center-guide` at `z-local-raised=1`. Scroll text and interactive scrollbar paint above the guide; Guide remains the sole accent background painter and `pointer-events:none`.
- No `z-index:999`, global Scroll paint, selected-foreground rewrite, Theme registry edit or WheelPanel runtime edit. Browser acceptance must exercise the *real sibling DOM topology* rather than the old synthetic fixture that placed guide outside columns.

## 2026-10-14: Calendar DOM/Range surface owner (CALENDAR-RANGE-VISUAL-001)

- The existing `button.qxframe9a7c2-calendar-cell.qxframe9a7c2-date-panel-cell` retains `calendarDate`, disabled/tabIndex, selected/hover/today/range states, click delegation, active virtual focus and pointer handlers.
- Calendar creates **exactly two interior styling nodes** per button: `div.calendar-cell-view > div.calendar-cell-inner`. The day output is rendered only inside `inner`. No range DOM is created.
- The *outer button* `::before` is the sole range-strip painter. Horizontal fill covers 100% for middle days, the right half for start and left half for end. The pseudo inset-block is the same Calendar vertical cell padding, so week rows remain separate while days connect with `calendar-grid{gap:0}`. The square `inner` sits at z=2 above the strip (z=1) and consumes the existing `--_date-panel-cell-* `state roles.
- Selected, Hover, Today and keyboard state are still managed by the same Calendar logic. Calendar selected background physical paint is **removed** from the later Picker Theme painter; that file supplies variables only. PeriodPanel remains a separate 4-column DOM, unaffected by this change.
- No DatePicker-specific Calendar color/density patch, no standalone Range DOM, no new public tokens or compatibility aliases; DatePicker single/dual/DateTime consume one Calendar source.

- 2026-10-14 follow-up: removed the pre-existing `.date-picker-composite.has-time` Calendar cell size/height override. Minimum shared nine-row Calendar height now belongs to `.calendar.is-adaptive-month` itself. The date/week renderer's Theme cell-size still comes from the original Calendar size slot; DatePicker does not fork CSS for DateTime.

## 2026-10-14 — Calendar unit ownership

- Calendar is the single DOM, date selection/value, active keyboard/virtual focus, delegated click, range painter owner for date, week, month, quarter and year. Only data labels/count/navigation page change with unit.
- Month/quarter/year use existing Calendar button > cell-view > cell-inner DOM; `.calendar.is-period` expresses four-column unit geometry, not a separate widget. `PeriodPanel` old module is a direct import alias only; no second implementation. No new Theme tokens.

## 2026-10-15 — CALENDAR-WHEEL-GEOMETRY-001: geometry owner
- DatePicker `resolvedTimeOptions()` owns only embedded 7-item default; explicit `time.visibleItemCount` wins. WheelMetrics owns true item height (md=36px). WheelPanel alone computes viewport (252px), pad (108px) and snap.
- WheelPanel's central Guide is visual only: inherited private `--_qxframe9a7c2-wheel-guide-trim` is 0.25rem when nested inside DatePicker TimePanel; guide is 32px, actual items remain 36px; standalone wheels unaffected.
- DatePicker owns hosted Calendar flex width = seven current control-size cells + two 0.375rem Calendar insets. Inner Calendar consumes same width; Calendar group/host min-width=0. A dual-calendar divider uses inset shadow, so second seven-column geometry does not lose 1px. Standalone Calendar's size ownership remains independent.

## 2026-10-15 — CALENDAR-VIEW-MODE-OWNER-001
- Calendar immutable unit selects value precision. Mutable viewMode selects displayed date/month/year/decade and shares root/Focus/cell/Range painter. Intermediate year/month click triggers drill, not committed date selection.
- DatePicker removed detached year/month Calendar instances. Only primary/secondary actual display calendars remain; allowYearView and allowMonthView separately gate title disabled state and mouse/keyboard activation. The existing PeriodPanel alias remains one-line.
