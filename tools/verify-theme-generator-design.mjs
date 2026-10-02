import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {normalizeConfig} from '../docs/assets/theme-generator/engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

const base=generateTheme(manifest,recipes,{name:'design-base'});
assert.equal(base.config.style,'balanced');
assert.equal(base.config.radius,'medium');
assert.equal(base.config.density,'default');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-family'],'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-family-heading'],'inherit');
assert.match(base.tokens.light['--qxframe9a7c2-theme-font-family-mono'],/ui-monospace/);
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-xs'],'0.75rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-sm'],'0.875rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-md'],'0.875rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-lg'],'1rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-xl'],'1.125rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-xs'],'0.125rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-sm'],'0.25rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.375rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-lg'],'0.5rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-xl'],'0.625rem');

const soft=generateTheme(manifest,recipes,{name:'soft-style',style:'soft'});
assert.equal(soft.config.radius,'large');
assert.equal(soft.config.density,'comfortable');
assert.equal(soft.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.5rem');
assert.equal(soft.tokens.light['--qxframe9a7c2-theme-control-height-md'],'var(--qxframe9a7c2-size-17)');
assert.equal(soft.tokens.light['--qxframe9a7c2-theme-card-shadow-blur-lg'],'var(--qxframe9a7c2-size-12)');

const explicit=generateTheme(manifest,recipes,{name:'soft-explicit',style:'soft',radius:'small',density:'compact'});
assert.equal(explicit.config.radius,'small');
assert.equal(explicit.config.density,'compact');
assert.equal(explicit.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.25rem');
assert.equal(explicit.tokens.light['--qxframe9a7c2-theme-control-height-md'],'var(--qxframe9a7c2-size-15)');
assert.equal(explicit.tokens.light['--qxframe9a7c2-theme-control-padding-inline-md'],'var(--qxframe9a7c2-size-4)');
assert.equal(explicit.tokens.light['--qxframe9a7c2-theme-table-cell-py-md'],'var(--qxframe9a7c2-size-3)');

const comfortable=generateTheme(manifest,recipes,{name:'comfortable',density:'comfortable'});
assert.equal(comfortable.tokens.light['--qxframe9a7c2-theme-control-height-xs'],'var(--qxframe9a7c2-size-13)');
assert.equal(comfortable.tokens.light['--qxframe9a7c2-theme-control-height-xl'],'var(--qxframe9a7c2-size-21)');
assert.equal(comfortable.tokens.light['--qxframe9a7c2-theme-table-cell-px-xl'],'var(--qxframe9a7c2-size-9)');

const type=generateTheme(manifest,recipes,{name:'type',typography:{body:'serif',heading:'humanist',mono:'system-mono',baseSize:16},radius:'large',density:'compact'});
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family'],/^Georgia/);
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family-heading'],/^"Trebuchet MS"/);
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family-mono'],/Cascadia Code/);
assert.equal(type.tokens.light['--qxframe9a7c2-theme-font-size-md'],'1rem');
assert.equal(type.tokens.light['--qxframe9a7c2-theme-font-size-xl'],'1.25rem');
assert.equal(type.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.5rem');
assert.equal(type.tokens.light['--qxframe9a7c2-theme-control-height-md'],'var(--qxframe9a7c2-size-15)');
assert.throws(()=>normalizeConfig({typography:{baseSize:15}}),/even integer/);

const menu=generateTheme(manifest,recipes,{name:'menu',components:{menu:{color:'primary',appearance:'soft',accent:'balanced'}}});
const menuTokens=[
  '--qxframe9a7c2-theme-menu-background',
  '--qxframe9a7c2-theme-menu-item-background',
  '--qxframe9a7c2-theme-menu-item-text',
  '--qxframe9a7c2-theme-menu-hover-background',
  '--qxframe9a7c2-theme-menu-hover-text',
  '--qxframe9a7c2-theme-menu-selected-background',
  '--qxframe9a7c2-theme-menu-selected-hover-background',
  '--qxframe9a7c2-theme-menu-selected-text',
  '--qxframe9a7c2-theme-menu-selected-indicator'
];
for(const name of menuTokens){
  assert.notEqual(menu.tokens.light[name],undefined);
  assert.notEqual(menu.tokens.dark[name],undefined);
  assert.ok(!menu.tokens.light[name].includes('color-mix('));
  assert.ok(!menu.tokens.dark[name].includes('color-mix('));
}
assert.notEqual(menu.tokens.light['--qxframe9a7c2-theme-menu-background'],base.tokens.light['--qxframe9a7c2-theme-menu-background']);
assert.equal(menu.tokens.light['--qxframe9a7c2-theme-radius-md'],base.tokens.light['--qxframe9a7c2-theme-radius-md']);
assert.equal(menu.tokens.light['--qxframe9a7c2-theme-chart-1'],base.tokens.light['--qxframe9a7c2-theme-chart-1']);

const override=generateTheme(manifest,recipes,{
  name:'override-last',
  radius:'large',
  advanced:{overrides:{'--qxframe9a7c2-theme-radius-md':'1rem'}}
});
assert.equal(override.tokens.light['--qxframe9a7c2-theme-radius-md'],'1rem');
assert.equal(override.tokens.dark['--qxframe9a7c2-theme-radius-md'],'1rem');

const repeat=generateTheme(manifest,recipes,{name:'repeat',style:'precision',baseColor:'zinc',roles:{primary:'#7c3aed'},chart:{preset:'warm'},typography:{body:'inter',baseSize:16},radius:'small',density:'compact',components:{menu:{color:'neutral',appearance:'translucent',accent:'strong'}}});
const repeat2=generateTheme(manifest,recipes,JSON.parse(repeat.configJson));
assert.equal(repeat.css,repeat2.css);
assert.ok(!repeat.css.includes('contrast-color('));
assert.ok(!repeat.css.includes('color-mix('));
assert.ok(!repeat.css.includes('--_qxframe9a7c2-'));
assert.ok(!repeat.css.includes('.qxframe9a7c2-'));
assert.equal((repeat.css.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length,8060);

console.log(JSON.stringify({
  phase:'TG-D-design-presets',
  styles:4,
  radiusPresets:4,
  densityPresets:3,
  typography:true,
  menuPresets:true,
  explicitOverrideLast:true,
  deterministic:true
}));
