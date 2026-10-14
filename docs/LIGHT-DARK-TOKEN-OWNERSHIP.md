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
