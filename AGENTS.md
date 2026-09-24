# AGENTS.md

This repository is maintained as a long-running AI-assisted framework project.

## Authority order

1. The checked-out Git repository, current branch, PR and CI are the factual state.
2. `AI_WORK_STATE.md` is the persistent cross-session checkpoint and progress ledger.
3. `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` is the sole target architecture and migration specification for the Controller/Shared-Protocol program.
4. Current source, manifests, tests and canonical docs define already-shipped behavior unless the master handbook explicitly changes it.
5. Chat history is never a substitute for the repository checkpoint.

Do not resurrect deleted historical plans, migration logs or stage documents from Git history unless a regression investigation specifically requires evidence from them.

## Resume protocol — mandatory on every start/continue

Before changing code:

1. Read this file.
2. Read `AI_WORK_STATE.md`.
3. Read the relevant section of the master handbook.
4. Inspect the real Git state: current branch, HEAD, working tree, open PR and CI relevant to the current task.
5. Reconcile any mismatch between Git/PR/CI and `AI_WORK_STATE.md`; Git/PR/CI wins, then update the state file.
6. Resume from `CURRENT -> Next exact step`.
7. Do not repeat work listed under `DONE` or `DO NOT REDO` unless a regression, changed dependency or explicit new architecture impact justifies reopening it.

## Persistent checkpoint rules

`AI_WORK_STATE.md` must be updated during work, not only at the end.

Checkpoint before/after:
- starting a new stable Task ID;
- finishing a meaningful code-edit batch;
- starting a long build/browser/CI run;
- creating or updating a PR;
- receiving CI results;
- merging;
- pausing/blocking a task;
- ending a response or approaching context/time limits.

A checkpoint records facts, not duplicated design prose: Task ID, state, files, exact next step, branch/PR/commit/test/CI evidence, blockers and frozen decisions.

## Implementation rules

- Audit existing authority before introducing a Controller or protocol primitive.
- One owner / one truth. A migration is incomplete while an old writable authority remains.
- Controller differences use profiles/adapters/ports, never component-name switches.
- Keep static ESM boundaries and existing canonical build/release ownership.
- Every behavior fix gets a regression test at the correct layer; browser-visible interaction defects require browser coverage.
- Do not weaken a gate or rewrite the specification merely to make CI pass.
- Use branch -> PR -> CI -> merge for implementation work.
- Final release evidence comes from GitHub Actions. Local checks are supplementary.
- Preserve current correct fixes while migrating; do not reset code to an older handbook baseline.

## Canonical docs

The maintained user-facing demo surfaces are:
- `docs/components/*.html`
- `docs/admin-dashboard-static.html`
- `docs/admin-form-static.html`
- `docs/admin-list-static.html`
- `docs/index.html`
- `docs/theme-playground.html`
- `docs/tokens.html`
- `docs/all-components-static.html`

Do not create numbered stage demos as an alternate documentation system.

## Reporting

Each substantial work cycle records and reports:
- overall program progress;
- current phase/task;
- completed changes;
- remaining work/blockers;
- tests and CI;
- PR/merge evidence;
- next exact step.
