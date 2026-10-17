# Core scoped painters: retire eight redundant component overrides

Frozen main/B0: `62d9a8402c19460ced37265acc6d110ae2cfda76`. Previous exact-head green: `c9f62722d68e843c99a28d24defa39c4080f2106` (QXFRAME #39031778806, CSS Schema #39031778552, Chromium Fast #39031778566).

## Production source and ownership
- Scope: one file only, `src/styles/main/theme-visual-v2.css`, within one current 47-rule `@scope (:root)`.
- Eight obsolete late painters removed; retained owners in already-existing component CSS remain unchanged (no replacement patch, extra file, alias, or new Theme/Token):
  - B0 #36 badge count → components/badge.css
  - B0 #41 alert description → components/alert.css
  - B0 #43 message/notification icon → components/notice.css
  - B0 #62 Slider tooltip → components/slider.css
  - B0 #63 Avatar → components/avatar.css
  - B0 #118 Card description → components/card.css
  - B0 #189 Button square/circle sizing → components/button.css
  - B0 #190 Button circle radius → components/button.css
- **47 → 39 scoped qualified rules** in the core module; the 153 previously unscoped selectors are unchanged, including their pinned SHA256 selector-list contract. No new @scope; 4 current production scope blocks remain.
- No edit to public Theme tokens, private variable values, font, component state or browser JS. The exact source gate now asserts one balanced scoped block and exactly 39 qualified rules.
- B0 rule #117 Card Title explicitly retained: in a separate fresh-text dark comparison, deleting it altered inherited Card title colors.
- Other same-looking candidates (Progress palette, checkbox radius, general statuses, button height, root semantic roles) remain untouched because their custom-variable/public override and cross-selector cascade ownership is not proven.

## Local negative and positive proof
- Started from the previously green compiled 153-unscoped/47-scoped candidate CSS, reconstructed from immutable B0 original 200 B0 rule IDs.
- Removed only B0 ids 36,41,43,62,63,118,189,190, while retaining every other selector, declaration and loaded JS/DOM.
- Fresh-text Chromium synthetic fixture: **447 light and 890 dark observed elements**; complete getComputedStyle custom/noncustom property sets and rects: **0 differences** per mode.
- Fresh original Card documentation runtime (9 JS assets, identical HTML/styles): **125 observed Card/root elements**, Light and Dark 0 full CSSOM/geometry differences each.
- Mutated root public Theme colors, relevant semantic slot colors and nested dark in an additional stress pass: Light and Dark full CSSOM/geometry 0 differences.
- Independent deletion tests with more realistic native Choice, Table, Alert, Message, Notification, Avatar, Slider and Button DOM detected genuine differences for apparently duplicate colors, shadows and borders. Those candidates were rejected rather than included.
- Limitations: full 112-case browser Theme matrix, portal and JS interaction paths are not yet covered. Exact-head three CI gates mandatory before marking accepted.

## Compliance and rollback
- No PR merge. B0/main unchanged. Do not weaken the duplicate-owner counter, computed-style comparator or screenshot/negative-injection gates.
- R5/R6 overall **not complete**: 39 scoped rules remain, historic giant core stylesheet remains active.
