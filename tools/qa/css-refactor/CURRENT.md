# CSS Refactor continuation — 2026-10-17 R0 evidence batch

- B0 source `62d9a8402c19460ced37265acc6d110ae2cfda76`, tree `a96bb959a69f15ce27d1c78182c273d422a531e9`.
- Latest fully passed prior-head pair `1cf13ce640df8c9ed0fc615551effe790cfc5f62`: QXFRAME run 39008100852 success, CSS Schema run 39008100884 success.
- GitHub PR merge SHA `6a567d6d64e2d2b7f46955135340b8b56f351d54` and source HEAD have the SAME Git tree `2e03417267fd4fd0c7a45c7f08c54c9acccf709e`; the Action artifact names use merge SHA, while `workflow_run.head_sha` reports source SHA.
- Verified Chromium CDP Chrome/155.0.8059.0: synthetic fixture 19 elements, light/dark: B0 self differences 0; intentional mutation yielded 2 computed differences per mode; B0→same production CSS differences 0; no runtime errors. Source JS parity verified 553 dist files, no differences. This completes minimum R0 self/mutant proof, NOT full G04/G05/G06.
- Current batch adds real dynamically mounted `docs/components/card.html` computed + screenshot B0 self/negative/candidate checks, stable DOM paths, required resource and stylesheet load; separate Stage5 postmerge ledger. Results pending current batch CI.
- Active implementation R0-03/R0-04/R0-05 partially complete; R1–R7 and production CSS changes pending. Stage5 owner visual signoff not provided.
- Next exact step: verify same-tree QXFRAME & Schema current batch runs; inspect report `css-refactor-smoke.json` and six real Card screenshot PNGs, fix any harness instability WITHOUT relaxing checks; then begin full CSS AST Token/rule/owner inventories and Card pilot design closure. Never merge PR #268 or modify main/B0.
