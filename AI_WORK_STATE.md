# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-09-25
- Repository: `loyaoo/QXFRAME9A7C2`
- Repository HEAD: always query Git on resume; do not cache a self-invalidating HEAD in this file
- Last code-affecting main commit: `fccf929b03170b9e6eff1331274b7a81b5dfebfb` (PR #84 merge)
- Current branch: `refactor/phase-h-trigger-controller-family-20260925`
- Open PRs at this checkpoint: pending PHASE-H-005 Trigger controller-family PR
- Branch inventory at this checkpoint: `main` + merged Phase H task branches + current H-005 branch; prune merged task branches after Phase H signoff
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` (historical filename retained; body defines 9 Runtime Controllers + pure CSS Theme/Token)
- Latest green Phase H PR CI: #432 / `36072251524` (PR #84)
- Latest green main CI + Pages: #433 / `36072642871`
- Overall handbook implementation progress: 96%
- Current Phase: Phase H — full component migration + old-path removal
- Current Task: `PHASE-H-005`

## CURRENT

### PHASE-H-005 — Trigger F/I/C/M/O controller-family migration
Status: IN_PROGRESS
Task progress: 80%

Completed prerequisite:
- PHASE-H-004 is DONE through PR #84, exact-head CI #432 / `36072251524`, merge `fccf929b03170b9e6eff1331274b7a81b5dfebfb`, main release + Pages #433 / `36072642871`.
- FieldComponent internal Form path is H-migrated. Autocomplete, Cascader, ColorPicker, DatePicker, Select, TreeSelect, TimePicker, WheelPicker, Tags and Transfer now inherit the canonical FormController binding path without a second value/native-carrier owner.

Implemented in current pack:
- Trigger now declares the exact handbook Focus/Interaction/Capability/Motion/Overlay profile and canonical ownership.
- Trigger owns one shared CapabilityController for open/activation policy and one shared InteractionController for semantic keyboard actions.
- TriggerInteraction forwards those shared controllers into PressInteraction instead of allowing PressInteraction to build a parallel semantic/capability authority.
- PressInteraction keyboard Enter/Space semantics now register/dispatch through InteractionController; pointer/visual execution remains PressInteraction authority.
- OverlayRuntime creates/normalizes focus manager/scope resources through FocusController instead of importing FocusManager/FocusScope directly.
- existing Trigger presence remains Transition→MotionController and popup resources remain OverlayController→OverlayRuntime; logical open remains OpenStateBridge.
- removed an unused OverlayController singleton facade that had no consumer in this pack.
- `verify:phase-h-trigger-controller-family` freezes the five-controller profile, shared-controller routing and no-direct-focus-import constraints.
- strict source-ESM Chromium verifies controller access, Enter activation through InteractionController and disabled open blocking through CapabilityController.
- Phase H profile regression floor rises to 18.

Next exact step:
1. perform final diff/self-audit and open PHASE-H-005 PR.
2. require exact-head full release/browser/package CI.
3. merge only green and verify main + Pages.
4. mark Trigger H accepted.
5. immediately batch the next shared popup/overlay family that reuses Trigger instead of one-component PRs.

## Current authority snapshot — after Phase A

This section is current-state truth. Do not treat earlier Phase A gap findings as still active if they conflict with this snapshot.

- Action/event metadata: `ActionContext` and structured `OperationResult` exist above existing `InteractionDetails`, `OpenStateBridge` and logical events.
- Value ownership: `ValueController` is the canonical committed/draft/preview/rawInput/session/revision authority. `ValueDraft` is a compatibility alias and `StateController.create()` delegates to it; `ControllableStateCore` still owns controlled/external-vs-internal and pending-request metadata. DatePicker / TimePicker / ColorPicker / WheelPicker declare ValueController ownership directly. There is no second committed value.
- Logical ownership: `LogicalOwnership` remains node/parent-child authority; `LogicalOwnerTree` exists as the shared facade/registry layer.
- Focus/navigation: `FocusController` is the aggregate entry point over `FocusManager`, `FocusScope`, `KeyboardRegion` and `KeyboardNavigation` virtual focus. WheelPanel / TimePanel / Calendar / PeriodPanel / Select / TreeSelect / Cascader / Menu / Tags / Table enter through it. Underlying ActiveItem/RovingProjection/domain state remains the execution truth. Handbook Phase C Focus scope is accepted.
- Interaction/capability: `InteractionController` is the semantic key/action + logical scope routing entry and `KeyboardNavigation` consumes its resolver; `CapabilityController` is the component-facing entry over `InteractionPolicy`. Handbook Phase C priority owners are accepted through PR #56 and #58–#61, including Date/Time composites, Menu, Select, TreeSelect, Cascader, Tags and Table.
- Overlay/open: `OverlayController` is now the resource facade over existing `OverlayRuntime` / `LayerManager` / `DismissableLayer` execution authorities; `OpenStateBridge` remains logical open authority. Trigger is the first representative consumer. OverlayController must not become a second public open-state owner.
- Form: `FormBridge` remains native field/FormData/reset carrier authority. `FormController` is now the accepted Phase G field/form transaction coordinator above it; Phase H direct field consumers still need migration without duplicating carrier/value ownership.
- Theme/token: Phase F is accepted. CSS is the sole visual authority; ComponentProfile exposes exactly 9 Runtime Controllers and no theme/tokens runtime capabilities. CI recursively rejects ThemeController/TokenController/ThemeRuntime/TokenRuntime and JS projection/reading of the canonical CSS theme selector.
- Selection/data: `SelectionController` is the accepted Phase D facade over canonical Selection/HierarchicalSelection execution stores. ItemCollection/List/OptionList/Tree, Transfer, Table, Tags, Select/TreeSelect/Cascader enter through it; Table remote allMatching is semantic rather than materialized page keys. `ActiveItem`/component navigation remains activeKey authority and public value remains ValueController-owned where applicable.
- Projection/scheduling: shared `ProjectionScheduler` exists over `Scheduler`, but it is intentionally not inserted into synchronous `DOMProjection` / `RovingProjection` paths until it can replace a real stale/async projection owner.
- Motion: `MotionController` is the accepted intent facade over canonical `MotionCore`; `Transition` and `TransitionGroup` enter through it while MotionCore remains generation/timing/style authority. Collapse rapid reversal is fixed by stable DOM projection before motion, with no parallel generation or component timer.
- Environment: `ObserverHub` now delegates Resize/Mutation/Intersection/media environment resolution to shared `EnvironmentPort`; additional ad-hoc environment consumers migrate only when their owning Controller/family is touched.
- Diagnostics: semantic `Diagnostics` with stable codes is injectable; `Collection` reports duplicate stable keys observationally when a sink is supplied. Further diagnostics adoption occurs with the owning Controller.
- Component capability declaration: `Component` and `ComponentRuntime` now carry validated immutable `ComponentProfile` metadata; concrete profiles are authored as each family migrates, with no runtime component-name inference.
- Input modality: existing `InteractionModality` remains the authority and now exposes touch/programmatic modalities plus the `InputModality` alias.
- Shared Protocol verification: `verify:shared-protocol` covers the foundation plus Collection/ValueDraft/StateController integration.

## ACTIVE KNOWN ISSUES — NOT DONE

These are current QA targets for later Controller/family migration. They are not PHASE-A-003 scope unless an authority adoption directly touches them.

- DatePicker/TimePicker preset selection must respect `needConfirm`; PR #56 adds the DatePicker preset single-Tab-stop/virtual-arrow focus region, while needConfirm/value-commit semantics and TimePicker parity still require Phase C verification.

## DONE / VERIFIED EXISTING

### PHASE-H-004 — FieldComponent → FormController shared binding
Status: DONE
Evidence:
- PR #84 merged
- merge commit `fccf929b03170b9e6eff1331274b7a81b5dfebfb`
- exact-head CI #432 / `36072251524`: success
- main CI + Pages #433 / `36072642871`: success
Outcome:
- FieldComponent owns the shared FormController registration/notification bridge while FormBridge remains native carrier and ValueController remains value/reset-baseline owner.
- duplicate-name registration, rename re-indexing, validation, touched, serialization and destroy cleanup are gated.
- real Chromium Rate consumer verifies bind → dirty/serialize → destroy unregister.
- ten R-capable public components declare FormController ownership through the inherited FieldComponent path; their remaining Phase H controllers still require final component signoff.
- FieldComponent internal Form path is H-migrated.



### PHASE-H-003 — Progress + Result + Loading feedback presenters
Status: DONE
Evidence:
- PR #83 merged
- merge commit `a7eb78ca9db866acd0bc60f470b241bfe7858bce`
- exact-head CI #430 / `36071355296`: success
- main CI + Pages #431 / `36071805997`: success
Outcome:
- FeedbackController gained generic local/form/global projector binding without new state ownership.
- Progress is H accepted for Feedback-only presentation projection.
- Result is H accepted for Feedback-only result projection.
- Loading is H accepted for Capability/Motion/Overlay/Feedback; open enters CapabilityController while existing Motion/Overlay authorities remain canonical.
- strict source-ESM Chromium covers pending/progress/terminal/clear presenter behavior.



### PHASE-H-002 — NoticeService + Message/Notification M/O/B migration
Status: DONE
Evidence:
- PR #82 merged
- merge commit `deede43a127e525458c1b3163b24c048881c56dc`
- exact-head CI #427 / `36029897206`: success
- main CI + Pages #428 / `36070432617`: success
Outcome:
- NoticeService no longer accesses LayerManager directly; notice layer resource ownership enters OverlayController through `createLayerLease()`.
- NoticeService/NoticeClock remain notice lifecycle/timing authorities and TransitionGroup→MotionController remains presence authority.
- Message and Notification declare exact handbook Motion/Overlay/Feedback profiles.
- operation/task-linked global feedback uses FeedbackController identity de-dup while raw Message/Notification APIs remain compatible.
- Message and Notification are H accepted; NoticeService internal overlay path is H-migrated.



### PHASE-H-001 — executable 40-component target matrix
Status: DONE
Evidence:
- PR #81 merged
- merge commit `4c901ed23be08b71e8c938d346f2730060b6d766`
- exact-head CI #423 / `36028486399`: success
- main CI + Pages #424 / `36028914790`: success
Outcome:
- handbook target Runtime Controller combinations for all 40 public components are machine-readable.
- the matrix exactly matches the public Components namespace and rejects out-of-target capabilities/controller owners.
- internal/base migration targets are explicitly ledgered.
- current missing profile/ownership coverage is reportable without falsely claiming Phase H completion.



### PHASE-G-001 — FeedbackController + FormController foundations
Status: DONE
Evidence:
- PR #80 merged
- merge commit `e99cf3aa376277cf4d040c69f51b8c6916869ebe`
- exact-head CI #421 / `36025556499`: success
- main CI + Pages #422 / `36026105260`: success
Outcome:
- FeedbackController is the operation/task visible-feedback facade; NoticeService/NoticeClock remain global notice/timing execution authorities.
- feedback identity de-dup is owner + operation + actionId/requestId, with stale generation rejection and identity-preserving updates.
- FormController owns field registry + dirty/touched/pending/valid + validation/submit/reset coordination without copying the ValueController reset baseline or FormBridge native carrier.
- fieldId is unique identity and duplicate names serialize independently.
- async validator and submit completions are stale-safe; reset cancels pending submit/validation work.
- external controlled reset remains requested until owner acknowledgement.
- native submit/reset/FormData/reset-cancellation behavior is verified in Chromium.

### Phase G — Feedback + Form
Status: ACCEPTED
Evidence:
- PR #80 / exact-head #421 / main + Pages #422
- `verify:phase-g-foundation` + strict source-ESM browser gates
Outcome:
- all handbook Phase G gates are covered.
- Phase G acceptance does not claim Phase H/I completion.



### PHASE-F-008 — runtime profile Theme/Token residue closeout
Status: DONE
Evidence:
- PR #78 merged
- merge commit `e7903d9ff08ecde8bdb000da64b6a77ceea837f1`
- exact-head CI #408 / `36021985007`: success
- main CI + Pages #409 / `36022470128`: success
Outcome:
- removed `theme` / `tokens` from ComponentProfile runtime capabilities.
- removed ThemeController / TokenController from ComponentProfile legal controllers; the runtime controller list is exactly 9.
- `verify:phase-f-css-authority` now recursively scans all `src/**/*.js` and rejects ThemeController/TokenController/ThemeRuntime/TokenRuntime plus JS use of canonical CSS theme selectors.
- Shared Protocol gates reject theme/tokens profile fields and theme runtime dependencies.
- no CSS or component visual implementation changed.

### PHASE-F — CSS Theme / Token System Unification
Status: ACCEPTED
Evidence:
- implementation/closeout PRs #70–#76 and #78; #77 was intentionally closed unmerged after discovering F-008.
- exact-head CI #392 / #395 / #397 / #399 / #401 / #403 / #405 / #408: success
- corresponding main release + Pages #393 / #396 / #398 / #400 / #402 / #404 / #406 / #409: success
Outcome:
- one canonical CSS Theme/Token authority and one final self-contained `dist/qxframe9a7c2.css`.
- no ThemeController / TokenController / ThemeRuntime / TokenRuntime and no ComponentProfile theme/token runtime capability.
- primitive → semantic → family → component → state graph, Light/Dark/scoped theme, semantic overlay/shadow channels and state cascade are required gates.
- token graph/cycle/reference/color-channel/specificity/duplicate-owner audits are required CI.
- static no-framework-JS state matrix, scoped portal inheritance, and theme/business-state separation are required CI.
- Phase F acceptance does not claim Phase G–I completion.

### PHASE-F-007 — static CSS / scoped-theme closeout
Status: DONE
Evidence:
- PR #76 merged
- merge commit `b764a1a378cf8fc2dde8edc83dc6c0bc4155b3d8`
- exact-head CI #405 / `36019147203`: success
- main CI + Pages #406 / `36019711807`: success
Outcome:
- `verify:phase-f-static-closeout` requires final dist CSS with no framework runtime JS on the all-components static state matrix.
- representative visual states remain authored directly in static HTML; docs helpers do not synthesize component state.
- CSS-only browser coverage proves scoped popup/portal theme inheritance.
- value/class/open/selected-key/real-focus remain invariant across theme changes.
- no production component CSS or runtime JS changed in the closeout pack.

### PHASE-F-006 — duplicate CSS owner / dead-rule cleanup
Status: DONE
Evidence:
- PR #75 merged
- merge commit `108fa1d67d6a129c13f7f9397e11968867a05adb`
- exact-head CI #403 / `36017571445`: success
- main CI + Pages #404 / `36018227817`: success
Outcome:
- retired duplicate early Control Contract secondary/danger accent owners while keeping the shared Color Variant contract canonical.
- removed dead Notice passive-scrollbar rules in favor of the canonical hidden-scrollbar Notice viewport.
- folded ItemCollection/List item gaps and SelectGroup image-grid width into their canonical owner rules.
- removed the unreachable second Image Preview hidden-state patch.
- preserved intentional staged Button paint-z, Image Preview motion and JSON refinement rules.
- required `verify:phase-f-duplicate-owners` prevents the retired owners from returning.

### PHASE-F-005 — repeated compound selector specificity normalization
Status: DONE
Evidence:
- PR #74 merged
- merge commit `885b5202e69a8b43fe6d82bdbac8839c28aff957`
- exact-head CI #401 / `36016034020`: success
- main CI + Pages #402 / `36016716760`: success
Outcome:
- four Table expand-trigger selector chains were normalized so one compound no longer repeats the same state atom.
- declarations and rule order were preserved.
- required `verify:phase-f-selector-specificity` performs compound-aware duplicate-state detection and does not flag legitimate state constraints on separate relationship compounds.

### PHASE-F-004 — state cascade / specificity ownership closeout
Status: DONE
Evidence:
- PR #73 merged
- merge commit `cd53968dee909f551bfc1b8ac3ab9d235580d066`
- exact-head CI #399 / `36014584198`: success
- main CI + Pages #400 / `36015116050`: success
Outcome:
- the late `unlayered overrides (kept last to preserve original cascade strength)` patch bucket is removed.
- Picker/TimePicker and Table filter rules now live with their canonical component owners.
- InputGroup stacking resolves through its existing private state channel instead of a duplicate late z-index patch.
- Card overflow/corner ownership is consolidated in the Card section while the unified keyboard focus/modality contract remains unchanged.
- required `verify:phase-f-state-cascade` prevents late cascade-patch recovery and owner drift.

### PHASE-F-003 — semantic overlay / shadow color-channel closeout
Status: DONE
Evidence:
- PR #72 merged
- merge commit `c5f5eb654c20c62b97f32ba0d2f88ba9303ab8d4`
- exact-head CI #397 / `36012650779`: success
- main CI + Pages #398 / `36013188043`: success
Outcome:
- all post-foundation component/family physical black/white palette consumers were routed through existing semantic overlay-base/overlay-text channels.
- original alpha and shadow geometry were preserved; ColorPanel HSV/Hue and ColorPicker contrast-stop colors remain classified functional color-model data.
- required `verify:phase-f-color-channels` forbids new post-foundation physical palette consumption and unexpected component hard-coded colors.

### PHASE-F-002 — canonical CSS token graph closeout
Status: DONE
Evidence:
- PR #71 merged
- merge commit `85921cfc12e7af95a1b8f64cf54b4dbf6c50056d`
- exact-head CI #395 / `36011237135`: success
- main CI + Pages #396 / `36011730662`: success
Outcome:
- three real static unresolved references were redirected to existing canonical control/font owners.
- four JS-owned dynamic CSS variables remain intentionally instance-scoped and are verified against their JS projection owners.
- the sole custom-property dependency cycle (Scroll edge shadow self-fallback) is removed.
- duplicate Light/Dark selector members are removed while the symmetric 93-variable mode contract remains unchanged.
- required `verify:phase-f-token-graph` enforces acyclic token dependencies, unresolved-input classification, Light/Dark symmetry, white/black baseline and output-only compatibility aliases.

### PHASE-F-001 — CSS authority + JS Theme/Token decoupling
Status: DONE
Evidence:
- PR #70 merged
- merge commit `7c9e9455d7102dc0ba945bb5ab29ea28a5ab827d`
- exact-head CI #392 / `36009735693`: success
- main CI + Pages #393 / `36010087461`: success
Outcome:
- Core.Config no longer owns or projects Theme/Token state; runtime behavior configuration remains.
- OverlayRuntime no longer copies theme/token CSS context; Menu runtime theme scopes/options are removed with an explicit migration record.
- ColorPicker behavioral defaults no longer read CSS token state.
- `src/qxframe9a7c2.css` is the one physical production CSS authority and the stale split `src/css/00...10.css` mirror is removed.
- immutable HOTFIX6 API baseline remains untouched; completion audit permits only manifest-authorized `Menu.theme` removal.
- required CSS-only Chromium gate proves Light white / Dark black / scoped theme resolution without framework JS.

### PHASE-E-005 — Motion closeout
Status: DONE
Evidence:
- PR #69 merged
- merge commit `b4b1f506d4f14db8f1bd521c9ca4611515a19e5b`
- PR CI #385 / `36005279398`: success
- main CI + Pages #386 / `36005795095`: success
Outcome:
- Collapse rapid close/reopen no longer resets native autosize transition by re-appending the live section after motion starts.
- TransitionGroup enters child/move motion through MotionController; MotionCore remains canonical generation/timing authority.
- Chromium gate verifies live intermediate height, repeated rapid toggles, stable DOM order and final settle.
- no component-local timer or duplicate motion truth was added.

### PHASE-E — Overlay + Motion scope
Status: DONE
Evidence:
- PR #65 / #66 / #67 / #68 / #69 merged
- exact-head CI #374 / #376 / #378 / #380 / #385: success
- merged main CI + Pages #375 / #377 / #379 / #381 / #386: success
Outcome:
- OverlayController is the physical resource facade while OpenStateBridge/family adapters retain logical open.
- Trigger/Popup bases, Modal/Drawer, Image Preview, Loading and Upload preview use the canonical overlay resource path.
- MotionController fronts MotionCore through Transition and TransitionGroup without a second generation truth.
- nested/reopen/leave lease, rapid reverse and autosize Collapse regressions are covered.
- Phase E is accepted; current work advances to pure-CSS Phase F.

### PHASE-E-004 — Remaining direct OverlayRuntime consumers
Status: DONE
Evidence:
- PR #68 merged
- merge commit `30034b15d1d19acff0c3ff5cef44981568074ffd`
- PR CI #380 / `35996521940`: success
- main CI + Pages #381 / `35997097751`: success
Outcome:
- Image Preview, Loading and Upload document preview enter physical overlay resources through OverlayController.
- raw OverlayRuntime getters remain compatibility views of controller.getRuntime().
- Image and Loading expose their existing MotionController channels; Upload media preview delegates Image and document preview invents no synthetic motion owner.
- dedicated Chromium coverage verifies resource identity, leave lifetime and cleanup.
- remaining Phase E blocker is motion closeout, not component OverlayRuntime construction.

### PHASE-E-003 — Modal/Drawer physical Overlay + multi-motion migration
Status: DONE
Evidence:
- PR #67 merged
- merge commit `7a03e956ed227170418906614294d27964286a33`
- PR CI #378 / `35995208862`: success
- main CI + Pages #379 / `35995590673`: success
Outcome:
- Modal/Drawer no longer import or create OverlayRuntime directly; physical resources enter through OverlayController.
- logical family open/close state remains separate from physical overlay state.
- raw OverlayRuntime callback/getter compatibility is preserved through the controller facade.
- mask + dialog/panel transitions remain distinct MotionController-backed visual channels.
- Chromium verifies leave resource lifetime, rapid close→reopen stale-completion safety and final lease release.
- required `verify:phase-e-modal-drawer` passed.

### PHASE-E-002 — Popup facade propagation + overlay naming closeout
Status: DONE
Evidence:
- PR #66 merged
- merge commit `a3a8bb87c538741568266d38ee68a540edab99a2`
- PR CI #376 / `35994260669`: success
- main CI + Pages #377 / `35994605514`: success
Outcome:
- PopupComponent and PopupFieldComponent forward the exact Trigger OverlayController/MotionController identities.
- Popover/Tooltip/Dropdown/Select browser conformance proves facade identity without duplicate open/value state.
- OverlayComponent explicitly separates its Modal/Drawer family logical adapter from the physical resource-controller accessor.
- legacy OverlayComponent accessor names remain compatibility aliases while internal Modal/Drawer code uses explicit family naming.
- required `verify:phase-e-popup-facades` passed.

### PHASE-E-001 — OverlayController + MotionController foundations
Status: DONE
Evidence:
- PR #65 merged
- merge commit `a7b6d55ba1fe755adb9409d045e67f12f211ac54`
- PR CI #374 / `35992315155`: success
- main CI + Pages #375 / `35992675173`: success
Outcome:
- OverlayController delegates to OverlayRuntime and owns no logical-open truth.
- MotionController delegates to MotionCore and creates no second generation authority.
- MotionCore exposes canonical generation plus bounded cancel through its existing completion path.
- Transition is the compatibility facade over MotionController.
- Trigger enters overlay resources through OverlayController while logical open remains OpenStateBridge-owned.
- sandbox Chromium verified rapid reverse/cancel and Open/Overlay/Motion three-state resource lifetime.
- required `verify:phase-e-foundation` plus full release gates passed.

### PHASE-D-005 — Select/TreeSelect/Cascader selection closeout
Status: DONE
Evidence:
- PR #64 merged
- merge commit `eef0048a5f2c88f1a0e9fcf1de23eb8a064d7c4a`
- PR CI #371 / `35986798091`: success
- main CI + Pages #372 / `35990367837`: success
Outcome:
- Select exposes/reuses OptionList SelectionController identity without a second selected store.
- TreeSelect exposes/reuses Tree selected/checked channels from the same SelectionController.
- Cascader direct Selection/HierarchicalSelection/component-local anchor ownership is replaced by one SelectionController facade.
- Cascader item replacement/lazy child data changes advance selection data revision and stale anchors invalidate.
- ValueController and Phase C focus/interaction/capability authorities remain unchanged.
- required `verify:phase-d-popup-selection` covers source ownership and Chromium identity/revision behavior.

### PHASE-D — Selection scope
Status: DONE
Evidence:
- PR #55 / #57 / #62 / #63 / #64 merged
- exact-head CI #341 / #344 / #366 / #368 / #371: success
- main CI + Pages #342 / #345 / #367 / #369 / #372: success
Outcome:
- handbook Phase D scope (OptionList/List/Tree, Transfer, Table, Tags, Select/TreeSelect/Cascader) is accepted.
- multi-channel selection, stable keys, DataRevision-bound anchors, remote allMatching/exclusions, lazy-data revision and no-duplicate-selection-truth constraints are covered.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` records D accepted only for public Phase D consumers; later E–I signoff remains pending.
- Phase D acceptance does not imply overall migration completion; current work advances to Phase E.

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
- Phase C acceptance does not imply overall 9-Runtime-Controller completion; current work resumes at Phase D.

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
- The 9 Runtime Controllers reuse/evolve existing mature authorities rather than duplicating them.
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
