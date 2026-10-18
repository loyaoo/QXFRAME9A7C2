# Appearance owner consolidation — remove complete @scope block

## Frozen references
- Immutable B0/main SHA: `62d9a8402c19460ced37265acc6d110ae2cfda76`.
- Last exact-head triple-green: `bd1d3e8745aade6560cf786b43ed43f9c2e50b71`, Fast #39129699445, QXFRAME #39129699412, CSS Schema #39129699428.
- PR #268 Draft; no merge authorized.

## Production owner changes — atomic group
1. `src/styles/components/component-appearance.css`: remove the last `@scope (:root)` wrapper around four Control border/background and native Choice radius rules; their declarations and original selector priority within the late module remain unchanged.
2. `src/styles/components/component-sizing.css`: remove the earlier hardcoded `--_qxframe9a7c2-control-border-width:1px` from six single-line Control owners. The other 47 framework sizing root selectors explicitly retain the original 1px default in a single shared declaration, preserving their CSSOM instead of promoting this private property to `:root`.
3. `src/styles/components/data-control-states.css`: remove five earlier `background-color:var(--_qxframe9a7c2-control-bg)` declarations, leaving their border/foreground State owner roles intact. The later shared Control Appearance rule already owns the exact same background value.
4. `src/styles/components/choice-visual.css`: remove overlapping five Checkbox and three Radio radius selectors from earlier Choice declarations; retain precisely the exceptional unwrapped SelectGroup child-selector shape, which does not match the late appearance owner.

**Net production @scope blocks: 2 → 1.** The final semantic-cascade core scope contains 29 unresolved qualified rules; it is deliberately untouched. No new private or public Theme names, fallback variable, historical compatibility file, app JS/DOM, Theme compiler, or changed default value.

## Preflight
- Official previous-green Windows dist+docs artifact ID `12138012544` (nested ZIP, 765 CRC-verified entries), real compiled CSS 1,101,391 bytes.
- Rebuilt candidate concatenated CSS by replacing exactly these four owned source module sections (1,102,206 bytes); no other CSS source content changed.
- Browser Chromium all-computed CSSOM + getBoundingClientRect in Light/Dark on 44 native/JS field, Button/Card, OTP, Checkbox/Radio, SelectGroup, nested-dark elements: candidate differences **0** each mode after 1200ms transition stabilization.
- Inlined actual docs Card HTML, 9 runtime JS assets, and site styles. **159 nodes Light full CSSOM/geometry: 0 differences; full-page PNG bytes identical.** Real Card Dark requires exact-head official CI (local browser hung on second inlined 4.5MB navigation; no unverified success claim).
- tinycss2 complete 1.1MB CSS owner graph: duplicate owners **87 → 86**, **zero newly duplicated** (naive scope removal alone created 19 new overlapping selector/property definitions and was rejected).
- No threshold, CSSOM ignore list, PNG masking, ratchet baseline increase or mouse hover acceptance relaxation; strict independent Fast / full QXFRAME / Schema exact SHA required.

## Acceptance and remaining risks
- Current batch **implemented, pending exact HEAD all-three success**, not R5/R6 completion.
- Existing global public Choice radio/checkbox radius and Control width overrides are maintained in original canonical declaration semantics. Additional 112 Theme combinations, portal, density variants, actual nested shadow and user Stage5-A acceptance remain open, and demand later L2 gates.
- Remaining one scoped semantic cascade must be solved by actual owner closure and fully proven cascade precedence; do not blind flatten.

## Exact-head CI shape dependency and strict correction
- [Fast #39134378268](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39134378268) **success** at `62052f4c`: synthetic Light/Dark candidate CSSOM 0, real Card 152 nodes/mode CSSOM+geometry 0, Light/Dark full screenshot pixel equality, native Card Action hover 0, negative poison detected.
- [QXFRAME #39134378211](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39134378211) and [Schema #39134378295](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39134378295) failed only the old `theme-v2-contract.mjs` check `154 !== 153` because one *intentional* 47-selector non-Control border-width fallback owner was now in `component-sizing.css`. No browser parity error was reported.
- New strict contract recognizes **exactly one** extra owner by SHA-256 fingerprint `d5d0ff9ea95673a8f5ccc87b7061a568060153e9360150872a6f4142e60ba222`, **47** selectors, and exactly one `--_qxframe9a7c2-control-border-width:1px` declaration. The **original 153 selector hash and order** are still independently required, and every other extra top-level selector still fails. This is a stricter semantic owner test than a source shape count alone; no threshold or CSSOM exclusion expanded.
- Latest corrective HEAD requires QXFRAME+Schema+Fast same SHA successes before acceptance.
