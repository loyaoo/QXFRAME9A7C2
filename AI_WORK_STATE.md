# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. Reconcile this file before continuing if they differ.

## Repository checkpoint

- Last checkpoint date: 2026-09-24
- Repository: `loyaoo/QXFRAME9A7C2`
- Main baseline before bootstrap cleanup: `156453275a9c6073a0962bff74ba20d3283b922b`
- Current bootstrap branch: `chore/ai-state-doc-cleanup-20260924`
- Current PR: not created yet
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`
- Controller migration implementation progress: 0% (architecture/specification frozen; bootstrap repository hygiene in progress)

## CURRENT

### OPS-001 — AI persistent state + repository documentation cleanup
Status: IN_PROGRESS

Goal:
- install the master handbook in-repo;
- create durable AI resume/checkpoint rules;
- remove obsolete migration/stage/audit documents from the active work tree;
- retain any legacy evidence still required by automated gates as clearly named test fixtures rather than active migration documentation.

Completed in this branch:
- added the complete 2244-line master handbook;
- created this persistent work-state design checkpoint (this file);
- created `AGENTS.md` resume/checkpoint rules.

Still to do:
1. relocate required HOTFIX6 compatibility fixtures from `migration/**` into `tools/fixtures/legacy-hotfix6/**`;
2. update consumers in `package.json`, `tools/audit-final-completion.mjs` and `tools/verify-release-preflight.mjs`;
3. remove obsolete root development/hardening/migration documents after replacing active references;
4. remove historical `migration/**` logs/snapshots no longer needed after fixture relocation;
5. remove numbered `docs/stage-02.html` … `stage-09.html` and matching stage assets;
6. remove stale stage links from the current component docs shell;
7. remove unreferenced one-time docs audit/validation artifacts;
8. run PR CI; repair only real regressions;
9. merge and reconcile this checkpoint to the resulting main HEAD.

Next exact step:
- create the four required `tools/fixtures/legacy-hotfix6/**` files from the currently referenced HOTFIX6 baseline evidence, then retarget the verifier/audit scripts.

## NEXT

### PHASE-A-001 — Baseline inventory and Controller migration kickoff
Status: TODO
Dependency: OPS-001 merged green.

Start conditions:
- repository documentation cleanup merged;
- `AI_WORK_STATE.md` reconciled to current main;
- master handbook is the only Controller migration specification in the active tree.

First work package:
- execute handbook Phase A baseline inventory;
- map existing authorities before creating new Controllers;
- freeze initial owner/action/value/focus/overlay/form/token inventory;
- begin Shared Protocol Layer only after the inventory proves reuse boundaries.

Primary first-wave components from the handbook:
- DatePicker
- TimePicker / TimePanel
- ColorPicker
- Select
- TreeSelect
- Cascader
- Collapse (autosize Motion)

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
- main baseline includes successful release/Pages deployment after the controlled-value series.
- On resume, always query current GitHub Actions rather than assuming this historical run is still the latest.

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
