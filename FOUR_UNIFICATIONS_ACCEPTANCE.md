# Four-unifications acceptance matrix

This ledger tracks the handbook v3 migration, not merely the existing package build. `Base` means static ESM, Shared Protocol, 40 public contracts, type generation, canonical demos, and removal of the old runtime registry are already verified. `C accepted` means the component is within the handbook Phase C priority scope and its Focus/Interaction/Capability owner path, duplicate-key-path removal, capability behavior and browser/CI gates are signed off. `C partial` remains valid for non-priority components that only consume part of the Phase C foundation. `Pending` means no phase acceptance claim. No component has D–I signoff yet.

Evidence shared by all 40 rows: `verify:architecture` reports 40 components and no legacy runtime violations; `verify:contracts` reports 40 canonical contracts with no drift; `verify:types` compiles 40 component options; `verify:docs-canonical` checks the maintained demo pages; `verify:final` finds no reachable legacy runtime markers. Phase C foundation landed in PR #56 / CI #343 (`35972148887`), then owner-level priority packs landed in PR #58 / #59 / #60 / #61 with exact-head CI #358 / #360 / #362 / #364. Merged main CI + Pages #359 / #361 / #363 / #365 are green. Therefore the **handbook Phase C priority scope is accepted**; this does not claim all 40 components have D–I signoff or that the overall 11-Controller migration is complete. Phase D first packs are independently landed through PR #55 and #57.

| Public component | Source entry | Old writable path | Tests | CI | Canonical demo | D–I |
| --- | --- | --- | --- | --- | --- | --- |
| Cascader | Base; C accepted (Focus, Interaction, Capability) | Control-level duplicate key path + stale panel-key path removed | Base; Focus; `verify:phase-c-popup-composites` | PR #60 CI #362; main #363 | Base | Pending |
| TreeSelect | Base; C accepted (Focus, Interaction, Capability) | Control-level duplicate key path removed; instance capability owner | Base; Focus; `verify:phase-c-popup-composites` | PR #60 CI #362; main #363 | Base | Pending |
| Select | Base; C accepted (Focus, Interaction, Capability) | Physical-key business map removed; PopupField uses semantic open capability | Base; Focus; `verify:phase-c-select` | PR #59 CI #360; main #361 | Base | Pending |
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
| Transfer | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Tabs | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Image | Base | Pending audit | Base | Base #338 | Base | Pending |
| JSON | Base | Pending audit | Base | Base #338 | Base | Pending |
| Tags | Base; C accepted (Focus, Interaction, Capability) | Duplicate root keydown removed; native input edit subdomain retained | Base; Focus; `verify:phase-c-tail` | PR #61 CI #364; main #365 | Base | Pending |
| Upload | Base | Pending audit | Base | Base #338 | Base | Pending |
| Table | Base; C accepted (Focus, Interaction scopes, Capability) | Main grid/filter/resize semantic scopes; native editor subdomain retained | Base; Hybrid Edit; `verify:phase-c-tail` | PR #61 CI #364; main #365 | Base | Pending |
| Trigger | Base | Pending audit | Base | Base #338 | Base | Pending |
| Ripple | Base | Pending audit | Base | Base #338 | Base | Pending |
| Message | Base | Pending audit | Base | Base #338 | Base | Pending |
| Notification | Base | Pending audit | Base | Base #338 | Base | Pending |

Phase C internal priority signoff is complete for `TimePanel`, `Calendar`, `PeriodPanel`, and `WheelPanel` through PR #58 / CI #358 and main #359. Other internal targets (`ColorPanel`, `PickerField`, `Control`, `Field`, `ItemCollection`, `Tree`, `VirtualList`, native form controls, `OverlayRuntime`, `MotionCore`, `Config`, `NoticeService`, `FormBridge`) remain subject to their owning later phase or final Phase H/I signoff; Phase C acceptance does not pre-claim those later contracts.

Acceptance rule: update a row only after source adoption, duplicate writable-path removal, relevant state/browser tests, exact-head CI, and canonical demo evidence exist. Record PR/workflow evidence in the row when a migration package passes. Phase acceptance and overall migration completion are separate: Phase C is accepted for its handbook priority scope, while `AI_WORK_STATE.md` must remain below 100% until all public/internal targets and later D–I phases pass.
