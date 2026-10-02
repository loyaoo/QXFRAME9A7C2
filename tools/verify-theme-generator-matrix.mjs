import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

const styles=['balanced','soft','precision','compact'];
const primaries=['blue','cyan','teal','purple','orange'];
const bases=['neutral','zinc','stone'];
const radii=['none','small','medium','large'];
const densities=['compact','default','comfortable'];
const charts=['balanced','cool','warm','mixed','mono'];
const menuColors=['default','primary','inverted','neutral'];
const menuAppearances=['solid','soft','translucent'];

const seen={styles:new Set(),primaries:new Set(),bases:new Set(),radii:new Set(),densities:new Set(),charts:new Set(),menuColors:new Set(),menuAppearances:new Set()};
const hashes=new Set();
let count=0;
for(let si=0;si<styles.length;si+=1){
  for(let pi=0;pi<primaries.length;pi+=1){
    for(let bi=0;bi<bases.length;bi+=1){
      const index=count;
      const config={
        name:'matrix-'+index,
        style:styles[si],
        baseColor:bases[bi],
        roles:{primary:primaries[pi]},
        chart:{preset:charts[index%charts.length]},
        typography:{body:index%2?'inter':'system-ui',heading:index%3?'inherit':'humanist',baseSize:[12,14,16,18][index%4]},
        radius:radii[index%radii.length],
        density:densities[index%densities.length],
        components:{menu:{color:menuColors[index%menuColors.length],appearance:menuAppearances[index%menuAppearances.length],accent:['subtle','balanced','strong'][index%3]}}
      };
      const theme=generateTheme(manifest,recipes,config);
      assert.equal(Object.keys(theme.tokens.light).length,4028);
      assert.equal(Object.keys(theme.tokens.dark).length,4028);
      assert.equal((theme.css.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length,8060);
      assert.ok(!theme.css.includes('--_qxframe9a7c2-'));
      assert.ok(!theme.css.includes('!important'));
      assert.ok(!theme.css.includes('color-mix('));
      assert.ok(!theme.css.includes('contrast-color('));
      assert.ok(!theme.css.includes('.qxframe9a7c2-'));
      const hash=crypto.createHash('sha256').update(theme.css).digest('hex');
      assert.equal(hash,crypto.createHash('sha256').update(generateTheme(manifest,recipes,config).css).digest('hex'),'same matrix config must be deterministic');
      hashes.add(hash);
      seen.styles.add(config.style);seen.primaries.add(config.roles.primary);seen.bases.add(config.baseColor);seen.radii.add(config.radius);seen.densities.add(config.density);seen.charts.add(config.chart.preset);seen.menuColors.add(config.components.menu.color);seen.menuAppearances.add(config.components.menu.appearance);
      count+=1;
    }
  }
}
assert.equal(count,60);
assert.equal(hashes.size,60,'Representative matrix themes should be distinct.');
assert.equal(seen.styles.size,styles.length);
assert.equal(seen.primaries.size,primaries.length);
assert.equal(seen.bases.size,bases.length);
assert.equal(seen.radii.size,radii.length);
assert.equal(seen.densities.size,densities.length);
assert.equal(seen.charts.size,charts.length);
assert.equal(seen.menuColors.size,menuColors.length);
assert.equal(seen.menuAppearances.size,menuAppearances.length);

console.log(JSON.stringify({
  phase:'TG-I-regression-matrix',
  themes:count,
  styleCoverage:[...seen.styles],
  primaryCoverage:[...seen.primaries],
  baseCoverage:[...seen.bases],
  radiusCoverage:[...seen.radii],
  densityCoverage:[...seen.densities],
  chartCoverage:[...seen.charts],
  menuColorCoverage:[...seen.menuColors],
  menuAppearanceCoverage:[...seen.menuAppearances],
  lightDarkEveryTheme:true,
  deterministic:true
}));
