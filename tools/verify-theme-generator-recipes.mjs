import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {readSchema} from '../docs/assets/theme-generator/engine.mjs';
import {chooseOnColor,parseColor,rgbToOklch} from '../docs/assets/theme-generator/color-engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const schema=readSchema(manifest);

const DEFAULTS={
  primary:'--qxframe9a7c2-theme-primary-5',
  neutral:'--qxframe9a7c2-theme-neutral-5',
  paletteGrey:'--qxframe9a7c2-palette-grey-5',
  chart:'--qxframe9a7c2-theme-chart-1',
  role:'--qxframe9a7c2-theme-color-mode-loading-mask-1'
};
function assertComplete(theme){
  for(const mode of ['light','dark'])for(const name of schema.order)assert.ok(Object.prototype.hasOwnProperty.call(theme.tokens[mode],name),'missing required '+mode+' '+name);
  assert.ok(!theme.css.includes('color(srgb'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
}
function hueDistance(a,b){
  const d=Math.abs(a-b)%360;
  return Math.min(d,360-d);
}
function assertMonochrome(theme,mode){
  const colors=Array.from({length:8},(_,i)=>parseColor(theme.tokens[mode]['--qxframe9a7c2-theme-chart-'+(i+1)]));
  const hues=colors.map(c=>rgbToOklch(c)).filter(x=>x.c>0.01).map(x=>x.h);
  const anchor=hues[0];
  for(const hue of hues.slice(1))assert.ok(hueDistance(anchor,hue)<4,'Chart series must remain on one hue; '+mode+' delta='+hueDistance(anchor,hue));
  assert.ok(new Set(colors.map(c=>[c.r,c.g,c.b].map(v=>Math.round(v*255)).join(','))).size>=5,'Chart needs multiple monochrome steps.');
}

const base=generateTheme(manifest,recipes,{name:'default-theme'});
assert.equal(base.reports.color.customized,false);
assert.equal(base.reports.color.recipeExpanded,false);
assertComplete(base);
assertMonochrome(base,'light');
assertMonochrome(base,'dark');
assert.ok(!base.tokens.light['--qxframe9a7c2-theme-primary-foreground'].includes('contrast-color('));

const stone=generateTheme(manifest,recipes,{name:'stone-theme',baseColor:'stone'});
assert.equal(stone.reports.color.customized,true);
assert.equal(stone.reports.color.recipeExpanded,true);
assert.notEqual(stone.tokens.light[DEFAULTS.paletteGrey],base.tokens.light[DEFAULTS.paletteGrey]);
assert.notEqual(stone.tokens.light[DEFAULTS.neutral],base.tokens.light[DEFAULTS.neutral]);
assert.equal(stone.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary],'base color must not rewrite primary scale');
assert.equal(stone.tokens.light[DEFAULTS.chart],base.tokens.light[DEFAULTS.chart],'base color must not rewrite a primary-owned chart');

const primary=generateTheme(manifest,recipes,{name:'violet-role',roles:{primary:'#7c3aed'}});
assert.equal(primary.reports.color.recipeExpanded,true);
assert.notEqual(primary.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary]);
assert.equal(primary.tokens.light['--qxframe9a7c2-theme-primary-foreground'],chooseOnColor('#7c3aed').css);
assert.notEqual(primary.tokens.light[DEFAULTS.chart],base.tokens.light[DEFAULTS.chart],'Chart color=Primary must follow Primary.');
assertMonochrome(primary,'light');

const customBlue=generateTheme(manifest,recipes,{name:'custom-blue',palette:{blue:'#0ea5e9'}});
assert.notEqual(customBlue.tokens.light['--qxframe9a7c2-palette-blue-5'],base.tokens.light['--qxframe9a7c2-palette-blue-5']);
assert.notEqual(customBlue.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary]);

const blueChart=generateTheme(manifest,recipes,{name:'blue-chart',chart:{color:'blue'}});
const purplePrimaryBlueChart=generateTheme(manifest,recipes,{name:'blue-chart-purple-primary',roles:{primary:'purple'},chart:{color:'blue'}});
assert.equal(blueChart.reports.color.customized,true);
assert.equal(blueChart.reports.color.recipeExpanded,false,'chart-only changes must not recalculate semantic/component color roles');
for(let i=1;i<=8;i++){
  const name='--qxframe9a7c2-theme-chart-'+i;
  assert.equal(purplePrimaryBlueChart.tokens.light[name],blueChart.tokens.light[name],'Explicit Chart color must be independent of Primary.');
}
assertMonochrome(blueChart,'light');
assertMonochrome(blueChart,'dark');

const neutralChart=generateTheme(manifest,recipes,{name:'neutral-chart',chart:{color:'neutral'}});
assertMonochrome(neutralChart,'light');
assertMonochrome(neutralChart,'dark');

const orthogonal=generateTheme(manifest,recipes,{name:'radius-only',radius:'large'});
assert.equal(orthogonal.reports.color.customized,false);
assert.notEqual(orthogonal.tokens.light['--qxframe9a7c2-theme-radius-md'],base.tokens.light['--qxframe9a7c2-theme-radius-md']);
for(const name of schema.order.filter(name=>name.includes('-palette-')||name.includes('-theme-color-')||/--qxframe9a7c2-theme-(?:primary|success|warning|error|info|chart)/.test(name))){
  assert.equal(orthogonal.tokens.light[name],base.tokens.light[name],'radius must not mutate color token: '+name);
  assert.equal(orthogonal.tokens.dark[name],base.tokens.dark[name],'radius must not mutate dark color token: '+name);
}

assert.throws(()=>generateTheme(manifest,recipes,{name:'bad-custom-base',baseColor:'custom'}),/requires palette\.grey/);
for(const theme of [base,stone,primary,customBlue,blueChart,neutralChart])assertComplete(theme);

console.log(JSON.stringify({
  phase:'TG-C-frozen-recipe-expansion-v2',
  requiredPublicInputs:manifest.tokens.length,
  optionalPublicSlots:manifest.optionalComponentOverrides.length,
  offlineOnColor:true,
  monochromeCharts:true,
  chartPrimaryFollowing:true,
  explicitChartPrimaryOrthogonal:true,
  completeTheme:true
}));
