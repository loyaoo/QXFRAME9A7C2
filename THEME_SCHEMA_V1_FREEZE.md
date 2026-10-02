# Theme Schema v1 — Public Generator Contract

This freeze is the prerequisite for the user's Theme Generator / commercial Theme Studio request. It locks the public visual interface, not independent architecture/security signoff. The version becomes usable by the generator only after this PR's full release and strict Chromium freeze checks pass and merge.

Authority: `QXFRAME9A7C2-Theme-Generator-Development-Guide-v1.md`. Previous Size Tree, SCSS/source order, static colors and 9-controller migration remain completed; this task does not restart them.

- `docs/generated/theme-public-schema-v1.json`: 4,028 complete Palette/Theme public inputs with Light/Dark defaults, stable ownership and interface hash. The generator reads this committed file, never scans current CSS.
- `docs/generated/theme-color-recipes-v1.json`: reviewed, abstract color recipe data from the immutable migration evidence. It is pure design data; recipe symbols are not runtime CSS interfaces. Output targets are public Theme roles only.
- Component overrides are optional and separately registered. A complete default theme does not emit optional Component defaults that would mask ancestor overrides.
- Menu color/treatment slots resolve through private final values at ordinary and portaled items. Existing fallbacks, disabled/danger/focus authority and all default geometry remain intact. Heading/mono families are reserved public Studio roles; chart materials work without a generator.
- Public interface/default/recipe drift fails `verify:theme-schema-v1`. Updating the interface requires a reviewed manifest/schema change, not a runtime discovery fallback.

Required evidence: existing Token graph/layer/state/source/geometry/release checks, 28 unchanged Menu mode/orientation/state cases, scoped Switch/Slider and Menu/List isolation probes, actual Select/DatePicker/Modal/Drawer/Menu physical scoped portals, strict CSS acceptance and static color regressions. Generator implementation must wait for these checks and the freeze merge.

The generator will use OKLCH/OKLab design calculations outside framework runtime, output deterministic complete static CSS, and the canonical docs Studio will apply the generated sheet once per preview update. No component selectors, private CSS variables, runtime controllers, Grid/fr/viewport units or new accessibility/RTL features are introduced.
