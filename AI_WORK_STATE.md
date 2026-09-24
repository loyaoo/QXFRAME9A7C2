# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-09-24
- Repository: `loyaoo/QXFRAME9A7C2`
- Repository HEAD: always query Git on resume; do not cache a self-invalidating HEAD in this file
- Last code-affecting main commit: `bf3823248a7a5725b20a9711dfc12736bf7ff60e` (PR #63 merge)
- Current branch: `refactor/phase-d-popup-selection-closeout-20260924`
- Open PRs at this checkpoint: pending final PHASE-D-005 selection PR
- Branch inventory at this checkpoint: `main` + current task branch; stale/superseded historical branches remain removed
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`
- Latest green Controller PR CI: #368 / `35985407152` (PR #63)
- Latest green main CI + Pages: #369 / `35985810168`
- Controller migration implementation progress: 99%
- Current Phase: Phase D — Selection
- Current Task: `PHASE-D-005`

## CURRENT

### PHASE-D-005 — Select / TreeSelect / Cascader selection closeout
Status: IN_PROGRESS
Task progress: 80%

Why this is current:
- PHASE-D-004 Tags selection is merged and green through PR #63 / CI #368 and main CI + Pages #369.
- Select and TreeSelect already consume canonical SelectionController stores indirectly through OptionList and Tree; their remaining work is explicit component ownership/facade signoff rather than another store migration.
- Cascader still owns a direct Selection plus a component-local selectionAnchorValue and direct HierarchicalSelection facade; it is the final substantive Phase D selection owner.
- public value authority for all three remains ValueController; SelectionController must stay the selection execution/anchor/revision authority only.

Frozen impact map:
- Select must expose/reuse OptionList SelectionController identity and declare selection ownership without creating another store.
- TreeSelect must expose/reuse Tree SelectionController selected/checked channels and declare selection ownership without duplicating checked state.
- Cascader selected values move behind one SelectionController selected channel; hierarchical state delegates through the controller facade.
- Cascader component-local selectionAnchorValue is removed; controller anchor is revision-bound.
- Cascader item replacement and lazy child-load dataset changes advance selection data revision.
- active path/column/keyboard cursor remains Cascader navigation state, not SelectionController activeKey.
- Phase C Interaction/Capability and ValueController controlled/proposal semantics remain unchanged.

Scope:
- explicit SelectionController facades/profile ownership for Select and TreeSelect;
- migrate Cascader direct Selection/HierarchicalSelection/anchor ownership into SelectionController;
- preserve Cascader multiple/checkedStrategy/changeOnSelect/search/lazy-load/controlled behavior;
- add dedicated source + Chromium regression gates for controller identity, selected/checked channels, Cascader dataset revision and stale-anchor invalidation;
- run full release acceptance, then sign off Phase D.

Implemented in current PHASE-D-005 final selection pack:
- Select explicitly exposes and declares the existing OptionList SelectionController; no second selected store is created.
- TreeSelect explicitly exposes and declares the existing Tree SelectionController with selected/checked channels; no duplicate checked store is created.
- Cascader removes direct Selection and HierarchicalSelection imports and creates one SelectionController selected channel; hierarchy delegates through `selectionController.createHierarchy()`.
- Cascader removes component-local `selectionAnchorValue`; the selection anchor is owned by SelectionController and read through the revision-bound anchor API.
- Cascader item replacement and lazy child loads advance selected-channel dataset revision so stale anchors cannot survive changed hierarchy data.
- Cascader public value remains ValueController-owned; active path/column/cursor remain Cascader navigation state and are not moved into SelectionController.
- new required `verify:phase-d-popup-selection` passes sandbox Chromium for Select/OptionList controller identity, TreeSelect/Tree selected+checked identity and Cascader dataset-revision anchor invalidation.
- adjacent sandbox gates pass: `verify:selection-controller`, `verify:phase-c-popup-composites`, `verify-source-esm-browser`, `verify:high-risk-browser`, `verify:architecture`, `verify:contracts`.

Next exact step:
1. open/run the final PHASE-D-005 selection PR from the audited branch;
2. fix only exact-head release/browser failures without adding duplicate selection/value/active-key stores;
3. merge only green and verify main release + Pages;
4. mark Phase D Selection as DONE and update the acceptance ledger;
5. advance CURRENT to Phase E — Overlay + Motion.

## Current authority snapshot — after Phase A

This section is current-state truth. Do not treat earlier Phase A gap findings as still active if they conflict with this snapshot.

- Action/event metadata: `ActionContext` and structured `OperationResult` exist above existing `InteractionDetails`, `OpenStateBridge` and logical events.
- Value ownership: `ValueController` is the canonical committed/draft/preview/rawInput/session/revision authority. `ValueDraft` is a compatibility alias and `StateController.create()` delegates to it; `ControllableStateCore` still owns controlled/external-vs-internal and pending-request metadata. DatePicker / TimePicker / ColorPicker / WheelPicker declare ValueController ownership directly. There is no second committed value.
- Logical ownership: `LogicalOwnership` remains node/parent-child authority; `LogicalOwnerTree` exists as the shared facade/registry layer.
- Focus/navigation: `FocusController` is the aggregate entry point over `FocusManager`, `FocusScope`, `KeyboardRegion` and `KeyboardNavigation` virtual focus. WheelPanel / TimePanel / Calendar / PeriodPanel / Select / TreeSelect / Cascader / Menu / Tags / Table enter through it. Underlying ActiveItem/RovingProjection/domain state remains the execution truth. Handbook Phase C Focus scope is accepted.
- Interaction/capability: `InteractionController` is the semantic key/action + logical scope routing entry and `KeyboardNavigation` consumes its resolver; `CapabilityController` is the component-facing entry over `InteractionPolicy`. Handbook Phase C priority owners are accepted through PR #56 and #58–#61, including Date/Time composites, Menu, Select, TreeSelect, Cascader, Tags and Table.
- Overlay/open: `OpenStateBridge`, `OverlayRuntime`, `LayerManager`, `DismissableLayer` and `PopupSurface` remain the existing authorities. OverlayController must not become a second public open-state owner.
- Form: `FormBridge` remains native field/FormData/reset carrier authority.
- Theme/token: `Config` remains root/scoped theme and token projection authority; Theme/Token Controller adoption is pending.
- Selection/data: `Selection`, `HierarchicalSelection`, `Collection`, `ActiveItem` and `TableModel` remain the current execution authorities. `Collection` uses shared `DataRevision`; PHASE-D-001 now elevates SelectionController over the existing selection stores without moving activeKey out of ActiveItem or creating a second selected-key truth.
- Projection/scheduling: shared `ProjectionScheduler` exists over `Scheduler`, but it is intentionally not inserted into synchronous `DOMProjection` / `RovingProjection` paths until it can replace a real stale/async projection owner.
- Motion: `MotionCore`, `Transition` and `TransitionGroup` remain the low-level motion authority; no parallel generation counter may be introduced.
- Environment: `ObserverHub` now delegates Resize/Mutation/Intersection/media environment resolution to shared `EnvironmentPort`; additional ad-hoc environment consumers migrate only when their owning Controller/family is touched.
- Diagnostics: semantic `Diagnostics` with stable codes is injectable; `Collection` reports duplicate stable keys observationally when a sink is supplied. Further diagnostics adoption occurs with the owning Controller.
- Component capability declaration: `Component` and `ComponentRuntime` now carry validated immutable `ComponentProfile` metadata; concrete profiles are authored as each family migrates, with no runtime component-name inference.
- Input modality: existing `InteractionModality` remains the authority and now exposes touch/programmatic modalities plus the `InputModality` alias.
- Shared Protocol verification: `verify:shared-protocol` covers the foundation plus Collection/ValueDraft/StateController integration.

## ACTIVE KNOWN ISSUES — NOT DONE

These are current QA targets for later Controller/family migration. They are not PHASE-A-003 scope unless an authority adoption directly touches them.

- DatePicker/TimePicker preset selection must respect `needConfirm`; PR #56 adds the DatePicker preset single-Tab-stop/virtual-arrow focus region, while needConfirm/value-commit semantics and TimePicker parity still require Phase C verification.
- Collapse rapid open/close reversal still needs autosize Motion-level verification/fix rather than a component-local timer patch.

## DONE / VERIFIED EXISTING

### PHASE-D-004 — Tags SelectionController semantics
Status: DONE
Evidence:
- PR #63 merged
- merge commit `bf3823248a7a5725b20a9711dfc12736bf7ff60e`
- PR CI #368 / `35985407152`: success
- main CI + Pages #369 / `35985810168`: success
Outcome:
- Tags direct Selection ownership is replaced by one SelectionController selected channel.
- public controlled/uncontrolled value remains owned by the existing ValueController/StateController binding.
- item membership/order/value mutations advance selection dataset revision and invalidate stale anchors.
- controlled proposal/external-sync, FormBridge and Phase C interaction/capability behavior remain intact.
- required `verify:phase-d-tags-selection` covers controller identity, pruning, revision invalidation and controlled semantics.

### PHASE-D-003 — Table local/remote SelectionController semantics
Status: DONE
Evidence:
- PR #62 merged
- merge commit `af757cb76c7511c46ae4953da4da718a08a3c20e`
- PR CI #366 / `35984401592`: success
- main CI + Pages #367 / `35984812326`: success
Outcome:
- TableModel local selected keys are the SelectionController `selected` channel; direct Selection ownership is removed.
- TableModel dataset DataRevision invalidates stale selection anchors across data mutations.
- Table remote query-wide selection uses a SelectionController semantic channel with allMatching/queryKey/excludedKeys/knownCount/revision.
- remote exclusions reuse Selection and allMatching is never materialized as current-page selectedKeys.
- Table reuses the exact TableModel SelectionController while Focus/Interaction/Capability/Hybrid Edit authorities remain unchanged.
- required `verify:phase-d-table-selection` covers Node/store identity and Chromium remote-query semantics.

### PHASE-C-004D — Tags/Table Interaction + Capability tail
Status: DONE
Evidence:
- PR #61 merged
- merge commit `56bbf6698a9116630c37158fbdd9879269c18a25`
- PR CI #364 / `35981073140`: success
- main CI + Pages #365 / `35981438989`: success
Outcome:
- standalone Tags owns one InteractionController scope + one instance CapabilityController while native input editing remains a separate child edit domain.
- duplicate Tags root keydown business ownership is removed; printable +Add entry routes through the canonical FocusController/InteractionController path.
- Table owns explicit main-grid, filter-popup and resize-session interaction scopes with one CapabilityController snapshot.
- Table native cell editor remains an edit subdomain; filter F6 and resize Escape listeners are delivery surfaces rather than parallel business-key authorities.
- required `verify:phase-c-tail` gates source ownership plus Chromium behavior.

### PHASE-C-004 — Focus + Interaction + Capability priority scope
Status: DONE
Evidence:
- foundation PR #56
- owner packs PR #58 / #59 / #60 / #61
- exact-head CI #343 / #358 / #360 / #362 / #364: success
- merged main + Pages #346 / #359 / #361 / #363 / #365: success
Outcome:
- handbook Phase C priority set (TimePanel, Date Calendar/PeriodPanel, Select, TreeSelect, Cascader, Menu, Tags, Table Hybrid Edit) is accepted.
- canonical real-focus ownership, scoped semantic interaction, native/IME priority, repeat suppression, Home/End/Page behavior and loading/readOnly/disabled operation gates are covered by required browser/source gates.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` records C accepted only for the Phase C priority public components; non-priority rows remain Base/C partial until their owning later phase or final H/I signoff.
- Phase C acceptance does not imply overall 11-Controller completion; current work resumes at Phase D.

### PHASE-C-004C — TreeSelect/Cascader Interaction + Capability owners
Status: DONE
Evidence:
- PR #60 merged
- merge commit `a2cf08c4777d1afbc94b958cc229415b1ef255a5`
- PR CI #362 / `35979415228`: success
- main CI + Pages #363 / `35979815823`: success
Outcome:
- TreeSelect/Cascader use explicit InteractionController + CapabilityController ownership.
- FocusController/KeyboardNavigation is the sole DOM keyboard owner.
- readOnly/busy browse behavior is separated from mutation authority.
- Cascader child traversal remains available without leaf commit while locked.
- legacy duplicate Cascader panel-keydown logic is removed.

### PHASE-C-004B — Select Interaction + Capability reference
Status: DONE
Evidence:
- PR #59 merged
- merge commit `460895256268187c5a795aa9c7e2348e558239f3`
- PR CI #360 / `35977872248`: success
- main CI + Pages #361 / `35978193325`: success
Outcome:
- PopupField open lifecycle uses semantic open capability.
- Select has explicit InteractionController + CapabilityController ownership with one DOM keyboard owner.
- readOnly/busy browsing remains possible while value mutation is blocked; disabled cannot open.
- IME, repeat activation, native caret and controlled proposal behavior are required browser gates.

### PHASE-C-004A — Date/Time composite Interaction + Capability owners
Status: DONE
Evidence:
- PR #58 merged
- merge commit `75d07e96d6648ee2f7a695b05a722b1252817383`
- PR CI #358 / `35976568725`: success
- main CI + Pages #359 / `35977068529`: success
Outcome:
- WheelPanel / Calendar / PeriodPanel have explicit InteractionController + CapabilityController ownership without a second DOM keyboard listener.
- TimePanel has local CapabilityController authority and delegates interaction to its canonical WheelPanel scope.
- DatePicker / TimePicker propagate busy/loading capability state into inner composite panels.
- readOnly/loading browsing, mutation blocking, disabled blocking, IME pass-through and repeat activation suppression are browser-gated.
- semantic action-to-key projection is centralized in InteractionController.

### PHASE-C-FOUNDATION — InteractionController + CapabilityController
Status: DONE
Evidence:
- PR #56 merged
- merge commit `599076ed92b88b2464e45b3a926acbb9324ce757`
- PR CI #343 / `35972148887`: success
- joint main CI + Pages #346 / `35973772633`: success
Outcome:
- canonical InteractionController and CapabilityController foundations exist.
- Menu routes semantic keyboard actions through a logical InteractionController scope and held non-navigation activation is repeat-suppressed.
- DatePicker presets use a FocusController virtual region with one composite Tab stop and arrow/Home/End navigation.
- CapabilityController provides operation-level semantics while preserving bounded InteractionPolicy compatibility forwarding.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` intentionally records Phase C as partial; this foundation entry does not claim full Phase C completion.

### PHASE-D-002 — Transfer multi-channel selection + per-channel DataRevision
Status: DONE
Evidence:
- PR #57 merged
- merge commit `fb4e5fb5ee8ba8644916431d431de5e18e1edd5a`
- PR CI #344 / `35972507182`: success
- main CI + Pages #345 / `35972849325`: success
Outcome:
- SelectionController supports channel-scoped revision sources without a second selected-key store.
- ItemCollection binds Collection revision to its explicit selection channel.
- Transfer uses one SelectionController with independent `sourceChecked` / `targetChecked` channels.
- source/target dataset revisions invalidate only their own anchors.
- final target value/order remains Transfer + targetOrder authority and FormBridge source.
- structural and Chromium/browser regressions cover single-facade identity, checked-channel independence and per-channel stale-anchor invalidation.

### PHASE-C foundation supplement — InteractionController + CapabilityController
Status: FOUNDATION DONE / ACCEPTANCE SUPERSEDED BY PHASE-C-004
Evidence:
- PR #56 merged
- merge commit `599076ed92b88b2464e45b3a926acbb9324ce757`
- PR CI #343 / `35972148887`: success
- merged main CI + Pages #346 / `35973772633`: success
Outcome:
- added CapabilityController as component-facing entry over InteractionPolicy and required structural gate.
- added InteractionController semantic action/scope routing and canonical keyboard resolver.
- KeyboardNavigation uses canonical InteractionController key resolution and blocks activation repeat by default.
- Menu uses an explicit logical InteractionController scope; held Space no longer repeats multiple selection.
- DatePicker presets use one virtual-focus region and dual-panel drill first-arrow regressions are covered.
- owner-by-owner Phase C priority acceptance is now complete in PHASE-C-004; this foundation supplement is retained only as historical evidence.

### Repository branch cleanup
Status: DONE
Evidence:
- audited 68 branches against current main and all PR associations.
- PR #56 was the only remaining useful independent line and was merged before cleanup.
- closed/merged/superseded historical fix/staging branches were removed by a one-shot temporary Actions branch.
- cleanup run #3 / `35974049408`: success.
Outcome:
- repository branch count reduced from 68 to 1.
- only `main` remains.
- the temporary cleanup branch deleted itself and no cleanup workflow was merged into main.

### PHASE-D-001 — SelectionController foundation + ItemCollection/List/OptionList/Tree first pack
Status: DONE
Evidence:
- PR #55 merged
- merge commit `2933f1feae0b6bf6891f4db5fe578984aca8aa54`
- PR CI #341 / `35970615817`: success
- main CI + Pages #342 / `35970931277`: success
Outcome:
- SelectionController composes canonical Selection / HierarchicalSelection stores and revision-bound anchors without a second selected-key store.
- Selection uses shared DataRevision for reentrant/stale mutation protection and exposes revision refs.
- ItemCollection/List/OptionList route selection through SelectionController while retaining raw Selection compatibility.
- Tree uses one controller with independent selected/checked channels and shares the selected channel with its ItemCollection.
- ActiveItem remains the sole activeKey owner.
- required structural gate and browser regressions cover single-store identity, selected/checked separation and stale-anchor invalidation.
- sandbox targeted gates passed before merge: verify:selection-controller, verify:shared-protocol, verify:collection-family, verify:architecture.

### PHASE-C-003 — Table Hybrid Edit focus lease
Status: DONE
Evidence:
- PR #54 merged
- merge commit `37a506d3c6dc2bfdfe3e00a059e7f0fb9970bd49`
- PR CI #337 / `35965963724`: success
- main CI + Pages #338 / `35966293514`: success
Outcome:
- Table root keyboard navigation enters through FocusController with the existing F6/arrows/Home/End/Page/Enter/Space/F2 keymap preserved.
- cells/header virtual domains use FocusController canonical binding with existing reconcile/visibility algorithms intact.
- Hybrid Edit keeps editTransaction as draft/validate/save/cancel authority; FocusController owns only the root-to-editor real-focus lease.
- Escape rollback restores initial editor value, releases the lease and returns focus to the Table root.
- native textarea/contenteditable Enter remains editor-owned; readOnly/disabled/loading mutation gates remain Table/InteractionPolicy owned.
- Table ComponentProfile declares FocusController ownership only; Table selection remains deferred to Phase D.
- browser coverage verifies lease acquire/release, rollback/root return, native Enter and readOnly/disabled blocking while retaining virtual-scroll edit survival.


### PHASE-C-002 — Popup-hosted + standalone composite focus migration
Status: DONE
Evidence:
- PR #53 merged
- merge commit `6bb926b93c4f0f16dae042cc41f8426bf77d4733`
- PR CI #335 / `35962474270`: success
- main CI + Pages #336 / `35962763162`: success
Outcome:
- Select / TreeSelect / Cascader editable hosts enter through FocusController with `manageTabIndex:false`, preserving Control/Field tabindex ownership.
- Menu root uses FocusController and canonical domain binding while retaining existing menu keymap/typeahead/disclosure behavior.
- Tags standalone root uses FocusController; TagNavigation remains canonical tag-domain behavior owner.
- Tags +Add editor uses FocusController edit lease and releases it on all existing add-exit paths.
- browser coverage verifies popup real-focus retention + one ring, Menu root ownership and Tags lease acquire/release.


### PHASE-C-001 — FocusController foundation + Time/Date composite regions
Status: DONE
Evidence:
- PR #52 merged
- merge commit `a1f19b25ceb2de4ef238e5bbc7d3c4c250c366b0`
- PR CI #333 / `35960898199`: success on attempt 2
- main CI + Pages #334 / `35961330135`: success
- #333 attempt 1 failed only the unrelated high-risk NoticeClock explicit-realm timing check; identical HEAD passed on retry, so runtime was not changed.
Outcome:
- added FocusController as facade over existing focus authorities with no second DOM-focus/domain engine.
- TimePanel root is the sole real-focus/Tab owner; inner WheelPanel is hosted/non-tabbable and the active wheel item owns the visible ring.
- Calendar / PeriodPanel / WheelPanel use the FocusController entry path and canonical virtual-domain binding.
- DatePicker-hosted Calendar keeps real focus on the editor with one virtual cell ring.
- canonical root outline duplication was removed.
- frozen HOTFIX6 artifact remains unchanged; a Phase-C derived compatibility smoke differs in exactly the two superseded TimePanel focus-owner checks, enforced by release-preflight.


### PHASE-B-002 — ValueController + picker-like popup second migration pack
Status: DONE
Evidence:
- PR #51 merged
- merge commit `7f3a475565fec5548871e7c6c52a7ed8c0e945bc`
- PR CI #326 / `35958353342`: success
- main CI + Pages #327 / `35958853046`: success
Outcome:
- `ValueController.createValueBinding()` and `createOptionValueBinding()` are canonical; StateController is compatibility forwarding for these helpers.
- Select / TreeSelect / Cascader use ValueController directly for controlled/defaultValue binding.
- Autocomplete uses ValueController directly for committed/draft value.
- all four declare explicit ValueController ComponentProfile ownership while retaining existing Search/Selection/Tree/OptionList focus authorities.
- structural and browser gates preserve controlled proposal/external-sync and uncontrolled defaultValue semantics.


### PHASE-B-001 — ValueController + Picker Family first migration pack
Status: DONE
Evidence:
- PR #50 merged
- merge commit `be2263e5c9cd388efe42142cfa28657fe0c8f5b4`
- PR CI #324 / `35957442947`: success
- main CI + Pages #325 / `35957755294`: success
- CI #322 initially failed only because TimePicker/WheelPicker duplicated the same scoped Enter-confirm block; the implementation was centralized in `PickerComponent.confirmFromKeyboard()`, then Completion audit and full release passed.
Outcome:
- canonical `ValueController` owns committed/draft/preview/rawInput/session/revision channels; `ValueDraft` is its compatibility alias.
- `PickerSession.close()` no longer performs hidden dirty commit; uncommitted draft rolls back by default.
- DatePicker / TimePicker / ColorPicker / WheelPicker create ValueController directly and declare ComponentProfile ownership.
- Date/Time raw input and hover preview are controller channels; ColorPicker hot-path interaction is preview-first and promotes to draft on completion.
- scoped Enter confirmation is shared by PickerComponent and used by TimePicker / ColorPicker / WheelPicker only in their open confirm session.
- browser coverage verifies draft projection without FormData commit, Esc rollback, immediate preset commit, and scoped Enter confirm.

### PHASE-A-003 — EnvironmentPort / Diagnostics / ComponentProfile authority adoption
Status: DONE
Evidence:
- PR #49 merged
- merge commit `b2ecdb4e33bea642932092693d0ad5a8a47fd4e3`
- PR CI #320 / `35955216461`: success
- main CI + Pages #321 / `35955524890`: success
- PR CI #317 initially failed only the existing platform fail-closed source contract; implementation was corrected so observer constructors remain in the resolved document/window realm and `ObserverHub` retains an explicit fail-closed guard.
Outcome:
- `ObserverHub` delegates observer/media environment resolution to `EnvironmentPort` while retaining scheduling/statistics ownership.
- `EnvironmentPort` covers validated IntersectionObserver construction and no longer leaks observer constructors across resolved realms.
- `Diagnostics` is injectable and `Collection` can report duplicate stable keys without mutating data state.
- `Component` / `ComponentRuntime` carry normalized `ComponentProfile` metadata; adapters forward only explicitly authored profiles.
- no first-wave Picker business behavior was changed in Phase A.


### PHASE-A-002 — Shared Protocol authority integration
Status: DONE
Evidence:
- PR #48 merged
- merge commit `01875c583fe99c47ee249a4e9eeb6e86304f23f2`
- PR CI #315 / `35953604691`: success
- main CI + Pages #316 / `35953925660`: success on attempt 2
- attempt 1 failed only `tabs-indicator-measured` with an empty inline width while the identical code passed PR #315; retry of the identical main commit passed. Treat this as a recorded browser timing flake, not a framework semantic failure.
Outcome:
- `Collection` now uses `DataRevision` as stale-transaction revision authority.
- `ValueDraft` delegates controlled/external ownership and pending-request metadata to `ControllableStateCore`.
- `StateController.createValueBinding` exposes delegated ownership state without adding a second value truth.
- `verify:shared-protocol` covers Collection stale refs/reentrancy plus controlled proposal/external sync/uncontrolled transition behavior.
- ProjectionScheduler adoption was explicitly deferred because current DOM/Roving projection paths are synchronous and no competing async revision owner exists to replace.

### PHASE-A-001 — Baseline inventory + Shared Protocol foundation
Status: DONE
Evidence:
- PR #47 merged
- merge commit `51b7f317037fc538beaadc6f710da077a8429d0f`
- PR CI #312 / `35952642035`: success
- main CI + Pages #313 / `35952965100`: success
Outcome:
- existing authorities were mapped before adding Controller abstractions;
- added `ActionContext`, `OperationResult`, `ControllableStateCore`, `DataRevision`, `EnvironmentPort`, `ProjectionScheduler`, `Diagnostics`, `ComponentProfile`, `LogicalOwnerTree`, `InputModality` alias and Shared Protocol exports;
- no direct component migration was performed.

### OPS-001 — AI persistent state + repository documentation cleanup
Status: DONE
Evidence:
- PR #46 merged
- merge commit `a459e28f2486ce89615322c6e49094fddd8464a4`
- PR CI #307: success
- main CI + Pages #308: success
Outcome:
- added `AGENTS.md`, `AI_WORK_STATE.md`, and the complete master handbook;
- removed obsolete historical migration/stage/audit files;
- retained required HOTFIX6 compatibility artifacts only as `tools/fixtures/legacy-hotfix6/**`;
- removed numbered Stage navigation from canonical docs.

### CTRL-LEGACY-001 — Cascader controlled value
Status: DONE
Evidence:
- PR #36 merged
- merge commit `1ce69ad304088f0910993229426ba1a843b3d1fd`
- shared StateController option-value binding; controlled proposal/external sync and uncontrolled defaultValue coverage

### CTRL-LEGACY-002 — TagInput controlled value
Status: DONE
Evidence:
- PR #39 merged
- merge commit `6357bc0b88c72f2dd777641b942a97c48929a3d8`

### CTRL-LEGACY-003 — Collapse controlled value
Status: DONE
Evidence:
- PR #41 merged
- merge commit `20327c0d717a3a56a45e098d756e40eb9ae8c743`
Note:
- controlled ownership is done;
- rapid autosize animation reversal remains an active Motion issue.

### CTRL-LEGACY-004 — Dropdown controlled value
Status: DONE
Evidence:
- PR #43 merged
- merge commit `e2300ff0eb59fca8621218930fe6343f41c56309`

### CTRL-LEGACY-005 — Upload controlled file-list membership/order
Status: DONE
Evidence:
- PR #45 merged
- merge commit `a7702a2a66a2f201d1152c23c5d20ff1b1e9607e`
- UploadLifecycle remains runtime status/progress authority.

### FOCUS-LEGACY-001 — prior DatePicker/TimePanel focus cleanup
Status: VERIFIED_EXISTING, NOT SUFFICIENT FOR CURRENT QA
Evidence:
- PR #27 merged
- merge commit `6558fc5d1d008725a43a40fa869a0f9ba69cd367`
Rule:
- do not repeat the old investigation from zero;
- PHASE-C-001 superseded the remaining TimePanel owner defect; reopen only if a new reproducible regression appears.

## DO NOT REDO

Unless a current regression or architecture migration invalidates the evidence:

- Do not redo the original 17-component controlled/defaultValue survey from zero.
- Do not recreate the completed ESM/src-to-dist migration as a new migration project.
- Do not restore `src/modules`, runtime Registry dependency lookup or old monolithic source architecture.
- Do not recreate Shared Protocol primitives already landed in PHASE-A-001.
- Do not re-run PHASE-A-002 authority ownership analysis from zero; only inspect impact when PHASE-A-003 touches those authorities.
- Do not reintroduce numbered Stage documentation as a second canonical docs tree.
- Do not re-open completed controlled semantics merely because a new Controller is being introduced; migrate the existing contract and test it.
- Do not treat deleted historical audit/log files as active requirements. Git history is the archive.
- Do not convert the recorded #316 attempt-1 Tabs timing flake into a framework change unless it reproduces with evidence.

## PAUSED

None.

## BLOCKED

None.

## Frozen decisions

- One owner / one truth; projection is not a second writable truth.
- The 11 Controllers reuse/evolve existing mature authorities rather than duplicating them.
- Shared Protocol Layer is infrastructure, not a 12th business Controller.
- Controller code must not branch on component names.
- Interaction routing is scoped/logical-owner based, not one global keydown handler.
- Enter and Space are context/profile dependent; they are not globally equivalent.
- Multiple checkbox primary toggle uses Space within its composite keymap; navigation/activation semantics remain profile-scoped.
- Picker close is not an implicit commit. Escape/cancel rolls back uncommitted draft.
- Complex composite regions use one canonical real-focus host plus virtual focus unless a native/hybrid-edit profile explicitly leases real focus.
- Current Git source/tests/manifests are preserved while migrating; do not roll back later fixes to match an old document snapshot.

## Checkpoint maintenance rule

Keep this file compact and non-contradictory:
- `CURRENT` contains exactly one active/ready Task ID plus one exact next step.
- Current authority facts belong only in `Current authority snapshot`.
- When a gap is resolved, replace its old current-state wording; do not leave both “does not exist” and “added” statements in active sections.
- `DONE` retains Task ID + outcome + PR/commit/test/CI evidence, not the full historical investigation.
- Historical findings that are no longer current truth move to DONE evidence or Git/PR history.
- Never append a second CURRENT task at the bottom of the file.
