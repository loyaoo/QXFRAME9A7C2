# QXFRAME9A7C2 Final Audit Remediation — 2026-09-25

This document records the remediation prompted by real browser testing plus the GPT-6 Astra / GPT-5.6 Sol audit pass. It is a delta document; the master architecture remains the handbook referenced by `AI_WORK_STATE.md`.

## Confirmed root causes and fixes

### Value changes silently reverting
The migration had inferred controlled ownership from the mere presence of `value`. This broke the framework's established public behavior where `value` may initialize/currently set a component and the user can continue editing it. `ValueController`, `StateController`, field/value bindings, and affected components now treat ownership as controlled only when `controlled:true` is explicit. `updateOptions({value})` synchronizes the value without silently changing ownership mode.

The same pattern was audited beyond the reported InputOTP, TagInput and Select cases, including Autocomplete, Cascader, Collapse, Dropdown, InputNumber, Rate, Slider, Table, Tags, TreeSelect and Upload. Explicit controlled behavior is retained and covered separately.

### Ripple lifecycle regression
Inside Ripple animations run on `::after`, while the migrated wait path inspected the host wave only. `MotionController.waitMotionEnd()` now supports an optional pseudo-element and animation-name filter, and Ripple waits for the exact inside/outside enter/leave animation. Browser regression coverage now asserts press-time inside expansion, release-time inside fade plus outside expansion, overlapping rapid-click waves, cleanup, and declarative `.qxframe9a7c2-button.is-ripple` auto-enhancement.

### DatePicker range/drill focus
The new dual-panel drill-owner memory allowed primary and secondary calendars to become competing keyboard anchors. Year/month drill return now restores one canonical primary date anchor before virtual-focus projection, avoiding start/end endpoint jumping caused by physical-panel ownership changes.

### DatePicker preset focus ring
The presets container remains the real DOM focus owner, but its `:focus-visible` outline is suppressed when acting as a virtual-focus owner. The active `.qxframe9a7c2-date-picker-preset.is-keyboard-focus` now owns the visible keyboard outline.

### Audit/release integrity findings
Popover now inherits the correct reference element and reports title/action presence from DOM attachment rather than stale `hidden` state. Phase-I release verification no longer hard-codes one temporary checkpoint sentence. CI no longer ignores all Markdown changes while verification consumes Markdown. Machine-readable state/canonical ownership now aligns with ComponentProfile's ValueController, SelectionController and OverlayController ownership, with an automated cross-check gate.

## Verification added or updated
- `tools/verify-final-audit-regressions.mjs` — direct Chromium regressions for the user-reported failures.
- `tools/verify-architecture-manifest-alignment.mjs` — prevents machine-readable ownership metadata from drifting from ComponentProfile.
- controlled-mode fixtures now opt in with `controlled:true` instead of treating `value` as an implicit ownership switch.
- generated component API metadata is synchronized with the explicit controlled option contract.

## Validation state before GitHub upload
Source ESM browser, source UMD browser, high-risk browser, final-audit regressions, architecture-manifest alignment, contracts, types and targeted Phase gates pass locally. The only incomplete local full-release step is Rollup/package build because this transient uploaded-source workspace has no Rollup provider installed; GitHub Actions remains the authoritative build/package/Pages validation environment.
