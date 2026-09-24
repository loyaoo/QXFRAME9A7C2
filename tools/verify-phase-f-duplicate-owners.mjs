import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8');
const count=needle=>css.split(needle).length-1;

assert.equal(count('.qxframe9a7c2-control-contract.is-secondary{'),1,
  'Control Contract secondary accent must have one canonical owner.');
assert.equal(count('.qxframe9a7c2-control-contract.is-danger'),1,
  'Control Contract danger accent must have one canonical shared Color Variant owner.');
assert.match(css,/\.qxframe9a7c2-control-contract\.is-secondary\{--_qxframe9a7c2-accent:var\(--_qxframe9a7c2-semantic-text-secondary\);/,
  'Shared Color Variant contract must remain the secondary accent owner.');
assert.match(css,/\.qxframe9a7c2-control-contract\.is-danger,\.qxframe9a7c2-progress\.is-exception\{--_qxframe9a7c2-accent:var\(--_qxframe9a7c2-semantic-error\);/,
  'Shared Color Variant contract must remain the danger accent owner.');

assert.equal(css.includes('Notice rails keep the slimmer passive treatment.'),false,
  'Dead early Notice scrollbar owner must not return.');
assert.equal(count('.qxframe9a7c2-notice-viewport{'),1,
  'Notice viewport must have one canonical layout/scrollbar owner.');
assert.match(css,/\.qxframe9a7c2-notice-viewport\{[^}]*scrollbar-width:none;[^}]*pointer-events:none/,
  'Canonical Notice viewport must retain hidden native scrollbar behavior.');
assert.equal(count('.qxframe9a7c2-notice-viewport::-webkit-scrollbar{'),1,
  'Notice WebKit scrollbar must have one canonical hidden owner.');
assert.match(css,/\.qxframe9a7c2-notice-viewport::\-webkit-scrollbar\{display:none;width:0;height:0\}/,
  'Canonical Notice WebKit scrollbar must remain hidden.');
assert.equal(css.includes('.qxframe9a7c2-notice-viewport::-webkit-scrollbar-track{'),false,
  'Dead Notice track styling must not return while the scrollbar is hidden.');
assert.equal(css.includes('.qxframe9a7c2-notice-viewport::-webkit-scrollbar-thumb{'),false,
  'Dead Notice thumb styling must not return while the scrollbar is hidden.');

assert.match(css,/\.qxframe9a7c2-item-collection-item\{[^}]*display:flex;align-items:center;gap:var\(--_qxframe9a7c2-control-gap\);width:100%;/,
  'ItemCollection gap must live in the canonical item owner.');
assert.equal(css.includes('.qxframe9a7c2-item-collection-item{gap:var(--_qxframe9a7c2-control-gap)}'),false,
  'ItemCollection gap-only selector reopening must not return.');
assert.match(css,/\.qxframe9a7c2-list-item\{[^}]*display:flex;align-items:center;gap:var\(--qxframe9a7c2-space-2\);width:100%;/,
  'List gap must live in the canonical item owner.');
assert.equal(css.includes('.qxframe9a7c2-list-item{gap:var(--qxframe9a7c2-space-2)}'),false,
  'List gap-only selector reopening must not return.');

assert.match(css,/\.qxframe9a7c2-form-selectgroup\.is-image-grid \.qxframe9a7c2-form-selectgroup-label\{width:100%;min-width:8\.25rem;padding:0;align-items:stretch\}/,
  'SelectGroup image-grid label width must live in the canonical image-grid label owner.');
assert.equal(count('.qxframe9a7c2-form-selectgroup.is-image-grid .qxframe9a7c2-form-selectgroup-label{'),1,
  'SelectGroup image-grid label must not be reopened for one property.');

assert.equal(count('.qxframe9a7c2-image-preview-root[hidden]{'),1,
  'Image Preview hidden state must have one canonical rule.');
assert.match(css,/\.qxframe9a7c2-image-preview-root\[hidden\]\{display:none!important\}/,
  'Image Preview canonical hidden state must remain display:none.');
assert.equal(css.includes('.qxframe9a7c2-image-preview-root[hidden]{display:none!important;pointer-events:none!important}'),false,
  'Unreachable Image Preview hidden pointer-events patch must not return.');

/* These duplicate selectors are intentional staged owners, not cleanup targets. */
assert.match(css,/\.qxframe9a7c2-button\.is-loading\{--_qxframe9a7c2-button-paint-z:/,
  'Button independent paint-z priority channel must remain staged.');
assert.match(css,/Preview chrome participates in the same presence lifecycle as the image trajectory/,
  'Image Preview presence-motion refinement must remain explicitly staged.');
assert.match(css,/JSON keeps Tree as the hierarchy owner, but projects a code-reader surface/,
  'JSON code-reader refinement must remain explicitly staged.');

assert.equal(css.includes('@layer'),false,'Phase F must not introduce @layer.');
assert.equal(css.includes(':is('),false,'Phase F must not introduce :is().');
assert.equal(css.includes(':where('),false,'Phase F must not introduce :where().');

console.log(JSON.stringify({
  ok:true,
  retiredDuplicateOwners:true,
  noticeDeadScrollbarRules:0,
  canonicalItemGapOwners:true,
  selectGroupOwnerUnified:true,
  imagePreviewHiddenOwnerUnified:true,
  intentionalStagedOwnersPreserved:true
}));
