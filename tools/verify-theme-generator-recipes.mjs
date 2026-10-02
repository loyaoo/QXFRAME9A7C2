import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {readSchema} from '../docs/assets/theme-generator/engine.mjs';

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

const base=generateTheme(manifest,recipes,{name:'default-theme'});
assert.equal(base.reports.color.customized,false);
assert.equal(base.reports.color.recipeExpanded,false);
assert.equal(Object.keys(base.tokens.light).length,4028);
assert.equal(Object.keys(base.tokens.dark).length,4028);
assert.ok(!base.tokens.light['--qxframe9a7c2-theme-primary-foreground'].includes('contrast-color('));
assert.ok(!base.tokens.dark['--qxframe9a7c2-theme-primary-foreground'].includes('contrast-color('));
assert.equal(base.tokens.light['--qxframe9a7c2-theme-font-size-md'],'0.875rem');
assert.equal(base.tokens.light['--qxframe9a7c2-theme-radius-md'],'0.375rem');

const stone=generateTheme(manifest,recipes,{name:'stone-theme',baseColor:'stone'});
assert.equal(stone.reports.color.customized,true);
assert.equal(stone.reports.color.recipeExpanded,true);
assert.notEqual(stone.tokens.light[DEFAULTS.paletteGrey],base.tokens.light[DEFAULTS.paletteGrey]);
assert.notEqual(stone.tokens.light[DEFAULTS.neutral],base.tokens.light[DEFAULTS.neutral]);
assert.equal(stone.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary],'base color must not rewrite primary scale');
assert.equal(stone.tokens.light[DEFAULTS.chart],base.tokens.light[DEFAULTS.chart],'base color must not rewrite chart palette');
assert.ok(stone.reports.color.generatedColorTargets.light.length>100);
assert.ok(stone.reports.color.generatedColorTargets.dark.length>100);

const primary=generateTheme(manifest,recipes,{name:'violet-role',roles:{primary:'#7c3aed'}});
assert.equal(primary.reports.color.recipeExpanded,true);
assert.equal(primary.tokens.light[DEFAULTS.paletteGrey],base.tokens.light[DEFAULTS.paletteGrey],'primary must not rewrite neutral palette');
assert.notEqual(primary.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary]);
assert.equal(primary.tokens.light[DEFAULTS.chart],base.tokens.light[DEFAULTS.chart],'primary must not rewrite chart palette');
assert.notEqual(primary.tokens.light['--qxframe9a7c2-theme-color-token-subtle-selected-1'],base.tokens.light['--qxframe9a7c2-theme-color-token-subtle-selected-1']);

const customBlue=generateTheme(manifest,recipes,{name:'custom-blue',palette:{blue:'#0ea5e9'}});
assert.notEqual(customBlue.tokens.light['--qxframe9a7c2-palette-blue-5'],base.tokens.light['--qxframe9a7c2-palette-blue-5']);
assert.notEqual(customBlue.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary],'default primary=blue must follow an explicitly customized blue palette');
assert.equal(customBlue.tokens.light[DEFAULTS.paletteGrey],base.tokens.light[DEFAULTS.paletteGrey]);

const chart=generateTheme(manifest,recipes,{name:'cool-chart',chart:{preset:'cool'}});
assert.equal(chart.reports.color.customized,true);
assert.equal(chart.reports.color.recipeExpanded,false,'chart-only changes must not recalculate semantic/component color roles');
assert.notEqual(chart.tokens.light[DEFAULTS.chart],base.tokens.light[DEFAULTS.chart]);
assert.notEqual(chart.tokens.dark[DEFAULTS.chart],base.tokens.dark[DEFAULTS.chart]);
assert.equal(chart.tokens.light[DEFAULTS.primary],base.tokens.light[DEFAULTS.primary]);
assert.equal(chart.tokens.light[DEFAULTS.neutral],base.tokens.light[DEFAULTS.neutral]);
assert.equal(chart.tokens.light[DEFAULTS.role],base.tokens.light[DEFAULTS.role]);

const orthogonal=generateTheme(manifest,recipes,{name:'radius-only',radius:'large'});
assert.equal(orthogonal.reports.color.customized,false);
assert.notEqual(orthogonal.tokens.light['--qxframe9a7c2-theme-radius-md'],base.tokens.light['--qxframe9a7c2-theme-radius-md']);
for(const name of schema.order.filter(name=>name.includes('-palette-')||name.includes('-theme-color-')||/--qxframe9a7c2-theme-(?:primary|success|warning|error|info|chart)/.test(name))){
  assert.equal(orthogonal.tokens.light[name],base.tokens.light[name],'radius must not mutate color token: '+name);
  assert.equal(orthogonal.tokens.dark[name],base.tokens.dark[name],'radius must not mutate dark color token: '+name);
}

assert.throws(()=>generateTheme(manifest,recipes,{name:'bad-custom-base',baseColor:'custom'}),/requires palette\.grey/);

for(const theme of [stone,primary,customBlue,chart]){
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('!important'));
  assert.ok(!theme.css.includes('.qxframe9a7c2-'));
  assert.equal((theme.css.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length,8056);
  assert.ok(!/color-mix\(/.test(theme.tokens.light['--qxframe9a7c2-theme-color-token-subtle-selected-1']||''));
}

console.log(JSON.stringify({
  phase:'TG-C-frozen-recipe-expansion',
  requiredPublicInputs:4028,
  offlineOnColor:true,
  neutralPrimaryOrthogonal:true,
  chartThemeOrthogonal:true,
  completeTheme:true
}));
