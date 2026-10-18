# Descendant semantic roles and component owner simplification

**Frozen B0**: `62d9a8402c19460ced37265acc6d110ae2cfda76`. **Prior triple-green HEAD**: `9cd71e7be6a046782781b61b499b3f7dad55263a` (QXFRAME #39083685796, CSS Schema #39083685823, Fast Chromium #39083685812).

**Production batch**: The root-scoped universal `*` rule owns 62 private semantic variables and matches root descendants, not `html` itself. Move its unchanged body into a zero-specificity ordinary descendant selector `* *` **immediately before** the remaining scoped block at the same canonical CSS source position. No `:where()`, `:is()`, `@layer`, new public Token, new scoped block, runtime JS or Theme compiler changes. The core scoped rule count drops 31→30 while total @scope blocks stay 4. The full role values and order are unchanged; the source gate validates 62 custom slots and SHA256 of normalized declarations `ad84c66458f5556bd0c06394784b40d4d6751b2d93e49a1d72c2538ab8b766c2`.

Four component-local duplicate *adjacent same-selector* qualified rules were combined in Descriptions horizontal content, Popover Arrow, Modal Header, and collapsed Notice Stack. Specificity, ordered declarations, load position and states remain unchanged. Composition InputGroup Field removes one repeated byte-identical box-sizing declaration.

**Risk and acceptance**: CSS scope proximity vs normal cascade is not generally interchangeable. Strict exact-HEAD Chromium full CSSOM/geometry/root/private slots, Light/Dark real Card PNG comparison, native hover and deliberate mutants, QXFRAME release, and CSS Schema must pass. If full CSSOM differs, revert the role movement without modifying the comparator. The already-green baseline and main/B0 remain untouched; PR #268 stays Draft; R5/R6 still open.
