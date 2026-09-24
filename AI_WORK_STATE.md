# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-09-24
- Repository: `loyaoo/QXFRAME9A7C2`
- Current repository HEAD: `f8f5047d76f8d9978284d3cb62508e9188c20051`
- Last code-affecting main commit: `01875c583fe99c47ee249a4e9eeb6e86304f23f2` (PR #48 merge)
- Current branch: `main`
- Open PRs at this checkpoint: none
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`
- Latest green Controller PR CI: #315 / `35953604691` (PR #48)
- Latest green main CI + Pages: #316 / `35953925660`, attempt 2
- Controller migration implementation progress: 18%
- Current Phase: Phase A
- Current Task: `PHASE-A-003`

## CURRENT

### PHASE-A-003 — EnvironmentPort / Diagnostics / ComponentProfile authority adoption
Status: READY
Task progress: 0%

Why this is current:
- `PHASE-A-001` baseline inventory + Shared Protocol foundation is complete.
- `PHASE-A-002` Shared Protocol authority integration is complete and green on PR + main.
- Shared Protocol primitives now exist; the next work is adoption into existing authorities, not recreating those primitives and not starting direct picker-family migration yet.

Scope:
- adopt `EnvironmentPort` into existing environment/document/window/observer authority paths where it replaces ad-hoc access without changing public behavior;
- adopt `Diagnostics` into existing duplicate-owner/stale-action/authority-conflict observation paths where a real owner already exists;
- adopt `ComponentProfile` into existing component/family capability declarations without creating a second option/schema truth;
- preserve current `ValueDraft`, `LogicalOwnership`, focus/navigation, overlay, form, theme/token, selection/data and Motion authorities;
- do not add component-name dispatch;
- do not introduce direct DatePicker/TimePicker/ColorPicker behavior changes in this task unless an authority adoption requires a minimal compatibility fix.

Next exact step:
1. re-query current main / open PRs / CI;
2. create a fresh implementation branch from current main;
3. inspect actual consumers of `EnvironmentPort`, `Diagnostics` and `ComponentProfile`;
4. select the smallest authority-adoption slice that removes an ad-hoc path instead of adding a parallel path;
5. checkpoint this file before modifying the selected authorities.

## Current authority snapshot — after PHASE-A-002

This section is current-state truth. Do not treat earlier Phase A gap findings as still active if they conflict with this snapshot.

- Action/event metadata: `ActionContext` and structured `OperationResult` exist above existing `InteractionDetails`, `OpenStateBridge` and logical events.
- Value ownership: `StateController -> ValueDraft` remains the committed/draft value authority. `ControllableStateCore` owns controlled/external-vs-internal and pending-request metadata within that path; there is no second committed value.
- Logical ownership: `LogicalOwnership` remains node/parent-child authority; `LogicalOwnerTree` exists as the shared facade/registry layer.
- Focus/navigation: `FocusManager`, `FocusScope`, `KeyboardNavigation`, `RovingProjection` and `ActiveItem` remain the existing authorities. FocusController migration has not started.
- Overlay/open: `OpenStateBridge`, `OverlayRuntime`, `LayerManager`, `DismissableLayer` and `PopupSurface` remain the existing authorities. OverlayController must not become a second public open-state owner.
- Form: `FormBridge` remains native field/FormData/reset carrier authority.
- Theme/token: `Config` remains root/scoped theme and token projection authority; Theme/Token Controller adoption is pending.
- Selection/data: `Selection`, `HierarchicalSelection`, `Collection`, `ActiveItem` and `TableModel` remain selection/collection authorities. `Collection` now uses shared `DataRevision` for stale-transaction revision ownership.
- Projection/scheduling: shared `ProjectionScheduler` exists over `Scheduler`, but it is intentionally not inserted into synchronous `DOMProjection` / `RovingProjection` paths until it can replace a real stale/async projection owner.
- Motion: `MotionCore`, `Transition` and `TransitionGroup` remain the low-level motion authority; no parallel generation counter may be introduced.
- Environment: shared `EnvironmentPort` exists and validates observer adapters. Adoption into remaining ad-hoc `globalThis.document/window` consumers is pending.
- Diagnostics: semantic `Diagnostics` with stable codes exists. Broader adoption into existing authority conflict/stale-owner paths is pending.
- Component capability declaration: `ComponentProfile` schema exists. Adoption into existing component/family capability declarations is pending.
- Input modality: existing `InteractionModality` remains the authority and now exposes touch/programmatic modalities plus the `InputModality` alias.
- Shared Protocol verification: `verify:shared-protocol` covers the foundation plus Collection/ValueDraft/StateController integration.

## ACTIVE KNOWN ISSUES — NOT DONE

These are current QA targets for later Controller/family migration. They are not PHASE-A-003 scope unless an authority adoption directly touches them.

- Picker-family control/draft/preview display timing is inconsistent across DatePicker, TimePicker, ColorPicker and related popup fields.
- Escape must cancel uncommitted Picker draft; Enter/explicit Confirm must own confirmation where the profile defines it.
- TimePicker and ColorPicker still need consistent Enter confirmation behavior.
- TimePanel must have one canonical real-focus owner; internal columns must not become extra Tab stops.
- DatePicker dual-panel/month-year navigation can retain stale cursor state and jump on the first arrow after returning to the date region.
- DatePicker/TimePicker preset selection must respect `needConfirm`; preset regions need one Tab stop plus virtual arrow navigation.
- Collapse rapid open/close reversal still needs autosize Motion-level verification/fix rather than a component-local timer patch.

## DONE / VERIFIED EXISTING

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
- current QA reports remaining TimePanel focus defects, so reopen only the specific remaining FocusController/region ownership issue.

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
