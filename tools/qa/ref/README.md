# Pinned shadcn reference renderer

Measurement-only React application. It is excluded from the framework and published docs.

Source: shadcn-ui/ui commit 295a1f114a138f23b5dfee0e0c6812394dfeb90c.
Set SHADCN_SOURCE to a checkout/extraction of that commit. The build validates
159 used/scanned source files against source-lock.json (SHA-256 with LF line endings).
The explicit --record-source-lock option is only for recording a verified source snapshot.

From the repository root:

~~~sh
pnpm --dir tools/qa/ref install --frozen-lockfile
SHADCN_SOURCE=/absolute/path/to/pinned/source node tools/qa/ref/build.mjs
node tools/build-release.mjs
CHROMIUM_BIN=/path/to/chrome node tools/qa/card-geometry.mjs
CHROMIUM_BIN=/path/to/chrome node tools/qa/preview-01-audit.mjs
~~~

On PowerShell set environment variables with $env:SHADCN_SOURCE and
$env:CHROMIUM_BIN before running node. Without CHROMIUM_BIN, install Playwright
Chromium using pnpm --dir tools/qa/ref exec playwright install chromium.
QA_NODE_MODULES can point at an existing Playwright installation; normally it is unnecessary.

Both renderers force system-ui, sans-serif only during measurement. Framework
font choices are unchanged. The audit serves repository files on localhost and
substitutes the local JS build for the preview's online runtime URL; committed
preview HTML keeps the online URL.

card-geometry.mjs checks source-locked dimensions, two body slot spellings and
public override/state contracts across 8 styles × light/dark. It fails on regressions.
preview-01-audit.mjs records the first Card of each of 33 source examples.
It compares radius, title size and title offsets; height/width and footer styles
are diagnostic. It does not assert full card parity, nested-card coverage,
interaction parity, or content rendered through stubs.
Charts, calendar and QR internals are stubs; their content is not accepted evidence.
Animation utilities are shimmed out. Images use the reference renderer's existing
Next stub. These limitations must remain explicit in stage reports.

Reports and screenshots are written to tools/qa/reports/stage-3 and uploaded by
the repository's existing QA artifact step. Do not scan generated bundles for
Tailwind candidates: JS regex literals can become malformed arbitrary utilities
and invalidate following style rules in the browser.
