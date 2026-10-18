# TWO-SCOPE-FOCUS-CONTROL — semantic component-owner closure
**Base:** `8df023fbe7655cadc5bcd84d29caf83183701824` — exact QXFRAME #39108470184, Fast #39108470234 and CSS Schema #39108470258 all successful.
**Frozen B0/main:** `62d9a8402c19460ced37265acc6d110ae2cfda76`. **PR #268 Draft**, never merge without owner approval.

## Production changes
1. Retire `src/styles/components/focus-feedback.css` (one @scope block, two qualified rules); remove its build/exclusion references. The native pointer outline has an existing canonical owner `components/focus-closeout.css` for standalone controls; it uses exactly the same Theme pointer-width, focus-color and offset. For Image, replace the early component slot's fallback with the later scoped winner `var(--qxframe9a7c2-theme-overlay)` *in the actual `components/image.css` owner*. No new role or selector.
2. Remove the second @scope block from `components/control-interaction.css`. Its two qualified rules (JS Input hover and native FormInput/Select/Textarea hover) stay in the exact same cascade module order as ordinary CSS. The formerly redundant earlier `native-input.css` hover state-border declaration is removed, preserving the remaining state-z author.
3. The canonical manifest and `tools/style-source.mjs` Schema-1 exclusions both delete the unused `focus-feedback` reference. CSS module count goes down by one, **active @scope blocks drop 4→2**, and no new historical filename or compatibility shim is introduced.

## Local preflight and negative controls
- Official previous-green 1,102,309-byte compiled CSS directly reconstructed with precisely the above changes (candidate 1,100,997 bytes).
- Headless Chromium using CSS text injection (network navigation restricted in this container) into static official Card, Form and Image docs DOM + 39 static component states including Theme pointer-width 3px/offset −1px, nested local dark and public Image override. All computed CSSOM properties and rectangles, Light/Dark, candidate versus prior fully green source: 0 differences in all 6 combinations.
- Native pointer hover via browser mouse targeting `.qxframe9a7c2-input`, Form Input, Select and Textarea: all 8 Light/Dark scenarios have **zero full CSSOM differences**.
- AST source owner inventory: **0 new repeated selector+property+at-context owners** when both scopes close; simple blind flatten (without relocating Image and retiring early hover) would add 5 duplicate owner claims and was rejected.
- The local sample does not prove full JS mounted docs, shadow/portal semantics, keyboard origin, 112 Theme combos or S5 user acceptance. Exact new-head QXFRAME + Schema + Fast Chromium (with B0 negative injection, pointer focus, Card screenshots) must all pass.
- No change to Theme Generator output, public Theme token list, JS/DOM, focus origin protocol, modal animations or old approved CI gates.
