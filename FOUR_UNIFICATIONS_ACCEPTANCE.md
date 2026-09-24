# Four-unifications acceptance matrix

This ledger tracks the handbook v3 migration, not merely the existing package build. `Base` means static ESM, Shared Protocol, 40 public contracts, type generation, canonical demos, and removal of the old runtime registry are already verified. `C accepted` means the component is within the handbook Phase C priority scope and its Focus/Interaction/Capability owner path, duplicate-key-path removal, capability behavior and browser/CI gates are signed off. `D accepted` means the component is within the handbook Phase D selection scope and its SelectionController authority, multi-channel/revision behavior and browser/CI gates are signed off. `C partial` remains valid for non-priority components that only consume part of the Phase C foundation. `Pending` means no phase acceptance claim.

Evidence shared by all 40 rows: `verify:architecture` reports 40 components and no legacy runtime violations; `verify:contracts` reports 40 canonical contracts with no drift; `verify:types` compiles 40 component options; `verify:docs-canonical` checks the maintained demo pages; `verify:final` finds no reachable legacy runtime markers. Phase C foundation landed in PR #56 / CI #343 (`35972148887`), then owner-level priority packs landed in PR #58 / #59 / #60 / #61 with exact-head CI #358 / #360 / #362 / #364 and green main + Pages #359 / #361 / #363 / #365. Phase D landed through PR #55 / #57 / #62 / #63 / #64 with exact-head CI #341 / #344 / #366 / #368 / #371 and green main + Pages #342 / #345 / #367 / #369 / #372. Therefore the **handbook Phase C and Phase D scopes are accepted**; this does not claim later E–I signoff or overall 9-Runtime-Controller plus CSS Theme/Token completion.

| Public component | Source entry | Old writable path | Tests | CI | Canonical demo | D–I |
| --- | --- | --- | --- | --- | --- | --- |
| Cascader | Base; C accepted; D accepted (Selection) | Duplicate key paths removed; direct Selection/Hierarchy/anchor ownership migrated | Base; Focus; `verify:phase-c-popup-composites`; `verify:phase-d-popup-selection` | PR #60 CI #362; PR #64 CI #371; main #372 | Base | D accepted; E–I pending |
| TreeSelect | Base; C accepted; D accepted (Selection) | Duplicate key path removed; reuses Tree selected/checked SelectionController channels | Base; Focus; `verify:phase-c-popup-composites`; `verify:phase-d-popup-selection` | PR #60 CI #362; PR #64 CI #371; main #372 | Base | D accepted; E–I pending |
| Select | Base; C accepted; D accepted (Selection) | Physical-key map removed; reuses OptionList SelectionController identity | Base; Focus; `verify:phase-c-select`; `verify:phase-d-popup-selection` | PR #59 CI #360; PR #64 CI #371; main #372 | Base | D accepted; E–I pending |
| Autocomplete | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Carousel | Base | Pending audit | Base | Base #338 | Base | Pending |
| Collapse | Base | Pending audit | Base | Base #338 | Base | Pending |
| InputNumber | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| InputOTP | Base | Pending audit | Base | Base #338 | Base | Pending |
| Loading | Base | Pending audit | Base | Base #338 | Base | Pending |
| Progress | Base | Pending audit | Base | Base #338 | Base | Pending |
| Slider | Base | Pending audit | Base | Base #338 | Base | Pending |
| Sort | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Steps | Base | Pending audit | Base | Base #338 | Base | Pending |
| Rate | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Tooltip | Base | Pending audit | Base | Base #338 | Base | Pending |
| TagInput | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Popconfirm | Base | Pending audit | Base | Base #338 | Base | Pending |
| Popover | Base | Pending audit | Base | Base #338 | Base | Pending |
| Dropdown | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Modal | Base | Pending audit | Base | Base #338 | Base | Pending |
| Drawer | Base | Pending audit | Base | Base #338 | Base | Pending |
| Result | Base | Pending audit | Base | Base #338 | Base | Pending |
| WheelPicker | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| TimePicker | Base; C accepted (Focus, Interaction delegation, Capability) | Capability state propagated to TimePanel/WheelPanel; no second key owner | Base; policy browser; `verify:phase-c-composite` | PR #58 CI #358; main #359 | Base | Pending |
| ColorPicker | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| DatePicker | Base; C accepted (Focus, Interaction delegation, Capability) | Calendar/PeriodPanel capability + semantic action ownership; preset Focus retained | Base; preset/dual-panel browser; `verify:phase-c-composite` | PR #58 CI #358; main #359 | Base | Pending |
| Pagination | Base | Pending audit | Base | Base #338 | Base | Pending |
| Menu | Base; C accepted (Focus, scoped Interaction, Capability) | Scoped semantic action route; repeat activation gate | Base; repeat-Space browser | PR #56 CI #343; main #346 | Updated | Pending |
| Scroll | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Transfer | Base; C partial (Capability); D accepted (Selection) | Source/target checked stores unified under one multi-channel SelectionController; final target value/order remains separate authority | Base; `verify:selection-controller`; Transfer Chromium regression | PR #57 CI #344; main #345 | Base | D accepted; E–I pending |
| Tabs | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Image | Base | Pending audit | Base | Base #338 | Base | Pending |
| JSON | Base | Pending audit | Base | Base #338 | Base | Pending |
| Tags | Base; C accepted; D accepted (Selection) | Duplicate root keydown removed; direct Selection owner replaced by SelectionController selected channel | Base; Focus; `verify:phase-c-tail`; `verify:phase-d-tags-selection` | PR #61 CI #364; PR #63 CI #368; main #369 | Base | D accepted; E–I pending |
| Upload | Base | Pending audit | Base | Base #338 | Base | Pending |
| Table | Base; C accepted; D accepted (Selection) | Main interaction scopes retained; local/remote selection moved behind one SelectionController with DataRevision/query semantics | Base; Hybrid Edit; `verify:phase-c-tail`; `verify:phase-d-table-selection` | PR #61 CI #364; PR #62 CI #366; main #367 | Base | D accepted; E–I pending |
| Trigger | Base | Pending audit | Base | Base #338 | Base | Pending |
| Ripple | Base | Pending audit | Base | Base #338 | Base | Pending |
| Message | Base | Pending audit | Base | Base #338 | Base | Pending |
| Notification | Base | Pending audit | Base | Base #338 | Base | Pending |

Phase C internal priority signoff is complete for `TimePanel`, `Calendar`, `PeriodPanel`, and `WheelPanel` through PR #58 / CI #358 and main #359. Phase D internal selection signoff is complete for `ItemCollection`, `List`, `OptionList`, and `Tree` through PR #55 / CI #341 and subsequent consumer packs; `ActiveItem` remains the active-key authority. Other internal targets (`ColorPanel`, `PickerField`, `Control`, `Field`, `VirtualList`, native form controls, `OverlayRuntime`, `MotionCore`, `Config`, `NoticeService`, `FormBridge`) remain subject to their owning later phase or final Phase H/I signoff.

Acceptance rule: update a row only after source adoption, duplicate writable-path removal, relevant state/browser tests, exact-head CI, and canonical demo evidence exist. Record PR/workflow evidence in the row when a migration package passes. Phase acceptance and overall migration completion are separate: Phase C and Phase D are accepted for their handbook scopes, while `AI_WORK_STATE.md` must remain below 100% until all public/internal targets and later E–I phases pass.
