import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THEME_PRESETS,applyThemePreset,presetById,presetOptions} from '../docs/assets/theme-generator/presets.mjs';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const required=new Set(manifest.tokens.map(x=>x.name)),optional=new Set(manifest.optionalComponentOverrides);
assert.equal(THEME_PRESETS.length,8);assert.equal(presetOptions().length,8);assert.equal(new Set(THEME_PRESETS.map(x=>x.id)).size,8);
for(const id of ['signal','ledger','harbor','juniper','ember','orbit','graphite','canvas'])assert.equal(presetById(id).id,id);
assert.throws(()=>presetById('nova'),/Unknown Theme preset/,'Style names and QX bundle preset names stay separate.');

const expectedStyles={signal:'vega',ledger:'mira',harbor:'rhea',juniper:'maia',ember:'vega',orbit:'luma',graphite:'lyra',canvas:'sera'};
const css=new Set();
for(const preset of THEME_PRESETS){
  const config=applyThemePreset(preset.id,{name:'Preset '+preset.label});
  assert.equal(config.style,expectedStyles[preset.id]);
  assert.equal(Object.prototype.hasOwnProperty.call(config,'density'),false);
  assert.ok(config.chart&&config.chart.color);
  const theme=generateTheme(manifest,recipes,config);
  for(const mode of ['light','dark']){
    for(const name of required)assert.ok(name in theme.tokens[mode]);
    for(const name of Object.keys(theme.tokens[mode]))assert.ok(required.has(name)||optional.has(name));
  }
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('color(srgb'));
  css.add(theme.css);
}
assert.equal(css.size,8);

const current={name:'Keep My Name',roles:{error:'pink'},advanced:{overrides:{'--qxframe9a7c2-theme-focus-ring-size':'0.125rem'}}};
const applied=applyThemePreset('signal',current);
assert.equal(applied.name,'Keep My Name');
assert.equal(applied.roles.error,'pink');
assert.equal(applied.advanced.overrides['--qxframe9a7c2-theme-focus-ring-size'],'0.125rem');

console.log(JSON.stringify({phase:'TG-H-preset-library',presets:THEME_PRESETS.map(x=>x.id),styleBundles:expectedStyles,qxOwnedNames:true,completeTheme:true,distinct:true}));
