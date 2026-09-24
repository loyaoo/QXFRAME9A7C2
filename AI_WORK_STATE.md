# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. Reconcile this file before continuing if they differ.

## Repository checkpoint

- Last checkpoint date: 2026-09-24
- Repository: `loyaoo/QXFRAME9A7C2`
- Phase A kickoff main: `b54e8be325498b680df7059ee53929d40caf13b0`
- Last code-affecting main commit: `01875c583fe99c47ee249a4e9eeb6e86304f23f2` (PR #48 merge)
- Current branch: `main`
- Bootstrap PR: #46 merged
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`
- Latest green PR CI: run #315 / `35953604691` (PR #48)
- Latest green main CI + Pages: run #316 / `35953925660`, attempt 2, for merge `01875c583fe99c47ee249a4e9eeb6e86304f23f2`
- Controller migration implementation progress: 18% (PHASE-A-002 authority integration merged and fully green; next protocol adoption batch ready; no component files changed)

## CURRENT

### PHASE-A-001 — Baseline inventory and Shared Protocol foundation
Status: DONE

Merge / CI evidence:
- PR #47 merged to `main`;
- merge commit: `51b7f317037fc538beaadc6f710da077a8429d0f`;
- PR CI #312 / `35952642035`: success (Completion audit, Full release verification, npm pack, standalone docs demo, artifact upload);
- earlier PR CI #309/#310 exposed 3 source-side prototype-safety violations; the audit gate was not weakened and the source was corrected;
- main CI + Pages #313 / `35952965100`: success, including release artifact build/upload and Pages deployment.

Prerequisites:
- OPS-001 repository cleanup merged green in PR #46;
- master handbook is present and complete;
- AGENTS resume protocol is active;
- obsolete migration/stage/audit documents are removed from the active tree;
- legacy HOTFIX6 evidence still required by release gates lives only under `tools/fixtures/legacy-hotfix6/**`.

First work package:
1. read `AGENTS.md`, this checkpoint, and the master handbook;
2. re-query current main HEAD / open PRs / latest CI and reconcile this file if newer work exists;
3. execute handbook Phase A baseline inventory against current source;
4. map existing authorities before creating any new Controller;
5. freeze the initial owner/action/value/focus/overlay/form/token inventory;
6. only then begin Shared Protocol Layer implementation.

Primary first-wave components:
- DatePicker
- TimePicker / TimePanel
- ColorPicker
- Select
- TreeSelect
- Cascader
- Collapse (autosize Motion)

Frozen Phase A authority inventory:
- Action/event metadata: `InteractionDetails`, `OpenStateBridge`, logical events. Preserve them; add ActionContext/action IDs and structured OperationResult above them.
- Value ownership: `StateController -> ValueDraft` is the existing value authority used by the first-wave components. Preserve it; ControllableStateCore must evolve controlled/external ownership rather than duplicate committed value.
- Logical ownership: `LogicalOwnership` already owns parent/child logical nodes and bubbling. Preserve node authority; add a shared tree/registry facade for event/root resolution and descendant queries.
- Focus/navigation: `FocusManager`, `FocusScope`, `KeyboardNavigation`, `RovingProjection`, `ActiveItem` are existing authorities. Future FocusController must compose these, not replace them.
- Overlay/open: `OpenStateBridge`, `OverlayRuntime`, `LayerManager`, `DismissableLayer`, `PopupSurface` are existing authorities. OverlayController must not own public open state.
- Form: `FormBridge` is the native field/FormData/reset carrier authority. FormController will consume it; no second hidden-carrier implementation.
- Theme/token: `Config` owns root/scoped theme and token projection today. Theme/Token Controllers must evolve it; catalog enforcement is still missing.
- Selection/data: `Selection`, `HierarchicalSelection`, `Collection`, `ActiveItem`, `TableModel` own current selection/collection behavior. `Collection.mutationVersion` is local stale protection, but there is no shared DataRevision protocol yet.
- Projection/scheduling: `Scheduler` and `DOMProjection` are mature primitives, but there is no revision-aware ProjectionSnapshot/ProjectionScheduler stale gate yet.
- Motion: `MotionCore`, `Transition`, `TransitionGroup` remain the low-level motion authority; no second generation counter may be introduced.
- Environment: core/components still resolve `globalThis.document/window` ad hoc; no shared EnvironmentPort exists.
- Diagnostics: `PerformanceDiagnostics` covers resource balance only; semantic duplicate-owner/stale-action diagnostics are not yet implemented.
- Component capability declaration: `ComponentContracts` validates public options, but no `ComponentProfile` capability/ownership schema exists.

Completed in current code batch:
- added `ActionContext` + causal action IDs/source/reason/modality snapshots;
- added structured `OperationResult` statuses;
- added metadata-only `ControllableStateCore` ownership/revision/request lifecycle without duplicating committed value;
- added `DataRevision` stable-key revision refs;
- added `EnvironmentPort` with observer adapter validation;
- added revision-aware `ProjectionScheduler` over existing `Scheduler`;
- added stable-code semantic `Diagnostics`;
- added `ComponentProfile` schema;
- added `LogicalOwnerTree` facade over existing `LogicalOwnership`;
- evolved existing `InteractionModality` authority to expose touch/programmatic modalities and `InputModality` alias;
- added `SharedProtocol` aggregate exports and `verify:shared-protocol` gate.

Completed in current authority-integration batch:
- `Collection` now uses `DataRevision` as its stale-transaction revision authority; the private `mutationVersion` mirror is removed. Additive collection refs expose stable key + data revision without changing item/value behavior.
- `ValueDraft` no longer owns a separate `controlled` boolean; `ControllableStateCore` owns controlled/external-vs-internal and pending request metadata. `ValueDraft` remains the only committed/draft value owner.
- `StateController.createValueBinding` exposes the delegated ownership snapshot without adding value state.
- `verify:shared-protocol` now covers Collection stale refs/reentrancy plus controlled proposal/external-sync/uncontrolled transition behavior through ValueDraft and StateController.
- ProjectionScheduler integration was evaluated against current `DOMProjection` / `RovingProjection` / keyboard visual projection. Those authorities are synchronous and do not currently own a competing async revision counter; inserting ProjectionScheduler now would create parallel scheduling rather than replace an owner. Deferred until a Controller projection snapshot actually replaces an async/stale-prone path.

PR / CI evidence:
- PR #48 merged;
- merge commit: `01875c583fe99c47ee249a4e9eeb6e86304f23f2`;
- PR CI #315 / `35953604691`: success;
- main CI + Pages #316 / `35953925660`: success on attempt 2, including release + Pages.
- attempt 1 failed only `tabs-indicator-measured` with empty inline width while the same code passed PR #315; retry of the identical main commit passed all browser checks. Recorded as a browser timing flake; no framework/test gate was changed.

Next exact step:
- start PHASE-A-003 on a fresh branch from current main: adopt EnvironmentPort, Diagnostics, and ComponentProfile through existing core/runtime authorities before direct component migration. First inspect ObserverHub, Component/ComponentRuntime, and semantic diagnostics insertion points; replace existing environment/metadata paths where possible instead of adding parallel owners.

### PHASE-A-002 — Shared Protocol authority integration
Status: DONE

Merge / CI evidence:
- PR #48 merged;
- merge commit: `01875c583fe99c47ee249a4e9eeb6e86304f23f2`;
- PR CI #315 / `35953604691`: success;
- main CI + Pages #316 / `35953925660`: success on attempt 2; attempt 1 was the isolated Tabs indicator timing flake noted above.

Scope guard:
- completed branch: `refactor/phase-a-authority-integration-20260924`
- code batch commit: `f5b013cb5e8dc9f39e75d9ba91895b3a6feaf3d2`
- no direct picker/component migration yet;
- no second committed/controlled truth;
- do not change public controlled/uncontrolled semantics;
- prefer replacing private revision/ownership metadata with Shared Protocol authority rather than mirroring it;
- if ProjectionScheduler cannot replace an existing private projection revision safely in this batch, record it as deferred instead of adding parallel scheduling.

## ACTIVE KNOWN ISSUES — NOT DONE

These are real current QA targets for the Controller migration and must not be mistaken for already-completed work:

- Picker-family control/draft/preview display timing is inconsistent across DatePicker, TimePicker, ColorPicker and related popup fields.
- Escape must cancel uncommitted Picker draft; Enter/explicit Confirm must own confirmation where the profile defines it.
- TimePicker and ColorPicker still need consistent Enter confirmation behavior.
- TimePanel must have one canonical real-focus owner; internal columns must not become extra Tab stops.
- DatePicker dual-panel/month-year navigation can retain stale cursor state and jump on the first arrow after returning to the date region.
- DatePicker/TimePicker preset selection must respect `needConfirm`; preset regions need one Tab stop plus virtual arrow navigation.
- Collapse rapid open/close reversal still needs autosize Motion-level verification/fix rather than a component-local timer patch.

## DONE / VERIFIED EXISTING

### OPS-001 — AI persistent state + repository documentation cleanup
Status: DONE
Evidence:
- PR #46 merged
- merge commit `a459e28f2486ce89615322c6e49094fddd8464a4`
- PR CI run #307 succeeded
- main CI + GitHub Pages run #308 succeeded
- added `AGENTS.md`, `AI_WORK_STATE.md`, and the complete 2244-line master handbook
- removed 47 obsolete historical migration/stage/audit files
- retained four still-required HOTFIX6 compatibility artifacts only as test fixtures under `tools/fixtures/legacy-hotfix6/**`
- canonical docs navigation no longer links to numbered Stage pages

These items were completed before the Controller program. Do not repeat their original full audit just to rediscover them; only check migration impact when the new architecture touches them.

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
Note: controlled ownership is done; rapid autosize animation reversal remains an active Motion issue.

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
- upload lifecycle remains the runtime status/progress authority

### FOCUS-LEGACY-001 — prior DatePicker/TimePanel focus cleanup
Status: VERIFIED_EXISTING, NOT SUFFICIENT FOR CURRENT QA
Evidence:
- PR #27 merged
- merge commit `6558fc5d1d008725a43a40fa869a0f9ba69cd367`
Important:
- do not repeat the old investigation from scratch;
- current QA reports remaining extra/invisible TimePanel focus stops, so reopen only the specific remaining FocusController/region ownership defect.

### RELEASE-LEGACY-001 — Pages/release baseline
Status: VERIFIED_EXISTING
Evidence:
- main CI + Pages run #308 (`35949774749`) succeeded for cleanup merge `a459e28f2486ce89615322c6e49094fddd8464a4`.
- On resume, always query current GitHub Actions rather than assuming this run remains the latest.

## DO NOT REDO

Unless a current regression or architecture migration invalidates the evidence:

- Do not redo the original 17-component controlled/defaultValue survey from zero.
- Do not recreate the completed ESM/src-to-dist migration as a new migration project.
- Do not restore `src/modules`, runtime Registry dependency lookup or old monolithic source architecture.
- Do not reintroduce numbered Stage documentation as a second canonical docs tree.
- Do not re-open completed controlled semantics merely because a new Controller is being introduced; migrate the existing contract and test it.
- Do not treat deleted historical audit/log files as active requirements. Git history is the archive.

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

Keep this file compact:
- CURRENT may be detailed enough to resume without re-investigation.
- DONE retains Task ID + outcome + PR/commit/test evidence, not full historical prose.
- Move superseded investigation details to Git/PR history rather than growing this file indefinitely.


### PHASE-A-003 — Environment / Diagnostics / Profile authority adoption
Status: READY

Scope guard:
- no direct picker/component migration yet;
- EnvironmentPort should replace ad hoc environment constructor/global resolution inside an existing core authority, not create a second observer/scheduler owner;
- Diagnostics adoption must use stable codes and remain observational; it must not mutate business state;
- ComponentProfile adoption must attach capability metadata to existing Component/ComponentRuntime paths without runtime component-name dispatch;
- preserve static ESM and all existing public component behavior.
