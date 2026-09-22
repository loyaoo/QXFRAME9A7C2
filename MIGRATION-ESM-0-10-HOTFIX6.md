# QXFRAME9A7C2 ESM Migration — 0→10 execution record

Baseline: `QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22`.

## 0→5 — baseline freeze

Status: **complete**.

- `npm test`: PASS before migration structure changes.
- `npm run verify:browser`: PASS before migration structure changes.
- Frozen source hashes, JS inventory, API JSON, module manifest, declaration file and raw logs live under `migration/baseline-hotfix6-2026-09-22/`.
- HOTFIX6 is the code authority. The migration handbook's HOTFIX5 line counts are historical reference only.

Frozen source facts:

- `src` JS: 73 files / 50,931 lines.
- `src/qxframe9a7c2.js`: 14,471 lines.
- Runtime modules: 72.
- Public component contracts: 40.

## 5→10 — real bundler bridge

Status: **scaffolded; Rollup execution pending dependency installation in an environment with npm package access**. The project pins `rollup` to `^4.63.4`.

Preflight: all current kernel/module JS sources pass Node ESM strict syntax parsing.

Added:

- `rollup.config.mjs`
- `src/legacy-entry.mjs`
- `npm run build:legacy`
- `npm run build:rollup`
- `npm run verify:rollup`
- `tools/verify-rollup-parity.js`

Rules of this bridge:

1. Default `npm run build` still uses the frozen legacy builder. Rollup has not taken production ownership yet.
2. `src/legacy-entry.mjs` side-effect imports the current kernel and all current modules, then invokes the same bundled bootstrap list.
3. `treeshake: false` is intentional at this stage: the first goal is behavior parity, not bundle optimization.
4. Rollup writes `dist/qxframe9a7c2.rollup.js`; it does not overwrite the production artifact during comparison.
5. `verify:rollup` first compares runtime registry/contracts, then temporarily runs the existing browser smoke against the Rollup bundle and always restores the legacy bundle.
6. No component, DOM, CSS, keyboard behavior, public API or default value was changed in 0→10.
7. No `"type": "module"` was added. Existing CommonJS tools remain valid until the dedicated 10→15 phase.

## Completion gate for 5→10

In an npm-connected environment run:

```text
npm install
npm run build:rollup
npm run verify:rollup
```

Only after both commands pass may Rollup replace the legacy concatenation path for production JS. Until then, 5→10 is not considered complete.
