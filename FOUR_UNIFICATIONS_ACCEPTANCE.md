# Four-unifications acceptance matrix

This ledger tracks the handbook v3 migration, not merely the existing package build. `Base` means static ESM, Shared Protocol, 40 public contracts, type generation, canonical demos, and removal of the old runtime registry are already verified. `C partial` means some Focus/Interaction/Capability paths have migrated; it does **not** sign off all Phase C scenarios. `Pending` means no phase acceptance claim. No component has D–I signoff yet.

Evidence shared by all 40 rows: `verify:architecture` reports 40 components and no legacy runtime violations; `verify:contracts` reports 40 canonical contracts with no drift; `verify:types` compiles 40 component options; `verify:docs-canonical` checks the maintained demo pages; `verify:final` finds no reachable legacy runtime markers. Main CI/Pages [#338](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/35966293514) proves the **base** commit `37a506d`, not this worktree. Phase C browser evidence is local until a new PR workflow passes. Old writable paths and D–I acceptance require a separate owner-by-owner review even where legacy runtime files are gone.

| Public component | Source entry | Old writable path | Tests | CI | Canonical demo | D–I |
| --- | --- | --- | --- | --- | --- | --- |
| Cascader | Base; C partial (Focus, Capability) | Pending audit | Base; Focus | Base #338; C pending | Base | Pending |
| TreeSelect | Base; C partial (Focus, Capability) | Pending audit | Base; Focus | Base #338; C pending | Base | Pending |
| Select | Base; C partial (Focus, Capability) | Pending audit | Base; Focus | Base #338; C pending | Base | Pending |
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
| TimePicker | Base; C partial (Capability) | Pending audit | Base; now policy browser | Base #338; C pending | Base | Pending |
| ColorPicker | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| DatePicker | Base; C partial (Capability, preset Focus) | Pending audit | Base; preset/dual-panel browser | Base #338; C pending | Base | Pending |
| Pagination | Base | Pending audit | Base | Base #338 | Base | Pending |
| Menu | Base; C partial (Focus, scoped Interaction) | Pending audit | Base; repeat-Space browser | Base #338; C pending | Updated | Pending |
| Scroll | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Transfer | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Tabs | Base; C partial (Capability) | Pending audit | Base | Base #338; C pending | Base | Pending |
| Image | Base | Pending audit | Base | Base #338 | Base | Pending |
| JSON | Base | Pending audit | Base | Base #338 | Base | Pending |
| Tags | Base; C partial (Focus, Capability) | Pending audit | Base; Focus | Base #338; C pending | Base | Pending |
| Upload | Base | Pending audit | Base | Base #338 | Base | Pending |
| Table | Base; C partial (Focus, Capability) | Pending audit | Base; Hybrid Edit | Base #338; C pending | Base | Pending |
| Trigger | Base | Pending audit | Base | Base #338 | Base | Pending |
| Ripple | Base | Pending audit | Base | Base #338 | Base | Pending |
| Message | Base | Pending audit | Base | Base #338 | Base | Pending |
| Notification | Base | Pending audit | Base | Base #338 | Base | Pending |

Internal targets still requiring per-owner signoff: `TimePanel`, `Calendar`, `PeriodPanel`, `WheelPanel`, `ColorPanel`, `PickerField`, `Control`, `Field`, `ItemCollection`, `Tree`, `VirtualList`, native form controls, `OverlayRuntime`, `MotionCore`, `Config`, `NoticeService`, and `FormBridge`. Existing Phase C Focus migrations cover `TimePanel`, `Calendar`, `PeriodPanel`, and `WheelPanel`; this does not imply completion of their Interaction/Capability or later-phase contracts.

Acceptance rule: update a row only after source adoption, duplicate writable-path removal, relevant state/browser tests, exact-head CI, and canonical demo evidence exist. Record PR and workflow links in the row when a migration package passes. Keep overall completion in `AI_WORK_STATE.md` below 100% until every public and internal target passes.
