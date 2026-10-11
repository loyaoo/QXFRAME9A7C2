// Stage 4: same-browser pinned source Preview versus QX Preview 02.
// Strictly inventories all 31 QX Cards and records source/QX nested values.
// Height/text wrapping and non-comparable stub content remain diagnostics, not passes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compileTheme, normalizeConfig } from '../../docs/create/model.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(process.env.QA_NODE_MODULES
  ? path.join(process.env.QA_NODE_MODULES,'qa.cjs')
  : new URL('./ref/package.json',import.meta.url));
const {chromium}=require('playwright');
const expected=JSON.parse("[\"style-overview\",\"typography-specimen\",\"codespaces-card\",\"invoice\",\"icon-preview-grid\",\"ui-elements\",\"observability-card\",\"shipping-address\",\"environment-variables\",\"bar-chart-card\",\"invite-team\",\"activate-agent-dialog\",\"skeleton-loading\",\"pie-chart-card\",\"no-team-members\",\"report-bug\",\"contributors\",\"feedback-form\",\"book-appointment\",\"sleep-report\",\"github-profile\",\"weekly-fitness-summary\",\"file-upload\",\"analytics-card\",\"usage-card\",\"shortcuts\",\"anomaly-alert\",\"live-waveform\",\"visitors\",\"contributions-activity\",\"not-found\"]");
const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
const output=path.join(root,'tools/qa/reports/stage-4/preview-02');
fs.mkdirSync(output,{recursive:true});
const html=fs.readFileSync(path.join(root,'docs/create/preview-02.html'),'utf8');
const actualMarkers=[...html.matchAll(/<!-- @card ([a-z0-9-]+) -->/g)].map(m=>m[1]);
assert.deepEqual(actualMarkers,expected,'31 source-mapped QX Preview 02 Cards retained, in pinned order');
assert.deepEqual([...html.matchAll(/<!-- @end ([a-z0-9-]+) -->/g)].map(m=>m[1]),expected,
  'each Stage4 Card marker has a matching end marker');

const server=http.createServer((req,res)=>{
  try{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      res.writeHead(404).end();return;
    }
    res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch(e){res.writeHead(400).end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN}:{})});
const rows=[],errors=[],sourceOnly=new Set(),qxOnly=new Set();

async function sample(page,source){
  return page.evaluate(source=>{
    const identifier=source?'data-qa-card':'data-card';
    const groups=[...document.querySelectorAll('['+identifier+']')]
      .filter(el=>source||!el.parentElement.closest('[data-card]'));
    const pair=source
      ?{title:'[data-slot="card-title"]',header:'[data-slot="card-header"]',content:'[data-slot="card-content"]',footer:'[data-slot="card-footer"]',button:'[data-slot="button"]',field:'[data-slot="field"]',item:'[data-slot="item"]'}
      :{title:'.qxframe9a7c2-card-title',header:'.qxframe9a7c2-card-header',content:'.qxframe9a7c2-card-content',footer:'.qxframe9a7c2-card-footer',button:'.qxframe9a7c2-button',field:'.qxframe9a7c2-form-field',item:'.qxframe9a7c2-item'};
    const measure=el=>{
      if(!el)return null;
      const rect=el.getBoundingClientRect(),st=getComputedStyle(el);
      return {x:rect.x,y:rect.y,w:rect.width,h:rect.height,radius:st.borderTopLeftRadius,
        fontSize:st.fontSize,lineHeight:st.lineHeight,paddingTop:st.paddingTop,
        paddingBottom:st.paddingBottom,paddingLeft:st.paddingLeft,
        background:st.backgroundColor,color:st.color};
    };
    const data={};
    for(const group of groups){
      const id=group.getAttribute(identifier);
      const card=source||group.classList.contains('qxframe9a7c2-card')
        ?group:group.querySelector('.qxframe9a7c2-card');
      if(!id||!card||data[id])continue;
      data[id]={outer:measure(card),roles:Object.fromEntries(Object.entries(pair)
        .map(([name,sel])=>[name,measure(card.querySelector(sel))]))};
    }
    return data;
  },source);
}

try {
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js',
    route=>route.fulfill({path:path.join(root,'dist/qxframe9a7c2.js'),contentType:'text/javascript'}));
  await page.route('**/*',route=>route.request().url().startsWith(origin)||
    route.request().url().endsWith('/dist/qxframe9a7c2.js')?route.fallback():route.abort());
  for(const style of styles)for(const dark of [false,true]){
    const mode=dark?'dark':'light';
    await page.goto(origin+'/tools/qa/ref/dist/index.html?item=preview&style='+style+(dark?'&dark=1':''));
    await page.waitForSelector('[data-qa-card]',{timeout:15000});
    await page.addStyleTag({content:'*{content-visibility:visible!important;animation:none!important;transition:none!important}body,body *{font-family:system-ui,sans-serif!important}'});
    await page.waitForTimeout(350);
    const reference=await sample(page,true);
    if(style==='nova')await page.screenshot({path:path.join(output,style+'-'+mode+'-reference.png'),fullPage:true});
    await page.goto(origin+'/docs/create/preview-02.html');
    await page.waitForSelector('[data-card="github-profile"]',{timeout:15000});
    await page.addStyleTag({content:compileTheme(normalizeConfig({style})).css});
    await page.evaluate(({style,dark})=>{
      document.documentElement.dataset.createStyle=style;
      document.documentElement.classList.toggle('dark',dark);
    },{style,dark});
    await page.addStyleTag({content:'*{animation:none!important;transition:none!important}body,body *{font-family:system-ui,sans-serif!important}'});
    await page.waitForTimeout(350);
    const actual=await sample(page,false);
    assert.deepEqual(Object.keys(actual).sort(),expected.slice().sort(),
      'Preview 02 card IDs and wrappers must survive Theme '+style+'/'+mode);
    if(style==='nova')await page.screenshot({path:path.join(output,style+'-'+mode+'-qx.png'),fullPage:true});
    for(const id of expected){
      const source=reference[id],qx=actual[id];
      if(!source)qxOnly.add(id);
      if(source&&!qx)sourceOnly.add(id);
      const differences=[];
      if(source&&qx)for(const name of ['w','h','radius','fontSize','paddingTop','paddingBottom','paddingLeft']){
        const a=source.outer[name],b=qx.outer[name],an=parseFloat(a),bn=parseFloat(b);
        if(Number.isFinite(an)&&Number.isFinite(bn)&&Math.abs(an-bn)>.5)
          differences.push({name,source:a,qx:b,delta:Math.round((bn-an)*100)/100});
      }
      rows.push({style,mode,card:id,source:source||null,qx:qx||null,differences});
    }
    console.log('[stage4-preview02] '+JSON.stringify({style,mode,referenceCount:Object.keys(reference).length,
      mapped:expected.filter(id=>reference[id]).length,diagnostics:rows.slice(-31).filter(r=>r.differences.length).length}));
  }
  assert.equal(rows.length,496,'31 cards x 8 styles x 2 modes');
  assert.ok(rows.filter(row=>row.source&&row.qx).length>0,'pinned Preview reference must render matching source groups');
  assert.deepEqual(errors,[],'Stage4 source/QX pages must not throw');
  const summary={source:'295a1f114a138f23b5dfee0e0c6812394dfeb90c',
    status:'diagnostic baseline; no unproven visual parity claimed',cards:31,renders:496,
    mapped:rows.filter(row=>row.source&&row.qx).length,
    sourceIdsAbsent:[...qxOnly],qxIdsAbsent:[...sourceOnly],
    withOuterGeometryDifferences:rows.filter(row=>row.differences.length).length,errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...summary,rows},null,2));
  console.log('[stage4-preview02-report] '+JSON.stringify(summary));
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
