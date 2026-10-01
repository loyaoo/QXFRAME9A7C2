import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});

assert.doesNotMatch(css,/\b999px\b/,'Canonical SCSS must not use numeric pill sentinels.');
assert.match(css,/--qxframe9a7c2-theme-radius-pill\s*:\s*var\(--qxframe9a7c2-radius-pill\)/,'Theme pill slot must resolve from Preset pill radius.');
assert.match(css,/--qxframe9a7c2-scroll-track-radius\s*:\s*var\(--qxframe9a7c2-theme-radius-pill\)/,'Scroll pill radius default must use Theme pill slot.');
assert.match(css,/border-radius\s*:\s*var\(--qxframe9a7c2-theme-radius-pill\)/,'Component pill consumers must use Theme pill slot.');
console.log(JSON.stringify({ok:true,numericPillSentinels:0,themeSlot:'--qxframe9a7c2-theme-radius-pill'}));
