# Theme Schema v1 — Public Generator Contract

> **THEME-VISUAL-V2-001 / v1.5 authority:** `QXFRAME9A7C2-Theme-Visual-System-v1.5.md` supersedes the old complete Palette/state/size output architecture for the new task. This file freezes the legacy v1 interface for regression only; it does not require new v2 consumers to preserve palette dependence. The representative pilot has a separately versioned complete-color schema and source-equivalence gate. Both gates remain active until the full migration and Phase H default replacement; the pilot does not switch production defaults. Current v1 inventory: 4,028 required inputs and 532 optional overrides.

> **2026-10-03 compatible Style-recipe extension:** the required Palette/Theme interface remains exactly 4,028 entries and keeps interface hash `421bad21f47d6c90555b994664ef399051f1bf69fad4119f3dcee44c790c399c`. The optional Component override registry grows from the original 462 frozen slots to 532 additive slots (including the later PR #254 surface/Menu additions) so Switch/Slider can express the user-authorized Vega/Nova/Maia/Lyra/Mira/Luma/Sera/Rhea geometry without private tokens or generated component selectors. Existing themes remain valid because these slots are optional and preserve the previous fallback geometry when absent.

This freeze is the prerequisite for the user's Theme Generator / commercial Theme Studio request. It locks the public visual interface, not independent architecture/security signoff. The version becomes usable by the generator only after this PR's full release and strict Chromium freeze checks pass and merge.

Authority: `QXFRAME9A7C2-Theme-Generator-Development-Guide-v1.md`. Previous Size Tree, SCSS/source order, static colors and 9-controller migration remain completed; this task does not restart them.

- `docs/generated/theme-public-schema-v1.json`: 4,028 complete Palette/Theme public inputs with Light/Dark defaults, stable ownership and interface hash. The generator reads this committed file, never scans current CSS.
- `docs/generated/theme-color-recipes-v1.json`: reviewed, abstract color recipe data from the immutable migration evidence. It is pure design data; recipe symbols are not runtime CSS interfaces. Output targets are public Theme roles only.
- Component overrides are optional and separately registered. A complete default theme does not emit optional Component defaults that would mask ancestor overrides.
- Menu color/treatment slots resolve through private final values at ordinary and portaled items. Existing fallbacks, disabled/danger/focus authority and all default geometry remain intact. Heading/mono families are reserved public Studio roles; chart materials work without a generator.
- Public interface/default/recipe drift fails `verify:theme-schema-v1`. Updating the interface requires a reviewed manifest/schema change, not a runtime discovery fallback.

Required evidence: existing Token graph/layer/state/source/geometry/release checks, 28 unchanged Menu mode/orientation/state cases, scoped Switch/Slider and Menu/List isolation probes, actual Select/DatePicker/Modal/Drawer/Menu physical scoped portals, strict CSS acceptance and static color regressions. Generator implementation must wait for these checks and the freeze merge.

The generator will use OKLCH/OKLab design calculations outside framework runtime, output deterministic complete static CSS, and the canonical docs Studio will apply the generated sheet once per preview update. No component selectors, private CSS variables, runtime controllers, Grid/fr/viewport units or new accessibility/RTL features are introduced.
