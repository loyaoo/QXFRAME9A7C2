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
const roleNames=['header','content','footer','item','button','badge','field','title','description','tab'];
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

// Source-paired small Button glyph+label typography; unlike the generic QX
// five-size curve, pinned shadcn size=sm/icon-sm does not always shrink text.
// All sampled buttons are the first small action for these 7 source Cards,
// including two intrinsic-width outline actions and five icon-only headers.
const smallButtonCards=['dividend-income','payout-threshold','preferences',
  'savings-targets','recent-transactions','transfer-funds','receiving-method'];
const smallButtonCounts={},smallButtonIssues=[];
for(const row of nested.rows){
  if(!smallButtonCards.includes(row.card))continue;
  smallButtonCounts[row.card]=(smallButtonCounts[row.card]||0)+1;
  const a=row.source?.button,b=row.qx?.button;
  if(!a||!b){smallButtonIssues.push({card:row.card,style:row.style,mode:row.mode,reason:'missing button'});continue;}
  // Compare the type scale in pixels, and source-driven intrinsic width for
  // the two text actions. Square icon-sm buttons keep their prior width.
  for(const prop of row.card==='savings-targets'||row.card==='recent-transactions'
    ? ['fontSize','fontWeight','w','h'] : ['fontSize','fontWeight','w','h']){
    const x=parseFloat(a[prop]),y=parseFloat(b[prop]);
    if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-y)>.5)
      smallButtonIssues.push({card:row.card,style:row.style,mode:row.mode,prop,source:a[prop],qx:b[prop]});
  }
}
for(const card of smallButtonCards)assert.equal(smallButtonCounts[card],16,'small Button source sample missing '+card);
assert.deepEqual(smallButtonIssues,[],'source-pinned small Button type/width geometry mismatch: '+JSON.stringify(smallButtonIssues.slice(0,22)));
console.log('[stage3-small-button-parity] '+JSON.stringify({cards:smallButtonCards,count:112,checks:448,issues:smallButtonIssues.length}));

// Every source/QX first Button in these 19 Card groups is the same
// control, verified by text/role. Upcoming Payments is deliberately NOT
// equivalent: source's first Button is a DayPicker day 27, while QX's
// first Button is the Calendar navigation control. Comparing those would
// create a fake palette/weight failure.
const matchedButtonCards=[
 'account-access','contribution-history','cover-art','dividend-income',
 'empty-connect-bank','empty-distribute-track','empty-explore-catalog',
 'faq','new-milestone','notification-settings','payout-threshold',
 'preferences','qr-connect','receiving-method','recent-transactions',
 'savings-targets','social-links','syncing-state','transfer-funds'
];
const matchedButtonErrors=[], matchedButtonCounts={};
for(const row of nested.rows){
  if(!matchedButtonCards.includes(row.card))continue;
  const src=row.source?.button, qx=row.qx?.button;
  if(!src||!qx){matchedButtonErrors.push({card:row.card,style:row.style,mode:row.mode,error:'missing paired first Button'});continue;}
  matchedButtonCounts[row.card]=(matchedButtonCounts[row.card]||0)+1;
  if(src.text!==qx.text)matchedButtonErrors.push({card:row.card,style:row.style,mode:row.mode,error:'source/QX first Button represents a different control',source:src.text,qx:qx.text});
  for(const prop of ['w','h','fontSize','fontWeight']){
    const x=parseFloat(src[prop]),y=parseFloat(qx[prop]);
    if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-y)>.5)
      matchedButtonErrors.push({card:row.card,style:row.style,mode:row.mode,prop,source:src[prop],qx:qx[prop]});
  }
  for(const channel of ['fg','bg']){
    const x=src.buttonPaint?.[channel],y=qx.buttonPaint?.[channel];
    if(!x||!y||x.length!==4||y.length!==4||x.some((value,i)=>Math.abs(value-y[i])>2))
      matchedButtonErrors.push({card:row.card,style:row.style,mode:row.mode,channel,source:x,qx:y});
  }
}
for(const card of matchedButtonCards)assert.equal(matchedButtonCounts[card],16,'same Chromium source/Button roles required for every style/mode '+card);
assert.deepEqual(matchedButtonErrors,[],'source-matched Button paint/type/geometry divergence: '+JSON.stringify(matchedButtonErrors.slice(0,32)));
console.log('[stage3-first-button-parity] '+JSON.stringify({cards:matchedButtonCards.length,pairs:304,propertyChannels:['w','h','fontSize','fontWeight','fg','bg'],errors:matchedButtonErrors.length}));

// Source-equivalent text elements, not their structurally different Card
// wrapper padding, determine real inside-Card typographic parity. Assert
// actual screen positions and foreground RGBA for EVERY available matched
// Title/Description across all eight styles and both color modes.
const typographyCounts={title:0,description:0}, typographyErrors=[];
for(const row of nested.rows){
  for(const role of ['title','description']){
    const a=row.source[role], b=row.qx[role];
    if(!a&&!b)continue;
    if(!a||!b){typographyErrors.push({card:row.card,style:row.style,mode:row.mode,role,reason:'missing matched role'});continue;}
    typographyCounts[role]++;
    if(a.text!==b.text)typographyErrors.push({card:row.card,role,style:row.style,mode:row.mode,property:'text',source:a.text,qx:b.text});
    for(const property of ['x','y','fontSize','fontWeight']){
      const x=parseFloat(a[property]),y=parseFloat(b[property]);
      if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-y)>.5)
        typographyErrors.push({card:row.card,style:row.style,mode:row.mode,role,property,source:a[property],qx:b[property]});
    }
    const x=a.rolePaint?.fg,y=b.rolePaint?.fg;
    if(!x||!y||x.length!==4||y.length!==4||x.some((v,i)=>Math.abs(v-y[i])>2))
      typographyErrors.push({card:row.card,style:row.style,mode:row.mode,role,property:'fg',source:x,qx:y});
  }
}
assert.ok(typographyCounts.title>=200&&typographyCounts.description>=160,
  'source/QX text elements must be meaningfully present across the 16 themes '+JSON.stringify(typographyCounts));
assert.deepEqual(typographyErrors,[],
  'source-paired inner Card title/description mismatch: '+JSON.stringify(typographyErrors.slice(0,32)));
console.log('[stage3-inner-typography] '+JSON.stringify({pairs:typographyCounts,checks:(typographyCounts.title+typographyCounts.description)*6,errors:typographyErrors.length}));

// Pinned shadcn tabs.tsx sets active:bg-background, and dark overrides
// to input/30 plus border-input. Compare normalized RGBA, not raw color
// serialization, and require every light/dark Style in the FAQ sample.
const activeTabIssues=[], activeTabCounts={};
for(const row of nested.rows){
  if(row.card!=='faq')continue;
  const a=row.source.tab,b=row.qx.tab;
  activeTabCounts[row.style+'/'+row.mode]=(activeTabCounts[row.style+'/'+row.mode]||0)+1;
  if(!a||!b){activeTabIssues.push({style:row.style,mode:row.mode,reason:'missing active tab'});continue;}
  if(a.text!==b.text)activeTabIssues.push({style:row.style,mode:row.mode,reason:'tab label differs',source:a.text,qx:b.text});
  for(const property of ['bg','fg','border']){
    const x=a.rolePaint?.[property],y=b.rolePaint?.[property];
    if(!x||!y||x.length!==4||y.length!==4||x.some((v,i)=>Math.abs(v-y[i])>2))
      activeTabIssues.push({style:row.style,mode:row.mode,property,source:x,qx:y});
  }
}
assert.equal(Object.keys(activeTabCounts).length,16,'16 active FAQ Tabs source/style variants');
assert.deepEqual(activeTabIssues,[],'source-paired active FAQ tab paint mismatches: '+JSON.stringify(activeTabIssues));
console.log('[stage3-active-tab-parity] '+JSON.stringify({variants:16,channels:48,errors:activeTabIssues.length}));

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
