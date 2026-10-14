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
