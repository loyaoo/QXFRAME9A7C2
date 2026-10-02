import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));
const required=new Set(manifest.tokens.map(x=>x.name)),optional=new Set(manifest.optionalComponentOverrides);
const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
const primaries=['blue','cyan','teal','purple','orange'],bases=['neutral','zinc','stone'];
const radii=['default','none','small','medium','large'];
const charts=['primary','neutral','blue','purple','green','orange','grey'];
const menuColors=['default','primary','inverted','neutral'],menuAppearances=['solid','soft','translucent'];
const seen={styles:new Set(),primaries:new Set(),bases:new Set(),radii:new Set(),charts:new Set(),menuColors:new Set(),menuAppearances:new Set()};
const hashes=new Set();let count=0;
for(let si=0;si<styles.length;si++)for(let pi=0;pi<primaries.length;pi++)for(let bi=0;bi<bases.length;bi++){
  const index=count,config={
    name:'matrix-'+index,style:styles[si],baseColor:bases[bi],roles:{primary:primaries[pi]},
    chart:{color:charts[index%charts.length]},
    typography:{body:index%2?'inter':'system-ui',heading:index%3?'inherit':'humanist',baseSize:[12,14,16,18][index%4]},
    radius:radii[index%radii.length],
    components:{menu:{color:menuColors[index%menuColors.length],appearance:menuAppearances[index%menuAppearances.length],accent:['subtle','balanced','strong'][index%3]}}
  };
  const theme=generateTheme(manifest,recipes,config);
  for(const mode of ['light','dark']){
    for(const name of required)assert.ok(name in theme.tokens[mode]);
    for(const name of Object.keys(theme.tokens[mode]))assert.ok(required.has(name)||optional.has(name),'unknown output '+name);
  }
  assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
  assert.ok(!theme.css.includes('!important'));
  assert.ok(!theme.css.includes('color-mix('));
  assert.ok(!theme.css.includes('color(srgb'));
  assert.ok(!theme.css.includes('.qxframe9a7c2-'));
  const hash=crypto.createHash('sha256').update(theme.css).digest('hex');
  assert.equal(hash,crypto.createHash('sha256').update(generateTheme(manifest,recipes,config).css).digest('hex'));
  hashes.add(hash);
  seen.styles.add(config.style);seen.primaries.add(config.roles.primary);seen.bases.add(config.baseColor);seen.radii.add(config.radius);seen.charts.add(config.chart.color);seen.menuColors.add(config.components.menu.color);seen.menuAppearances.add(config.components.menu.appearance);
  count++;
}
assert.equal(count,120);
assert.equal(hashes.size,120);
assert.equal(seen.styles.size,8);assert.equal(seen.primaries.size,5);assert.equal(seen.bases.size,3);assert.equal(seen.radii.size,5);
assert.equal(seen.charts.size,charts.length);assert.equal(seen.menuColors.size,4);assert.equal(seen.menuAppearances.size,3);
console.log(JSON.stringify({phase:'TG-I-regression-matrix',themes:count,styleCoverage:[...seen.styles],radiusCoverage:[...seen.radii],chartCoverage:[...seen.charts],lightDarkEveryTheme:true,deterministic:true}));
