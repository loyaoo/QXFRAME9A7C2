import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THEME_PRESETS,applyThemePreset,presetById,presetOptions} from '../docs/assets/theme-generator/presets.mjs';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

assert.equal(THEME_PRESETS.length,8);
assert.equal(presetOptions().length,8);
assert.equal(new Set(THEME_PRESETS.map(x=>x.id)).size,8);
for(const id of ['signal','ledger','harbor','juniper','ember','orbit','graphite','canvas'])assert.equal(presetById(id).id,id);
assert.throws(()=>presetById('nova'),/Unknown Theme preset/,'QX commercial preset IDs remain separate from Style IDs.');

const css=new Set();
for(const preset of THEME_PRESETS){
  const config=applyThemePreset(preset.id,{name:'Preset '+preset.label});
  const theme=generateTheme(manifest,recipes,config);
  assert.equal(theme.config.name,'Preset '+preset.label);
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('contrast-color('));
  assert.ok((theme.css.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length>=8056);
  assert.ok(!theme.css.includes('color(srgb'));
  css.add(theme.css);
}
assert.equal(css.size,THEME_PRESETS.length,'Every QX Theme preset should produce a distinct complete theme.');

const current={
  name:'Keep My Name',
  roles:{error:'pink'},
  advanced:{overrides:{'--qxframe9a7c2-theme-focus-ring-size':'0.125rem'}}
};
const applied=applyThemePreset('signal',current);
assert.equal(applied.name,'Keep My Name');
assert.equal(applied.roles.error,'pink','Preset must preserve dimensions not explicitly owned by the preset.');
assert.equal(applied.advanced.overrides['--qxframe9a7c2-theme-focus-ring-size'],'0.125rem');

console.log(JSON.stringify({
  phase:'TG-H-preset-library',
  presets:THEME_PRESETS.map(x=>x.id),
  qxOwnedPresetNames:true,
  shadcnDerivedStyles:[...new Set(THEME_PRESETS.map(x=>x.config.style))],
  completeTheme:true,
  distinct:true
}));
