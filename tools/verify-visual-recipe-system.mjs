import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {normalizeConfig,configOptions} from '../docs/assets/theme-generator/engine.mjs';
import {contrastRatio,parseColor} from '../docs/assets/theme-generator/color-engine.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url)));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url)));
const opts=configOptions(),token=name=>'--qxframe9a7c2-'+name;
let shapeCases=0,menuCases=0;
const base=generateTheme(manifest,recipes,{});
for(const style of opts.styles)for(const policy of opts.shapePolicies)for(const radius of opts.radii){
  const theme=generateTheme(manifest,recipes,{style,radius,shape:Object.fromEntries(opts.shapeFamilies.map(name=>[name,policy]))});
  for(const mode of ['light','dark']){
    const t=theme.tokens[mode];
    for(const size of ['xs','sm','md','lg','xl'])assert.equal(t[token('theme-control-font-size-'+size)],'var(--qxframe9a7c2-theme-font-size-md)');
    if(policy==='square')for(const name of ['choice-radio-radius','choice-checkbox-radius','switch-track-radius','switch-thumb-radius','slider-handle-radius','range-progress-radius','compact-shape-radius','identity-shape-radius'])assert.equal(t[token(name)],'0');
    if(policy==='follow'&&radius==='none'){
      assert.equal(t[token('theme-radius-sm')],'0');
      for(const name of ['choice-radio-radius','switch-track-radius','slider-handle-radius','compact-shape-radius','identity-shape-radius'])assert.equal(t[token(name)],'var(--qxframe9a7c2-theme-radius-sm)');
    }
    if(policy==='intrinsic')assert.equal(t[token('choice-radio-radius')],'var(--qxframe9a7c2-theme-radius-circle)');
  }
  shapeCases++;
}
for(const scheme of opts.menuSchemes)for(const accentStyle of opts.menuStyles)for(const expand of opts.menuExpands)for(const scope of opts.menuScopes){
  const theme=generateTheme(manifest,recipes,{components:{menu:{scheme,accentStyle,expand,scope}}});
  for(const mode of ['light','dark']){
    const t=theme.tokens[mode];
    assert.ok(contrastRatio(t[token('menu-recipe-background')],t[token('menu-recipe-text')])>=4.5,scheme+' menu foreground '+mode);
    assert.ok(contrastRatio(t[token('menu-recipe-selected')],t[token('menu-recipe-selected-text')])>=4.5,scheme+'/'+accentStyle+' selected '+mode);
    assert.notEqual(scheme==='brand'&&accentStyle==='solid'?t[token('menu-recipe-background')]:'a',scheme==='brand'&&accentStyle==='solid'?t[token('menu-recipe-selected')]:'b');
    for(const name of Object.keys(t).filter(x=>/picker|tooltip|popover/.test(x)))assert.equal(t[name],base.tokens[mode][name],name+' must remain independent of Menu');
    assert.equal(t[token('theme-menu-background')],base.tokens[mode][token('theme-menu-background')],'Menu recipe must not replace the global fallback surface');
    if(expand==='minimal')assert.equal(t[token('menu-recipe-expanded')],t[token('menu-recipe-background')]);
  }
  assert.ok(theme.css.includes(scope==='all-menus'?'[data-qxframe9a7c2-surface-context="menu"]':scope==='menu-tree'?'[data-qxframe9a7c2-menu-recipe="tree"]':'[data-qxframe9a7c2-menu-recipe="current"] >'));
  assert.equal(theme.css,generateTheme(manifest,recipes,JSON.parse(theme.configJson)).css);
  menuCases++;
}
for(const surface of ['default','outlined','elevated','borderless']){
  const t=generateTheme(manifest,recipes,{surface}).tokens.light;
  assert.equal(t[token('card-border-width')],['elevated','borderless'].includes(surface)?'0':'1px');
  if(['outlined','borderless'].includes(surface))assert.equal(t[token('card-shadow')],'none');
}
const purple=generateTheme(manifest,recipes,{roles:{primary:'purple'}});
for(const mode of ['light','dark'])for(const slot of ['bg','border']){const name=token('theme-color-button-disabled-'+slot+'-1-default'),a=parseColor(purple.tokens[mode][name]),b=parseColor(base.tokens[mode][name]);for(const channel of ['r','g','b'])assert.ok(Math.abs(a[channel]-b[channel])<=1/255,'Default Disabled '+slot+' remains Neutral');}
const scaled=generateTheme(manifest,recipes,{foundation:{sizeScale:1.25,radiusScale:1.5}});
assert.equal(scaled.tokens.light[token('theme-control-height-md')],'calc(2.25rem * 1.25)');
assert.equal(scaled.tokens.light[token('theme-radius-md')],'calc(0.625rem * 1.5)');
assert.equal(scaled.tokens.light[token('theme-font-size-md')],'0.875rem');
assert.equal(normalizeConfig({components:{menu:{color:'primary'}}}).components.menu.scheme,'brand');
assert.throws(()=>normalizeConfig({shape:{choice:'round'}}),/shape.choice/);
assert.throws(()=>normalizeConfig({foundation:{sizeScale:0}}),/sizeScale/);
console.log(JSON.stringify({task:'VISUAL-RECIPE-SYSTEM-001',shapeCases,menuCases,lightDark:true,requiredInputs:manifest.tokens.length,scopedOwnership:true,deterministic:true}));
