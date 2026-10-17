# CSS-READABILITY-TOKEN-CONSOLIDATION-001 — active execution checkpoint

> Current task pointer (2026-10-17). Source of execution requirements: owner-provided `QXFRAME9A7C2-CSS-SolHigh-Execution-Package-2026-10-17`, documents 01–10. This is a checkpoint, **not** a declaration that any CSS transformation or browser test has passed.

## Authority and isolation

- Golden baseline commit: `62d9a8402c19460ced37265acc6d110ae2cfda76`
- Golden baseline tree: `a96bb959a69f15ce27d1c78182c273d422a531e9`
- Read-only branch: `baseline/post-main-cleanup-css-readable-62d9a840` (must never advance).
- Active branch: `refactor/css-readable-token-chain-postcleanup-20261017`.
- Draft PR base: read-only baseline; never merge without owner approval.
- Previous Stage5 PR #267 already merged; STAGE5-POSTMERGE-ACCEPTANCE-001 remains separately **not user signed off**.
- Current task authorization supersedes previous stage-specific development-branch instructions in `AGENTS.md`. Main, baseline and backup refs, production Theme, Theme registry/compiler/config, built-in defaults, business Controller/DOM and existing correct visual behavior remain frozen.

## Initial facts (GitHub API, 2026-10-17)

- Main is the exact baseline above. Most recently verified QXFRAME CI push run: `39004174949` success for that commit; this does **not** prove both required workflows have passed.
- Prior PR #267 closed/merged; no other open PR was found at start.
- Both existing workflows restrict `pull_request.branches` to `main`, incompatible with this task's baseline-base Draft PR. Change only PR trigger targets on this branch, retain deployment guards. JS parity in QXFRAME CI currently checks out moving `main`; this must be anchored to immutable B0 for the refactor comparison.
- No runtime baseline artifact, Chromium comparison or negative test is yet verified.

## Work package ledger

- R0-01: completed (read-only Git/PR/main tree and CI evidence; see above).
- R0-02: in progress (two branches created; Draft PR and first exact-head dual CI pending).
- R0-03–R0-05: pending.
- R1-01–R7-05: pending. In total 37 listed work packages; do not infer completion from this file.
- Engineering accepted work packages: 1 / 37 (R0-01), provisional until G00 reporting is finalized. No production CSS or Theme change committed.

## Next exact step

1. Establish Draft PR after this first documentation-only commit.
2. Adapt the two workflows' PR base filters and reference-JS baseline on **this** branch only; validate workflow run event/ref/jobs without altering Pages deployment logic.
3. Record immutable B0 source/theme/js checksums, obtain same-tree Actions artifacts when possible, build reproducible comparison harness with self/self and injected failure before any production CSS migration.
4. Populate owner/token/scope/active-reader ledgers and baseline Stage5-A entries; do not falsely mark browser or zero-regression gates accepted.

## Non-negotiable verification

Source build and static tests are not browser equivalence. Structural migration may change CSSOM order but must preserve computed values, inherited public overrides, geometry, pseudo-elements, states, contexts, animation and all public Theme outputs. Keep both previous-accepted and golden baseline references. Accepted batch requires current pushed SHA's QXFRAME CI and CSS Schema Acceptance, not merely tests against another SHA.
