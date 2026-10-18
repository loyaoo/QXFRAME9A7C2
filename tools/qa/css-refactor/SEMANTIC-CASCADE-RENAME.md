# Semantic Cascade Core — remove final version-named production CSS file

## Exact base and scope
- Frozen B0/main: `62d9a8402c19460ced37265acc6d110ae2cfda76`.
- Prior exact-head Fast/QXFRAME/Schema all passed: `d35af9a4eea47c0b860a1ffb5f2cc32aa15a646c`. Draft PR #268, no merge.
- Replace the **final** `src/styles/main/theme-visual-v2.css` production module with `src/styles/main/semantic-cascade.css` at the **identical canonical CSS source position**. The module retains every CSS selector, scope, declaration, custom property value and relative rule order; only the obsolete versioned introductory comment is rewritten.
- The actual module is now 24.9 KB and owns **31 scoped qualified rules** plus root roles. Seven previously separated component-domain files keep the other 153 plain rules. The remaining @scope rules (4 blocks total) are **not** claimed solved by this rename; module owner disambiguation and browser CreateApp/Portal matrix still need work.
- Build/Schema1 list, geometry, token/size/color/semantic tests and CreateApp runtime source checks are all switched atomically to the new path (including 27 CreateApp references). Source fixture implementation metadata and the source-order physical stage name are aligned. No old `src/styles/main/theme-visual-v2.css` remains in the build manifest or tool readers.
- The duplicate-owner historical budget `main/theme-visual-v2:34` transfers to `main/semantic-cascade:9`, using the **actual count 9** reported by the previous green QXFRAME run. This reduces the global duplicate-owner allowance by **25**, never increases it. No CSS gates, negative controls or hard style constraints are softened.
- This is production file identity cleanup, **not a fake claim of @scope elimination**. It is deliberately batched to avoid one-commit-per-reference CI restarts.

## Proof and acceptance
- The core rule text is preserved; only a non-rendered header comment changes. The compiler concatenates CSS in the same canonical position.
- Verify exact-head GitHub Fast Chromium real Card docs Light/Dark full computed+geometry+screenshots, deliberate poison detection; QXFRAME CI including package/source preflight; CSS Schema full suite. A build/source failure must be corrected with no increased allowances.
- B0/main unchanged and PR #268 stays Draft. Do not accept until all three are green; Stage5 user visual sign-off is still absent.
