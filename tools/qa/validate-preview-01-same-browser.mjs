// Validate that both pinned source and QX were measured in one Chromium run.
// V3 explicitly excludes typography wrapping from hard geometry acceptance;
// keep height differences visible as diagnostics instead of making a fake pass.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.join(root,'tools/qa/reports/stage-3/preview-01');
const report=JSON.parse(fs.readFileSync(path.join(dir,'report.json'),'utf8'));
const source='295a1f114a138f23b5dfee0e0c6812394dfeb90c';
const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
const modes=['light','dark'];
assert.equal(report.source,source,'shadcn source must remain SHA locked');
assert.equal(report.rows.length,528,'measure 33 source examples x 8 styles x 2 modes');
assert.deepEqual(report.errors,[],'both pages must render without errors');
const seen=new Set();
const missing=[],geometry=[],heights=[],byStyle={};
for(const row of report.rows){
  assert.ok(styles.includes(row.style),'style must match pinned gallery');
  assert.ok(modes.includes(row.mode),'mode must match pinned gallery');
  const key=[row.style,row.mode,row.card].join('/');
  assert.ok(!seen.has(key),'duplicate reference card: '+key);
  seen.add(key);
  if(!row.reference||!row.actual||row.differences.includes('missing-card')) {
    missing.push(key);continue;
  }
  if(row.differences.length) geometry.push({key,differences:row.differences});
  const delta=row.actual.height-row.reference.height;
  assert.ok(Number.isFinite(delta),'finite same-browser height required: '+key);
  if(Math.abs(delta)>.5)heights.push({key,reference:row.reference.height,actual:row.actual.height,delta:+delta.toFixed(3)});
  const group=byStyle[row.style] ||= {renders:0,overTolerance:0};
  group.renders++;
  if(Math.abs(delta)>.5)group.overTolerance++;
}
assert.equal(seen.size,528,'every style/mode/card must be unique');
const ranked=heights.slice().sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
const summary={
  source,comparison:'same Chromium process and the same forced system-ui font',
  important:'Width/text-wrap and height diagnostics are not V3 visual acceptance. Only the four pinned Card subset properties are checked.',
  renders:report.rows.length,missing:missing.length,geometrySubsetMismatches:geometry.length,
  heightDiagnosticsOverPointFive:heights.length,
  byStyle,topHeightDifferences:ranked.slice(0,24),
  novaLight:heights.filter(x=>x.key.startsWith('nova/light/')).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,20)
};
fs.writeFileSync(path.join(dir,'same-browser-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('[stage3-same-browser] '+JSON.stringify(summary));
assert.equal(missing.length,0,'missing pinned source or QX card is a QA error');
assert.equal(geometry.length,0,'source-locked Card subset radius/title geometry regressed');
