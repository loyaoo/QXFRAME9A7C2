import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {normalizeConfig} from '../docs/assets/theme-generator/engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const required=new Set(manifest.tokens.map(x=>x.name));
const optional=new Set(manifest.optionalComponentOverrides);
function assertPublicComplete(theme){
  for(const name of required){assert.ok(name in theme.tokens.light,name);assert.ok(name in theme.tokens.dark,name);}
  for(const mode of ['light','dark'])for(const name of Object.keys(theme.tokens[mode]))assert.ok(required.has(name)||optional.has(name),'unexpected output '+name);
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('.qxframe9a7c2-'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('color(srgb'));
}

const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
const themes=Object.fromEntries(styles.map(style=>[style,generateTheme(manifest,recipes,{name:'style-'+style,style})]));
for(const theme of Object.values(themes))assertPublicComplete(theme);

assert.equal(themes.nova.config.radius,'default');
assert.equal(themes.nova.tokens.light['--qxframe9a7c2-theme-control-height-md'],'2rem');
assert.equal(themes.mira.tokens.light['--qxframe9a7c2-theme-control-height-md'],'1.75rem');
assert.equal(themes.sera.tokens.light['--qxframe9a7c2-theme-control-height-md'],'2.5rem');
assert.equal(themes.luma.tokens.light['--qxframe9a7c2-theme-switch-width-md'],'2.75rem');
assert.equal(themes.luma.tokens.light['--qxframe9a7c2-theme-slider-rail-md'],'0.5rem');
assert.equal(themes.nova.tokens.light['--qxframe9a7c2-theme-slider-handle-md'],'0.75rem');
assert.equal(themes.maia.tokens.light['--qxframe9a7c2-theme-slider-rail-md'],'0.75rem');
assert.equal(themes.sera.tokens.light['--qxframe9a7c2-theme-slider-handle-border-width'],'0');
assert.equal(themes.lyra.tokens.light['--qxframe9a7c2-theme-control-radius-md'],'0');
assert.equal(themes.lyra.tokens.light['--qxframe9a7c2-card-radius'],'0');
assert.equal(themes.sera.tokens.light['--qxframe9a7c2-card-radius'],'0');

assert.notEqual(themes.vega.tokens.light['--qxframe9a7c2-card-radius'],themes.vega.tokens.light['--qxframe9a7c2-theme-control-radius-md']);
assert.notEqual(themes.nova.tokens.light['--qxframe9a7c2-card-radius'],themes.nova.tokens.light['--qxframe9a7c2-theme-control-radius-md']);
assert.notEqual(themes.luma.tokens.light['--qxframe9a7c2-card-radius'],themes.luma.tokens.light['--qxframe9a7c2-theme-control-radius-md']);
assert.equal(themes.nova.tokens.light['--qxframe9a7c2-theme-control-radius-md'],'0.625rem');
assert.equal(themes.nova.tokens.light['--qxframe9a7c2-card-radius'],'0.875rem');
assert.equal(themes.luma.tokens.light['--qxframe9a7c2-theme-control-radius-md'],'1.375rem');
assert.equal(themes.luma.tokens.light['--qxframe9a7c2-card-radius'],'1.5rem');

const radii={};
for(const radius of ['default','none','small','medium','large']){
  radii[radius]=generateTheme(manifest,recipes,{name:'radius-'+radius,style:'nova',radius});
}
assert.equal(radii.none.tokens.light['--qxframe9a7c2-theme-radius'],'0');
assert.equal(radii.none.tokens.light['--qxframe9a7c2-card-radius'],'0');
assert.equal(radii.small.tokens.light['--qxframe9a7c2-theme-radius'],'0.45rem');
assert.equal(radii.medium.tokens.light['--qxframe9a7c2-theme-radius'],'0.625rem');
assert.equal(radii.large.tokens.light['--qxframe9a7c2-theme-radius'],'0.875rem');
assert.ok(parseFloat(radii.large.tokens.light['--qxframe9a7c2-card-radius'])>parseFloat(radii.large.tokens.light['--qxframe9a7c2-theme-control-radius-md']));

const type=generateTheme(manifest,recipes,{name:'type',style:'sera',typography:{body:'serif',heading:'humanist',mono:'system-mono',baseSize:16}});
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family'],/^Georgia/);
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family-heading'],/^"Trebuchet MS"/);
assert.match(type.tokens.light['--qxframe9a7c2-theme-font-family-mono'],/Cascadia Code/);
assert.throws(()=>normalizeConfig({typography:{baseSize:15}}),/even integer/);

const menu=generateTheme(manifest,recipes,{name:'menu',components:{menu:{color:'primary',appearance:'soft',accent:'balanced'}}});
for(const name of ['--qxframe9a7c2-theme-menu-background','--qxframe9a7c2-theme-menu-selected-background','--qxframe9a7c2-theme-menu-selected-text']){
  assert.notEqual(menu.tokens.light[name],undefined);
  assert.ok(!menu.tokens.light[name].includes('color-mix('));
}
const override=generateTheme(manifest,recipes,{name:'override-last',style:'nova',radius:'large',advanced:{overrides:{'--qxframe9a7c2-card-radius':'2rem'}}});
assert.equal(override.tokens.light['--qxframe9a7c2-card-radius'],'2rem');
assert.equal(override.tokens.dark['--qxframe9a7c2-card-radius'],'2rem');

const repeat=generateTheme(manifest,recipes,{name:'repeat',style:'luma',baseColor:'zinc',roles:{primary:'#7c3aed'},chart:{color:'purple'},typography:{body:'inter',baseSize:16},radius:'small',components:{menu:{color:'neutral',appearance:'translucent',accent:'strong'}}});
assert.equal(repeat.css,generateTheme(manifest,recipes,JSON.parse(repeat.configJson)).css);
assertPublicComplete(repeat);

console.log(JSON.stringify({
  phase:'TG-D-create-aligned-design-recipes',
  styles:8,radiusOptions:5,densityOwnedByStyle:true,
  componentRelativeRadius:true,switchSliderStyleGeometry:true,
  typography:true,menuPresets:true,explicitOverrideLast:true,deterministic:true
}));
