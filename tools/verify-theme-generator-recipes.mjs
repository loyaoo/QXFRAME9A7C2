import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {readSchema} from '../docs/assets/theme-generator/engine.mjs';
import {chooseOnColor,rgbToOklch,parseColor} from '../docs/assets/theme-generator/color-engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const schema=readSchema(manifest),required=new Set(schema.order),optional=schema.optionalSet;
function assertComplete(theme){
  for(const mode of ['light','dark']){
    for(const name of required)assert.ok(name in theme.tokens[mode],'missing '+mode+' '+name);
    for(const name of Object.keys(theme.tokens[mode]))assert.ok(required.has(name)||optional.has(name),'unexpected '+name);
  }
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('!important'));
  assert.ok(!theme.css.includes('.qxframe9a7c2-'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('color(srgb'));
}
function hueDelta(a,b){return Math.abs(((a-b+540)%360)-180);}

const base=generateTheme(manifest,recipes,{name:'default-theme'});
assert.equal(base.reports.color.customized,false);
assert.equal(base.reports.color.recipeExpanded,false);
assertComplete(base);
assert.equal(base.config.style,'nova');
assert.equal(base.config.chart.color,'primary');
assert.equal(base.config.radius,'default');

const stone=generateTheme(manifest,recipes,{name:'stone-theme',baseColor:'stone'});
assert.equal(stone.reports.color.customized,true);
assert.equal(stone.reports.color.recipeExpanded,true);
assert.notEqual(stone.tokens.light['--qxframe9a7c2-palette-grey-5'],base.tokens.light['--qxframe9a7c2-palette-grey-5']);
assert.notEqual(stone.tokens.light['--qxframe9a7c2-theme-neutral-5'],base.tokens.light['--qxframe9a7c2-theme-neutral-5']);

const primary=generateTheme(manifest,recipes,{name:'violet-role',roles:{primary:'#7c3aed'}});
assert.equal(primary.reports.color.recipeExpanded,true);
assert.equal(primary.tokens.light['--qxframe9a7c2-theme-primary-foreground'],chooseOnColor('#7c3aed').css);
assert.notEqual(primary.tokens.light['--qxframe9a7c2-theme-primary-5'],base.tokens.light['--qxframe9a7c2-theme-primary-5']);
assert.notEqual(primary.tokens.light['--qxframe9a7c2-theme-chart-4'],base.tokens.light['--qxframe9a7c2-theme-chart-4'],'default chart color follows primary');
const primaryHue=rgbToOklch(parseColor(primary.tokens.light['--qxframe9a7c2-theme-primary'])).h;
for(let i=1;i<=8;i++){
  const h=rgbToOklch(parseColor(primary.tokens.light['--qxframe9a7c2-theme-chart-'+i])).h;
  assert.ok(hueDelta(h,primaryHue)<8,'primary chart remains one hue family');
}

const purpleChart=generateTheme(manifest,recipes,{name:'purple-chart',chart:{color:'purple'}});
assert.equal(purpleChart.reports.color.customized,true);
assert.equal(purpleChart.reports.color.recipeExpanded,false,'chart-only change does not recalculate semantic recipes');
assert.equal(purpleChart.tokens.light['--qxframe9a7c2-theme-primary-5'],base.tokens.light['--qxframe9a7c2-theme-primary-5']);
const chartHues=[];
for(let i=1;i<=8;i++)chartHues.push(rgbToOklch(parseColor(purpleChart.tokens.light['--qxframe9a7c2-theme-chart-'+i])).h);
assert.ok(Math.max(...chartHues)-Math.min(...chartHues)<8,'explicit chart family is restrained, not rainbow');

const customBlue=generateTheme(manifest,recipes,{name:'custom-blue',palette:{blue:'#0ea5e9'}});
assert.notEqual(customBlue.tokens.light['--qxframe9a7c2-palette-blue-5'],base.tokens.light['--qxframe9a7c2-palette-blue-5']);
assert.notEqual(customBlue.tokens.light['--qxframe9a7c2-theme-primary-5'],base.tokens.light['--qxframe9a7c2-theme-primary-5']);
assert.notEqual(customBlue.tokens.light['--qxframe9a7c2-theme-chart-4'],base.tokens.light['--qxframe9a7c2-theme-chart-4']);

const radiusOnly=generateTheme(manifest,recipes,{name:'radius-only',radius:'large'});
assert.equal(radiusOnly.reports.color.customized,false);
assert.notEqual(radiusOnly.tokens.light['--qxframe9a7c2-theme-radius-md'],base.tokens.light['--qxframe9a7c2-theme-radius-md']);
for(const name of schema.order.filter(name=>name.includes('-palette-')||name.includes('-theme-color-')||/--qxframe9a7c2-theme-(?:primary|success|warning|error|info|chart)/.test(name))){
  assert.equal(radiusOnly.tokens.light[name],base.tokens.light[name],'radius must not mutate color token: '+name);
}

for(const theme of [base,stone,primary,purpleChart,customBlue,radiusOnly])assertComplete(theme);
assert.throws(()=>generateTheme(manifest,recipes,{name:'bad-custom-base',baseColor:'custom'}),/requires palette\.grey/);

console.log(JSON.stringify({
 phase:'TG-C-frozen-recipe-expansion',requiredPublicInputs:4028,
 offlineOnColor:true,neutralPrimaryOrthogonal:true,
 chartSingleHue:true,chartColorIndependent:true,completeTheme:true
}));
