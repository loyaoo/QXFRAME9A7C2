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
const nested=JSON.parse(fs.readFileSync(path.join(dir,'inner-roles.json'),'utf8'));
assert.equal(nested.source,'295a1f114a138f23b5dfee0e0c6812394dfeb90c','nested audit locked to same pinned source');
assert.equal(nested.rows.length,528,'all 33 Card groups x 8 styles x 2 modes require nested samples');
const nestedKeys=new Set(nested.rows.map(r=>[r.style,r.mode,r.card].join('/')));
assert.equal(nestedKeys.size,528,'unique source/QX nested role samples in each style/mode');
const nestedAbsent=nested.rows.filter(r=>!r.source||!r.qx);
assert.deepEqual(nestedAbsent.map(r=>[r.style,r.mode,r.card]),[],'nested Card group missing');
const roleNames=['header','content','footer','item','button','badge','field'];
const observedRoles=nested.rows.reduce((acc,r)=>{
  for(const name of roleNames) if(r.source[name]&&r.qx[name])acc[name]=(acc[name]||0)+1;
  return acc;
},{});
assert.ok((observedRoles.header||0)>=300,'pinned Header inner visuals sampled for >=300 source QX cases');
assert.ok((observedRoles.content||0)>=400,'pinned Content inner visuals sampled for >400 source QX cases');
assert.ok((observedRoles.button||0)>=180,'source/QX Button paints sampled across 16 themes');
console.log('[stage3-nested-role-coverage] '+JSON.stringify({renders:nested.rows.length,observedRoles,missing:nestedAbsent.length,cardCount:new Set(nested.rows.map(r=>r.card)).size}));

const innerPaintIssues=[],innerGeometryIssues=[];
const normalizeColor=value=>String(value||'').replace(/\\s+/g,' ').trim();
for(const row of nested.rows){
  for(const role of roleNames){
    const x=row.source[role],y=row.qx[role];
    if(!x||!y)continue;
    for(const prop of ['w','h','padTop','padLeft','fontSize','radius']){
      const ax=parseFloat(x[prop]),by=parseFloat(y[prop]);
      if(Number.isFinite(ax)&&Number.isFinite(by)&&Math.abs(ax-by)>.5)
        innerGeometryIssues.push({style:row.style,mode:row.mode,card:row.card,role,prop,source:x[prop],qx:y[prop]});
    }
    for(const prop of ['color','background']){
      // CSS computed colors may use equivalent distinct coordinate spaces;
      // a raw string mismatch is diagnostic, not an asserted color delta.
      if(normalizeColor(x[prop])!==normalizeColor(y[prop]))
        innerPaintIssues.push({style:row.style,mode:row.mode,card:row.card,role,prop,source:x[prop],qx:y[prop]});
    }
  }
}
// Source-lock the nested Badge contract separately from non-comparable
// Card wrapper geometry. All measured variants use the same semantic label
// sizing recipe (including Mira 10px and Sera editorial compact shape).
// Equivalent QX and pinned-source Item and Field primitives must match in
// their final screen coordinates, not merely in wrapper padding. These cover
// 11 Item-bearing + 9 Field-bearing Card groups throughout all 16 themes.
const structuralRoles=['item','field'],structuralCounts={},structuralErrors=[];
for(const row of nested.rows){
  for(const role of structuralRoles){
    const source=row.source[role],actual=row.qx[role];
    // The QX composition has 32 extra Field wrapper samples absent from the
    // source primitive. Only actual source↔QX semantic pairs are comparable;
    // keep source-only or QX-only wrappers in the diagnostic role inventory.
    if(!source||!actual)continue;
    structuralCounts[role]=(structuralCounts[role]||0)+1;
    for(const property of ['x','y','w','h','fontSize','fontWeight','radius']){
      const a=parseFloat(source[property]),b=parseFloat(actual[property]);
      if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>.5)
        structuralErrors.push({style:row.style,mode:row.mode,card:row.card,role,property,source:source[property],qx:actual[property]});
    }
  }
}
assert.equal(structuralCounts.item,176,'11 source Item Card groups × 16 theme variants');
assert.equal(structuralCounts.field,128,'8 source Field Card groups × 16 theme variants');
assert.deepEqual(structuralErrors,[],'source-paired nested Item/Field visual geometry differs: '+JSON.stringify(structuralErrors.slice(0,24)));
console.log('[stage3-nested-strict-parity] '+JSON.stringify({roles:structuralRoles,item:structuralCounts.item,field:structuralCounts.field,assertions:304*7,errors:structuralErrors.length}));

const badgeCards=['claimable-balance','front-door','release-catalog','upcoming-payments'];
const badgeFailures=[],badgeCounts={};
for(const row of nested.rows){
  if(!badgeCards.includes(row.card))continue;
  const src=row.source.badge,qx=row.qx.badge,key=row.card;
  badgeCounts[key]=(badgeCounts[key]||0)+1;
  if(!src||!qx){badgeFailures.push({key,style:row.style,mode:row.mode,issue:'missing badge'});continue;}
  for(const channel of ['bg','fg']){
    const a=src.badgePaint?.[channel],b=qx.badgePaint?.[channel];
    if(!a||!b||a.length!==4||b.length!==4||a.some((value,i)=>Math.abs(value-b[i])>2))
      badgeFailures.push({key,style:row.style,mode:row.mode,channel,source:a,qx:b});
  }
  for(const prop of ['w','h','fontSize','fontWeight']){
    const a=parseFloat(src[prop]),b=parseFloat(qx[prop]);
    if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>.5)
      badgeFailures.push({key,style:row.style,mode:row.mode,prop,source:src[prop],qx:qx[prop]});
  }
}
for(const card of badgeCards)
  assert.equal(badgeCounts[card],16,'Badge sampled in all 8 source styles x light/dark: '+card);
assert.deepEqual(badgeFailures,[],'source-locked Badge label geometry mismatch: '+JSON.stringify(badgeFailures.slice(0,24)));
console.log('[stage3-badge-parity] '+JSON.stringify({cards:badgeCards,checked:64,properties:6,issues:badgeFailures.length}));

console.log('[stage3-inner-differences] '+JSON.stringify({
 geometryCount:innerGeometryIssues.length,paintCount:innerPaintIssues.length,
 geometryExamples:innerGeometryIssues.slice(0,36),paintExamples:innerPaintIssues.slice(0,24),
 note:'diagnostic until equivalent geometry and color-space normalization is established; not a pixel parity pass'}));


const source='295a1f114a138f23b5dfee0e0c6812394dfeb90c';
const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
const modes=['light','dark'];
assert.equal(report.source,source,'shadcn source must remain SHA locked');
assert.equal(report.rows.length,528,'measure 33 source examples x 8 styles x 2 modes');
assert.deepEqual(report.errors,[],'both pages must render without errors');
const seen=new Set();
const missing=[],geometry=[],authorizedRadiusCaps=[],heights=[],byStyle={};
for(const row of report.rows){
  assert.ok(styles.includes(row.style),'style must match pinned gallery');
  assert.ok(modes.includes(row.mode),'mode must match pinned gallery');
  const key=[row.style,row.mode,row.card].join('/');
  assert.ok(!seen.has(key),'duplicate reference card: '+key);
  seen.add(key);
  if(!row.reference||!row.actual||row.differences.includes('missing-card')) {
    missing.push(key);continue;
  }
  if(row.differences.length) {
    // V3 §4.5 is higher authority than raw shadcn: all Card radii cap at 24px.
    // The pinned Luma source uses 26px. Protect this exact, explicit variance;
    // every non-Luma and every non-radius difference stays an actionable failure.
    if(row.style==='luma'&&row.differences.length===1&&row.differences[0]==='radius'
      &&Math.abs(row.reference.radius-26)<=.001&&Math.abs(row.actual.radius-24)<=.001) {
      authorizedRadiusCaps.push(key);
    } else geometry.push({key,differences:row.differences});
  }
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
  authorizedV3LumaCardRadiusCap24:authorizedRadiusCaps.length,
  heightDiagnosticsOverPointFive:heights.length,
  byStyle,topHeightDifferences:ranked.slice(0,24),
  novaLight:heights.filter(x=>x.key.startsWith('nova/light/')).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,20)
};
fs.writeFileSync(path.join(dir,'same-browser-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('[stage3-same-browser] '+JSON.stringify(summary));
assert.equal(missing.length,0,'missing pinned source or QX card is a QA error');
assert.equal(authorizedRadiusCaps.length,66,'V3 Card radius cap 24px must hold for every Luma example in light/dark');
assert.equal(geometry.length,0,'unexpected source-locked Card subset geometry regression');
