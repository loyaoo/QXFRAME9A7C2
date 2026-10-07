import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.match(css,/\.qxframe9a7c2-form-selectgroup-item\{flex:1 1 var\(--_qxframe9a7c2-form-selectgroup-item-basis,0\);min-width:var\(--_qxframe9a7c2-form-selectgroup-item-min-width,0\)\}/);
for(const mode of ['is-image-grid','is-boxes']){
  const rule=css.split('.qxframe9a7c2-form-selectgroup.'+mode+'{')[1]?.split('}')[0]||'';
  assert.ok(rule,'Missing SelectGroup flex mode: '+mode);
  assert.match(rule,/display:flex/,'SelectGroup '+mode+' must remain Flex.');
  // v3 stage 2b may inline the root constant; basis and min-width must still share one value.
  const basis=rule.match(/--_qxframe9a7c2-form-selectgroup-item-basis:([^;]+)/)?.[1];
  const minWidth=rule.match(/--_qxframe9a7c2-form-selectgroup-item-min-width:([^;]+)/)?.[1];
  assert.ok(basis&&/^(?:var\(--[^)]+\)|calc\([^;]+\)|-?\d*\.?\d+rem)$/.test(basis),'SelectGroup '+mode+' basis must have one shared geometry owner.');
  assert.equal(minWidth,basis,'SelectGroup '+mode+' min-width must share the basis owner.');
  assert.doesNotMatch(rule,/display:grid|grid-template-columns/,'SelectGroup '+mode+' must not reintroduce Grid.');
}

console.log(JSON.stringify({ok:true,batch:'selectgroup-auto-fit-to-flex',convertedRules:2,retiredThemeSizeDependency:false}));
