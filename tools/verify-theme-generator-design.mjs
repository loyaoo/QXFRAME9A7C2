import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {normalizeConfig} from '../docs/assets/theme-generator/engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];

function assertComplete(theme){
  for(const mode of ['light','dark']){
    for(const entry of manifest.tokens)assert.ok(Object.prototype.hasOwnProperty.call(theme.tokens[mode],entry.name),'missing required '+mode+' token '+entry.name);
    assert.ok(Object.keys(theme.tokens[mode]).length>=manifest.tokens.length);
  }
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('.qxframe9a7c2-'));
  assert.ok(!theme.css.includes('!important'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('contrast-color('));
  assert.ok(!theme.css.includes('color(srgb'));
}

const base=generateTheme(manifest,recipes,{name:'design-base'});
assert.equal(base.config.style,'vega');
assert.equal(base.config.radius,'default');
assert.equal(base.config.density,'default');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.625rem');
assert.equal(base.tokens.light['--qxframe9a7c2-family-action-radius'],'var(--qxframe9a7c2-theme-radius-md)');
assert.equal(base.tokens.light['--qxframe9a7c2-family-surface-radius'],'var(--qxframe9a7c2-theme-radius-xl)');
assert.notEqual(base.tokens.light['--qxframe9a7c2-family-action-radius'],base.tokens.light['--qxframe9a7c2-family-surface-radius'],'Vega Card/surface and Button/action must use different radius tiers.');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-control-height-md'],'2.25rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-switch-width-md'],'2rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-switch-height-md'],'1.125rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-slider-rail-md'],'0.375rem');
assert.equal(base.tokens.light['--qxframe9a7c2-card-font-size'],'var(--qxframe9a7c2-typography-body-size)');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-card-title-delta'],'0.125rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-card-meta-gap'],'0.25rem');
assert.ok(base.tokens.light['--qxframe9a7c2-card-shadow'],'Vega Card recipe should author its subtle default shadow.');
assertComplete(base);

const signatures=new Set(),cardSignatures=new Set();
for(const style of styles){
  const theme=generateTheme(manifest,recipes,{name:'style-'+style,style});
  assert.equal(theme.config.style,style);
  assertComplete(theme);
  signatures.add([
    theme.tokens.light['--qxframe9a7c2-theme-control-height-md'],
    theme.tokens.light['--qxframe9a7c2-theme-switch-width-md'],
    theme.tokens.light['--qxframe9a7c2-theme-slider-rail-md'],
    theme.tokens.light['--qxframe9a7c2-family-action-radius'],
    theme.tokens.light['--qxframe9a7c2-family-surface-radius'],
    theme.tokens.light['--qxframe9a7c2-slider-handle-width-md'],
    theme.tokens.light['--qxframe9a7c2-slider-handle-height-md']
  ].join('|'));
  cardSignatures.add([
    theme.tokens.light['--qxframe9a7c2-card-md-padding'],
    theme.tokens.light['--qxframe9a7c2-card-font-size'],
    theme.tokens.light['--qxframe9a7c2-theme-card-title-delta'],
    theme.tokens.light['--qxframe9a7c2-theme-card-meta-gap'],
    theme.tokens.light['--qxframe9a7c2-family-surface-radius'],
    theme.tokens.light['--qxframe9a7c2-card-shadow']||'none'
  ].join('|'));
}
assert.equal(signatures.size,styles.length,'Every shadcn-derived Style must have a distinct geometry signature.');
assert.equal(cardSignatures.size,styles.length,'Every Style must expose a distinct Card visual recipe, not only generic control geometry.');

const luma=generateTheme(manifest,recipes,{name:'luma',style:'luma'});
assert.equal(luma.tokens.light['--qxframe9a7c2-theme-switch-width-md'],'2.75rem');
assert.equal(luma.tokens.light['--qxframe9a7c2-switch-thumb-width-md'],'1.5rem');
assert.equal(luma.tokens.light['--qxframe9a7c2-switch-thumb-height-md'],'1rem');
assert.equal(luma.tokens.light['--qxframe9a7c2-slider-handle-width-md'],'1.5rem');
assert.equal(luma.tokens.light['--qxframe9a7c2-slider-handle-height-md'],'1rem');
assert.equal(luma.tokens.light['--qxframe9a7c2-slider-handle-radius'],'var(--qxframe9a7c2-theme-radius-pill)');
assert.ok(luma.tokens.light['--qxframe9a7c2-card-shadow'],'Luma Card recipe should carry a soft default shadow.');

const lyra=generateTheme(manifest,recipes,{name:'lyra',style:'lyra'});
assert.equal(lyra.tokens.light['--qxframe9a7c2-family-action-radius'],'0');
assert.equal(lyra.tokens.light['--qxframe9a7c2-family-surface-radius'],'0');
assert.equal(lyra.tokens.light['--qxframe9a7c2-slider-rail-radius'],'0');
assert.equal(lyra.tokens.light['--qxframe9a7c2-slider-handle-radius'],'0');
assert.equal(lyra.tokens.light['--qxframe9a7c2-card-font-size'],'var(--qxframe9a7c2-typography-body-size)');
assert.equal(lyra.tokens.light['--qxframe9a7c2-card-shadow'],undefined,'Lyra Card recipe remains flat by default.');

const sera=generateTheme(manifest,recipes,{name:'sera',style:'sera'});
assert.equal(sera.tokens.light['--qxframe9a7c2-family-control-radius'],'0');
assert.equal(sera.tokens.light['--qxframe9a7c2-switch-track-radius'],'0');
assert.equal(sera.tokens.light['--qxframe9a7c2-slider-rail-radius'],'0');
assert.equal(sera.tokens.light['--qxframe9a7c2-theme-card-title-delta'],'0.25rem','Sera must carry an editorial Card title hierarchy.');

const radiusValues={none:'0',small:'0.5rem',medium:'0.625rem',large:'0.875rem'};
for(const [radius,expected] of Object.entries(radiusValues)){
  const theme=generateTheme(manifest,recipes,{name:'radius-'+radius,radius});
  assert.equal(theme.tokens.light['--qxframe9a7c2-theme-radius'],expected);
}
assert.equal(normalizeConfig({radius:'default'}).radius,'default');
assert.throws(()=>normalizeConfig({radius:'huge'}),/radius must be one of/);

const legacyDensity=generateTheme(manifest,recipes,{name:'legacy-density',style:'vega',density:'compact'});
assert.equal(legacyDensity.config.density,'compact','Legacy/import Density remains parse-compatible.');
assert.notEqual(legacyDensity.tokens.light['--qxframe9a7c2-theme-control-height-md'],base.tokens.light['--qxframe9a7c2-theme-control-height-md']);

const menu=generateTheme(manifest,recipes,{name:'menu',components:{menu:{color:'primary',appearance:'soft',accent:'balanced'}}});
assert.notEqual(menu.tokens.light['--qxframe9a7c2-menu-recipe-background'],base.tokens.light['--qxframe9a7c2-menu-recipe-background']);
assert.equal(menu.tokens.light['--qxframe9a7c2-theme-radius-md'],base.tokens.light['--qxframe9a7c2-theme-radius-md']);

const override=generateTheme(manifest,recipes,{name:'override-last',style:'maia',advanced:{overrides:{'--qxframe9a7c2-family-action-radius':'0.125rem'}}});
assert.equal(override.tokens.light['--qxframe9a7c2-family-action-radius'],'0.125rem');
assert.equal(override.tokens.dark['--qxframe9a7c2-family-action-radius'],'0.125rem');

const repeat=generateTheme(manifest,recipes,{name:'repeat',style:'rhea',baseColor:'zinc',roles:{primary:'#7c3aed'},chart:{color:'purple'},typography:{body:'inter',baseSize:16},radius:'small',components:{menu:{color:'neutral',appearance:'translucent',accent:'strong'}}});
const repeat2=generateTheme(manifest,recipes,JSON.parse(repeat.configJson));
assert.equal(repeat.css,repeat2.css);
assertComplete(repeat);

console.log(JSON.stringify({
  phase:'TG-D-design-presets-v3',
  styles:styles.length,
  styleNames:styles,
  radiusChoices:5,
  componentRadiusHierarchy:true,
  cardVisualRecipes:true,
  densityOwnedByStyle:true,
  legacyDensityImportCompatible:true,
  explicitOverrideLast:true,
  deterministic:true
}));
