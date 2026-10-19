import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.match(css,/\.qxframe9a7c2-card-actions\{display:flex;/);
// L0 structural gate for Card Action: inspect each public selector's computed
// recipe declarations, not the historical one-selector-per-rule source shape.
// This remains strict for min-height/flex and both action aliases.
const actionCss=css.replace(/\/\*[\s\S]*?\*\//g,'');
const actionRules=[...actionCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([,prelude,body])=>({
  selectors:prelude.split(',').map(v=>v.trim()),body:body.trim()
}));
const actionAliases=['.qxframe9a7c2-card-action','.qxframe9a7c2-card-action-item'];
const matchAction=(selector)=>{
  const matching=actionRules.filter(x=>x.selectors.includes(selector));
  assert.equal(matching.length,1,'Exactly one owner rule for '+selector);
  return matching[0].body;
};
const actionBase=actionAliases.map(matchAction);
assert.equal(actionBase[0],actionBase[1],'Both Card Action aliases require identical base declarations');
assert.match(actionBase[0],/^display:flex;min-width:0;min-height:(?:var\(--[^)]+\)|calc\([^;{}]+\)|-?\d*\.?\d+rem);flex:1 1 0;/);
for(const suffix of [':last-child',':hover:not(:disabled)',':disabled']){
  const states=actionAliases.map(name=>matchAction(name+suffix));
  assert.equal(states[0],states[1],'Card Action '+suffix+' declarations must remain identical');
}

assert.doesNotMatch(css,/\.qxframe9a7c2-card-actions\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-selectgroup-image\{display:flex;[^}]*flex-direction:column/);
assert.doesNotMatch(css,/\.qxframe9a7c2-selectgroup-image\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-wrap\{[^}]*display:inline-flex;[^}]*align-items:center;[^}]*justify-content:center/);
assert.doesNotMatch(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-wrap\{[^}]*grid-template-/);
assert.doesNotMatch(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-indicator\{[^}]*(?:grid-column|grid-row)/);

assert.match(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*display:flex;[^}]*flex-direction:column/);
assert.doesNotMatch(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-image\{[^}]*display:inline-flex;[^}]*align-items:stretch/);
assert.doesNotMatch(css,/\.qxframe9a7c2-image\{[^}]*display:inline-grid/);

console.log(JSON.stringify({ok:true,batch:'css-grid-lowrisk-closeout-4',convertedRules:6,retiredThemeSizeDependency:false}));
