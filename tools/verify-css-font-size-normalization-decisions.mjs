import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {STYLE_RULE_VERSION,STYLE_ROLES,STYLE_APPEARANCE,normalizeStyleConfig} from '../docs/assets/theme-generator/style-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/styles/theme/_visual-v2.scss'),'utf8');

assert.equal(STYLE_RULE_VERSION,'qx-style-3');
for(const role of ['font-family','font-family-heading','font-family-mono','typography-body-size','typography-meta-size','typography-heading-size','typography-kpi-size','typography-body-weight','typography-label-weight','control-font-weight','control-letter-spacing','control-text-transform','heading-letter-spacing','heading-text-transform']){
  assert.ok(STYLE_ROLES.includes(role),'Missing canonical typography role: '+role);
}
for(const style of Object.keys(STYLE_APPEARANCE)){
  const resolved=normalizeStyleConfig({style});
  for(const role of ['font-family','font-family-heading','font-family-mono','typography-body-size','typography-meta-size','typography-heading-size','typography-kpi-size']){
    assert.ok(resolved.style[role]!=null,'Style must resolve typography role: '+style+'/'+role);
  }
}

// Typography lengths must keep the framework's even-pixel policy at the 16px
// root. Text tracking may use relative values and is intentionally excluded.
for(const match of source.matchAll(/--qxframe9a7c2-theme-v2-(?:control-font-size-md|control-line-box-md|typography-(?:body|meta|heading|kpi)-size)\s*:\s*(-?\d*\.?\d+)(rem|px)\s*;/g)){
  const px=Math.abs(Number(match[1]))*(match[2]==='rem'?16:1);
  assert.ok(px===1||Number.isInteger(px/2),'Typography geometry must use even px references: '+match[0]);
}

// The retired numeric font preset tree must not be recreated as a public API.
assert.doesNotMatch(source,/--qxframe9a7c2-font-size-(?:9|11|13|15|17)\s*:/,'Retired odd numeric font presets must not return.');
assert.doesNotMatch(source,/--qxframe9a7c2-theme-font-size-/,'Legacy Theme font-size bridge must not return.');

console.log(JSON.stringify({ok:true,styleRuleVersion:STYLE_RULE_VERSION,styles:Object.keys(STYLE_APPEARANCE).length,typographyAuthority:'theme-v2-style-profiles',legacyOddFontPresetBridge:false}));
