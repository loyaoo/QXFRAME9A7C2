# Five scoped rules moved into their actual component CSS owners

## Grounding
Frozen B0/main `62d9a8402c19460ced37265acc6d110ae2cfda76`; last triple-green development SHA `7b1d00dd938c16327c51255479640a033e58450c`. PR #268 Draft; no merge or baseline mutation.

## Five component-owned migrations
- Current scoped #12 / B0 #55: move Item disabled transparency and opacity into `item-surface.css` (direct :disabled/is-disabled plus List/Tree disabled ancestors). Its base disabled recipe is updated in place; no alias selector replaces it.
- Current #17 / B0 #66: SliderHandle shadow resolved directly in existing `slider.css`, from the frozen Theme thumb-shadow role, instead of an overridden hardcoded shadow.
- Current #18 and #19 / B0 #86 and #87: Carousel arrow background/hover and foreground plus caption foreground/background are integrated in the already existing arrow and caption rules within `carousel.css`. No new visual version layer.
- Current #39 / B0 #194: checked Switch offset within `switch.css` includes real track border width in the original state selector, preserving geometry.
- Removes these five late declarations from `main/theme-visual-v2.css`, keeping 153 ordinary core rules, **34 scoped** qualified core rules and **four** total scoped blocks. Strict source-contract rule count changed 39→34; 153-selector SHA check is unchanged. No public Theme variables or production JS/DOM modified.

## Local Chromium preflight and negatives
Compiled the edits against the last all-green official dist CSS, with source-order module boundaries preserved.
- 505 Light and 948 Dark DOM samples across component families, state classes, local .dark and public override contexts; full computed CSSOM including private slots, geometry: **zero differences**.
- Real Card documentation booted from original HTML and nine original JS assets: 125 Card/root nodes per mode, full CSSOM/geometry **zero differences**.
- Dedicated Item/List/Tree disabled, checked Switch, SliderHandle and Carousel arrow/caption nodes are added to Fast Chromium's B0 self/negative/candidate synthetic fixture. Actual QXFRAME, CSS Schema, Fast all required before accepting.
- Rejected deletion-only attempts: Item disabled opacity, Slider shadow, Carousel painting and Switch offset remain behavioral owners. This batch migrates those owners into their actual canonical component files rather than only deleting overrides.

## Remaining
34 scoped main-core qualified rules and three other scope blocks remain, with Button/Input/Card/Popup/Choice as primary cascade conflicts. R5/R6 and 112-config/Portal/keyboard/mouse user acceptance are not closed.
