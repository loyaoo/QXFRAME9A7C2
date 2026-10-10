// Inventory and same-font measurements. This reports mismatches; it does not
// declare per-card parity from the shared Card regression alone.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { compileTheme, normalizeConfig } from '../../docs/create/model.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(process.env.QA_NODE_MODULES ? path.join(process.env.QA_NODE_MODULES, 'qa.cjs') : new URL('./ref/package.json', import.meta.url));
const { chromium } = require('playwright');
const out = path.join(root, 'tools/qa/reports/stage-3/preview-01');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN } : {}) });
const rows = [], errors = [], innerRows = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js', route => route.fulfill({ path: path.join(root, 'dist/qxframe9a7c2.js'), contentType: 'text/javascript' }));
  await page.route('**/*', route => route.request().url().startsWith(origin) || route.request().url().endsWith('/dist/qxframe9a7c2.js') ? route.fallback() : route.abort());
  const measure = async ref => page.evaluate(ref => {
    const selector = ref ? '[data-qa-card]' : '[data-card]';
    return Object.fromEntries([...document.querySelectorAll(selector)].filter(el => ref || (el.dataset.card && !el.parentElement.closest('[data-card]'))).map(group => {
      const card = ref || group.classList.contains('qxframe9a7c2-card') ? group : group.querySelector('.qxframe9a7c2-card');
      const cs = getComputedStyle(card), box = card.getBoundingClientRect();
      const title = card.querySelector(ref ? '[data-slot="card-title"]' : '.qxframe9a7c2-card-title');
      const footer = card.querySelector(ref ? '[data-slot="card-footer"]' : '.qxframe9a7c2-card-footer');
      const titleStyle = title && getComputedStyle(title);
      return [group.getAttribute(ref ? 'data-qa-card' : 'data-card'), {
        width: box.width, height: box.height, radius: parseFloat(cs.borderTopLeftRadius),
        titleSize: title ? parseFloat(titleStyle.fontSize) : null,
        titleInset: title ? title.getBoundingClientRect().left - box.left : null,
        titleTop: title ? title.getBoundingClientRect().top - box.top : null,
        footer: footer ? { color: getComputedStyle(footer).backgroundColor, top: parseFloat(getComputedStyle(footer).paddingTop), border: parseFloat(getComputedStyle(footer).borderTopWidth) } : null,
      }];
    }));
  }, ref);
  // Source-first nested visual sampling across ALL 33 card groups and all
  // 16 style/mode pairs. This is deliberately separate from the earlier
  // four-property Card gate: no first-Card-height pass substitutes for
  // inner Header/Content/Footer/Item/Badge/Button parity.
  const measureInner = async source => page.evaluate(source => {
    const marker=source?'data-qa-card':'data-card';
    const roles={
      header:source?'[data-slot="card-header"]':'.qxframe9a7c2-card-header',
      content:source?'[data-slot="card-content"]':'.qxframe9a7c2-card-content',
      footer:source?'[data-slot="card-footer"]':'.qxframe9a7c2-card-footer',
      item:source?'[data-slot="item"]':'.qxframe9a7c2-item',
      button:source?'[data-slot="button"]':'.qxframe9a7c2-button',
      badge:source?'[data-slot="badge"]':'.qxframe9a7c2-badge',
      field:source?'[data-slot="field"]':'.qxframe9a7c2-form-field'
    };
    // Canvas normalizes equivalent oklch/oklab/rgba authoring into one
    // sRGB pixel representation. Compare composited Badge paint, not CSS
    // serialization strings; alpha is kept for soft destructive variants.
    const swatch=document.createElement('canvas');
    swatch.width=swatch.height=1;
    const pixel=swatch.getContext('2d',{willReadFrequently:true});
    const rgba=value=>{
      pixel.clearRect(0,0,1,1);
      pixel.fillStyle=value;
      pixel.fillRect(0,0,1,1);
      return Array.from(pixel.getImageData(0,0,1,1).data);
    };
    const record=e=>{
      if(!e)return null;
      const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
      const badgePaint=e.matches('[data-slot="badge"],.qxframe9a7c2-badge') ?
        {bg:rgba(cs.backgroundColor),fg:rgba(cs.color),border:rgba(cs.borderTopColor)} : null;
      const buttonPaint=e.matches('[data-slot="button"],.qxframe9a7c2-button') ?
        {bg:rgba(cs.backgroundColor),fg:rgba(cs.color),border:rgba(cs.borderTopColor)} : null;
      return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2),
        color:cs.color,background:cs.backgroundColor,borderColor:cs.borderTopColor,
        padTop:cs.paddingTop,padBottom:cs.paddingBottom,padLeft:cs.paddingLeft,
        fontSize:cs.fontSize,fontWeight:cs.fontWeight,radius:cs.borderTopLeftRadius,
        badgePaint,buttonPaint,
        text:(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,64)};
    };
    return Object.fromEntries([...document.querySelectorAll('['+marker+']')]
      .filter(el=>source||el.dataset.card&&!el.parentElement.closest('[data-card]'))
      .map(group=>[group.getAttribute(marker),Object.fromEntries(
         Object.entries(roles).map(([role,sel])=>[role,record(group.querySelector(sel))]))]));
  },source);
  const socialPeerProbe=async source=>page.evaluate(source=>{
    const footer=document.querySelector(source?'[data-qa-card="social-links"] [data-slot="card-footer"]':'[data-card="social-links"] .qxframe9a7c2-card-footer');
    if(!footer)return {missing:true};
    const cs=getComputedStyle(footer),box=footer.getBoundingClientRect();
    const snap=el=>{const st=getComputedStyle(el),r=el.getBoundingClientRect();return {
      text:el.textContent.trim(),className:el.className,x:+r.x.toFixed(3),w:+r.width.toFixed(3),
      flex:st.flex,flexGrow:st.flexGrow,flexShrink:st.flexShrink,flexBasis:st.flexBasis,minWidth:st.minWidth,
      paddingInline:st.paddingInline,marginInline:st.marginInline,
      fontFamily:st.fontFamily,fontSize:st.fontSize,fontWeight:st.fontWeight,
      letterSpacing:st.letterSpacing,textTransform:st.textTransform
    }};
    return {footer:{x:box.x,w:box.width,gap:cs.gap,padLeft:cs.paddingLeft,padRight:cs.paddingRight,justify:cs.justifyContent},buttons:[...footer.querySelectorAll('button')].map(snap)};
  },source);
  const nodeStructure = async (source, id) => page.evaluate(({source,id}) => {
    const root=document.querySelector(source ? '[data-qa-card="'+id+'"]' : '[data-card="'+id+'"]');
    if(!root)return [];
    const card=source||root.classList.contains('qxframe9a7c2-card')?root:root.querySelector('.qxframe9a7c2-card');
    const rect=card.getBoundingClientRect();
    return [card,...card.querySelectorAll('*')].filter(el=>{
      const cs=getComputedStyle(el);return cs.display!=='none'&&el.getBoundingClientRect().height>=2;
    }).slice(0,75).map((el,i)=>{
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {i,tag:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,90):'svg',
        text:el.children.length?undefined:(el.textContent||'').slice(0,38),
        x:+(r.left-rect.left).toFixed(2),y:+(r.top-rect.top).toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2),
        display:cs.display,gap:cs.rowGap,flex:cs.flex,wrap:cs.flexWrap,
        minWidth:cs.minWidth,minHeight:cs.minHeight,
        pt:cs.paddingTop,pb:cs.paddingBottom,pl:cs.paddingLeft,pr:cs.paddingRight,
        borderTop:cs.borderTopWidth,borderBottom:cs.borderBottomWidth,
        fs:cs.fontSize,lh:cs.lineHeight,transform:cs.textTransform,
        cssW:el.tagName.toLowerCase()==='svg'?parseFloat(cs.width):null,
        cssH:el.tagName.toLowerCase()==='svg'?parseFloat(cs.height):null};
    });
  },{source,id});
  const sourceStyleProbe=async (source,cardId)=>page.evaluate(({source,cardId})=>{
    const card=document.querySelector(source?'[data-qa-card="'+cardId+'"]':'[data-card="'+cardId+'"]');
    if(!card)return {missing:true};
    const root=card.getBoundingClientRect();
    const snapshot=(e)=>{if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect();return {
      tag:e.tagName.toLowerCase(),className:String(e.className).slice(0,110),text:(e.children.length?'':e.textContent||'').slice(0,48),
      x:+(r.x-root.x).toFixed(2),y:+(r.y-root.y).toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2),
      display:c.display,flex:c.flex,flexBasis:c.flexBasis,minWidth:c.minWidth,whiteSpace:c.whiteSpace,
      gap:c.gap,rowGap:c.rowGap,columnGap:c.columnGap,
      pt:c.paddingTop,pb:c.paddingBottom,pl:c.paddingLeft,pr:c.paddingRight,
      marginTop:c.marginTop,borderTop:c.borderTopWidth,borderBottom:c.borderBottomWidth,
      fontSize:c.fontSize,lineHeight:c.lineHeight,gridRows:c.gridTemplateRows};
    };
    if(cardId==='dividend-income'){
      const item=card.querySelector(source?'[data-slot="item-group"] > [data-slot="item"]':'.qxframe9a7c2-item-group > .qxframe9a7c2-item');
      const content=item?.querySelector(source?'[data-slot="item-content"]':'.qxframe9a7c2-item-content');
      return {firstItem:snapshot(item),children:[...item?.children||[]].map(snapshot),
        title:snapshot(content?.querySelector(source?'[data-slot="item-title"]':'.qxframe9a7c2-item-title')),
        description:snapshot(content?.querySelector(source?'[data-slot="item-description"]':'.qxframe9a7c2-item-desc'))};
    }
    const calendar=card.querySelector(source?'[data-slot="calendar"]':'.qxframe9a7c2-calendar');
    const pick=selectors=>{for(const selector of selectors){const el=calendar?.querySelector(selector);if(el)return el}return null};
    const cells=[...calendar?.querySelectorAll(source?'[data-day]':'.qxframe9a7c2-calendar-cell')||[]];
    const weekday=pick(source?['.rdp-weekday','th']:['.qxframe9a7c2-calendar-weekday']);
    const navigation=pick(source?['.rdp-nav','nav']:['.qxframe9a7c2-calendar-header']);
    const weeks=source?[...calendar?.querySelectorAll('.rdp-week')||[]]:[];
    return {calendar:snapshot(calendar),navigation:snapshot(navigation),
      weekday:snapshot(weekday),firstCell:snapshot(cells[0]),lastCell:snapshot(cells.at(-1)),
      cellsCount:cells.length,weekCount:weeks.length,weekdayCount:calendar?.querySelectorAll(source?'.rdp-weekday':'.qxframe9a7c2-calendar-weekday').length,
      item:snapshot(calendar?.closest(source?'[data-slot="item"]':'.qxframe9a7c2-item')),
      cellsLastSeven:cells.slice(-7).map(x=>({text:x.textContent.trim().slice(0,4),outside:source?x.closest('.rdp-outside')!==null:x.classList.contains('is-outside'),display:getComputedStyle(x).display})),
      calendarMarkup:calendar?.outerHTML.slice(0,650)};
  },{source,cardId});
  const sourceStyleProbes={};
  let novaCardStructures = {};
  // Focused structure evidence for unresolved Stage 3 cards, measured in the
  // same Chromium and font as the pinned upstream renderer.
  const targetCards={
    sera:['dividend-income','sidebar-nav','claimable-balance','faq','syncing-state','stock-performance','cover-art','payout-threshold','preferences','card-overview','index-investing','savings-targets','contribution-history','power-usage','notification-settings','receiving-method'],
    // Cross-style small Item regression discovered by full 528-run, not a single-style exception.
    vega:['dividend-income','claimable-balance','syncing-state','cover-art','kitchen-island','recent-transactions','savings-targets','card-overview','contribution-history','power-usage','notification-settings'],
    nova:['upcoming-payments','claimable-balance','syncing-state','recent-transactions','savings-targets','receiving-method','account-access','cover-art','contribution-history','power-usage','notification-settings','card-overview'],
    rhea:['faq','claimable-balance','kitchen-island','cover-art','power-usage','notification-settings','savings-targets'],maia:['dividend-income','faq','receiving-method','sidebar-nav','claimable-balance','syncing-state','recent-transactions','kitchen-island','savings-targets','cover-art','power-usage','notification-settings'],
    luma:['dividend-income','receiving-method','sidebar-nav','claimable-balance','syncing-state','kitchen-island','cover-art','power-usage','notification-settings','savings-targets'],
    lyra:['faq','claimable-balance','savings-targets','upcoming-payments','account-access','cover-art','dividend-income','kitchen-island','payments','power-usage','notification-settings','receiving-method'],mira:['upcoming-payments','claimable-balance','savings-targets','faq','receiving-method','account-access','cover-art','power-usage','notification-settings']
  };
  const sourceNodePairs={};
  // The first Overview card is stretched by its sibling in the pinned two-column
  // row. Compare BOTH siblings before attributing any row-height delta to Card A.
  const overviewPeers=async source=>page.evaluate(source=>{
    const first=document.querySelector(source?'[data-qa-card="card-overview"]':'[data-card="card-overview-a"]');
    if(!first)return null;
    return [...first.parentElement.children].slice(0,2).map((el,i)=>{
      const cs=getComputedStyle(el),box=el.getBoundingClientRect();
      const content=el.querySelector(source?'[data-slot="card-content"]':'.qxframe9a7c2-card-content');
      const button=el.querySelector('button');
      const describe=node=>{if(!node)return null;const style=getComputedStyle(node),rect=node.getBoundingClientRect();
        return {height:+rect.height.toFixed(3),pt:style.paddingTop,pb:style.paddingBottom,
          marginTop:style.marginTop,flex:style.flex,align:style.alignItems,justify:style.justifyContent,
          lineHeight:style.lineHeight,whiteSpace:style.whiteSpace}};
      return {i,height:+box.height.toFixed(3),gap:cs.gap,content:describe(content),
        button:describe(button),children:[...content?.children||[]].map(describe)};
    });
  },source);
  let sourceOverviewPeers=null;
  // Savings A can stretch to its sibling. Measure both before card fixes.
  const savingsPeers=async source=>page.evaluate(source=>{
    const first=document.querySelector(source?'[data-qa-card="savings-targets"]':'[data-card="savings-targets-a"]');
    if(!first)return null;
    const selectors=source?'[data-slot="card-header"],[data-slot="card-title"],[data-slot="card-description"],[data-slot="card-content"],[data-slot="card-footer"],[data-slot="field"],[data-slot="field-label"],[data-slot="button"],[data-slot="input-group"],[data-slot="native-select"]':'.qxframe9a7c2-card-header,.qxframe9a7c2-card-title,.qxframe9a7c2-card-description,.qxframe9a7c2-card-content,.qxframe9a7c2-card-footer,.qxframe9a7c2-form-field,.qxframe9a7c2-form-label,.qxframe9a7c2-button,.qxframe9a7c2-form-input-group,.qxframe9a7c2-form-select';
    return [...first.parentElement.children].filter(el=>el.getBoundingClientRect().width>100).slice(0,2).map(el=>{
      const r=el.getBoundingClientRect();
      return {h:+r.height.toFixed(3),w:+r.width.toFixed(3),
        children:[...el.querySelectorAll(selectors)].slice(0,35).map(node=>{
          const cs=getComputedStyle(node),box=node.getBoundingClientRect();
          return {className:String(node.className).slice(0,70),
            text:node.children.length?'':node.textContent?.trim().slice(0,50),
            h:+box.height.toFixed(3),w:+box.width.toFixed(3),
            lineHeight:cs.lineHeight,pt:cs.paddingTop,pb:cs.paddingBottom,gap:cs.gap};
        })
      };
    });
  },source);
  let sourceSavingsPeers=null;

  const loadingStructure = async source => page.evaluate(source => {
    const card = document.querySelector(source ? '[data-qa-card="loading-card"]' : '[data-card="loading-card"]');
    if (!card) return null;
    const root = card.getBoundingClientRect();
    return [card,...card.querySelectorAll('header,div,footer')].slice(0,23).map((el,i)=>{
      const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
      return {i,className:String(el.className).slice(0,100),
        top:+(rect.top-root.top).toFixed(2),height:+rect.height.toFixed(2),
        gap:css.rowGap,paddingTop:css.paddingTop,paddingBottom:css.paddingBottom,
        display:css.display,flex:css.flexDirection};
    });
  },source);
  let novaLoadingSource = null;
  for (const style of (process.env.QA_STYLE ? [process.env.QA_STYLE] : ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'])) {
    for (const dark of [false, true]) {
      const key = style + (dark ? '-dark' : '');
      await page.goto(`${origin}/tools/qa/ref/dist/index.html?item=preview-02&style=${style}${dark ? '&dark=1' : ''}`);
      await page.waitForSelector('[data-qa-card="contribution-history"]');
      // Source content-visibility is a performance optimization. Force all cards
      // to lay out so offscreen columns are measured rather than estimated.
      await page.addStyleTag({ content: '*{content-visibility:visible}body,body *{font-family:system-ui,sans-serif!important}*{animation:none!important;transition:none!important}' });
      await page.waitForTimeout(350);
      const reference = await measure(true);
      const sourceInner=await measureInner(true);
      const sourcePeer=style==='sera'?await socialPeerProbe(true):null;
      if(style==='sera'&&!dark)sourceOverviewPeers=await overviewPeers(true);
      // Measure both siblings in every style/mode. The first Card alone does not
      // characterize the Buy Investment Card beside it.
      sourceSavingsPeers=await savingsPeers(true);
      if(style==='nova'&&!dark) for(const id of ['payout-threshold','claimable-balance']) novaCardStructures[id]={source:await nodeStructure(true,id)};
      if(!dark) for(const id of targetCards[style]||[])
        sourceNodePairs[style+'/'+id]={source:await nodeStructure(true,id)};
      if(!dark && ['sera','mira','nova','lyra'].includes(style))
        for(const id of (style==='sera'?['dividend-income']:['upcoming-payments']))
          sourceStyleProbes[style+'/'+id]={source:await sourceStyleProbe(true,id)};


      if(style==='nova'&&!dark) novaLoadingSource=await loadingStructure(true);
      if (style === 'nova') await page.screenshot({ path: path.join(out, key + '-reference.png'), fullPage: true });
      await page.goto(`${origin}/docs/create/preview-01.html`);
      await page.waitForSelector('[data-card="contribution-history"]');
      await page.addStyleTag({ content: compileTheme(normalizeConfig({ style })).css });
      await page.evaluate(({ style, dark }) => { document.documentElement.dataset.createStyle = style; document.documentElement.classList.toggle('dark', dark); }, { style, dark });
      await page.addStyleTag({ content: 'body,body *{font-family:system-ui,sans-serif!important}*{animation:none!important;transition:none!important}' });
      await page.waitForTimeout(350);
      const actual = await measure(false);
      const actualInner=await measureInner(false);
      if(style==='sera'){
        const qxPeer=await socialPeerProbe(false);
        const problems=[];
        if(sourcePeer?.buttons?.length!==2||qxPeer?.buttons?.length!==2)
          problems.push({issue:'two source/QX footer actions required'});
        else for(let i=0;i<2;i++){
          const src=sourcePeer.buttons[i],qx=qxPeer.buttons[i];
          if(src.text!==qx.text)problems.push({i,text:[src.text,qx.text]});
          for(const prop of ['x','w','fontSize','fontWeight','letterSpacing']){
            const a=parseFloat(src[prop]),b=parseFloat(qx[prop]);
            if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>.5)
              problems.push({i,prop,source:src[prop],qx:qx[prop]});
          }
          for(const prop of ['flex','minWidth'])
            if(src[prop]!==qx[prop])problems.push({i,prop,source:src[prop],qx:qx[prop]});
        }
        console.log('[stage3-social-peer-deep] '+JSON.stringify({style,mode:dark?'dark':'light',source:sourcePeer,qx:qxPeer,problems}));
        if(problems.length)throw new Error('Sera source-pinned BOTH CardFooter Buttons min-content Flex mismatch: '+JSON.stringify(problems));
      }
      if(style==='sera'&&!dark)console.log('[stage3-overview-row-sera] '+JSON.stringify({source:sourceOverviewPeers,qx:await overviewPeers(false)}));
      {
        const qxSavingsPeers=await savingsPeers(false);
        const src=sourceSavingsPeers,actual=qxSavingsPeers;
        if(!src||!actual||src.length!==2||actual.length!==2)
          throw new Error(style+' Savings two-column Card source/QX peer structures missing');
        const peers=src.map((card,i)=>({
          name:i===0?'Savings Targets':'Buy Investment',
          sourceHeight:card.h,qxHeight:actual[i].h,
          sourceWidth:card.w,qxWidth:actual[i].w,
          deltaHeight:+(actual[i].h-card.h).toFixed(3),
          deltaWidth:+(actual[i].w-card.w).toFixed(3)
        }));
        // Diagnostic only until the second Card is source-matched across styles.
        // Existing Sera and first-Card strict assertions remain unchanged.
        console.log('[stage3-savings-peer-geometry] '+JSON.stringify({style,dark,peers}));
        if(peers.some(row=>Math.abs(row.deltaHeight)>.5||Math.abs(row.deltaWidth)>.5))
          console.log('[stage3-savings-peer-subtree-diff] '+JSON.stringify({style,dark,source:src,qx:actual}));
        if(style==='sera'){
        const button=card=>card.children.find(n=>n.text==='New Goal'||n.className.includes('qxframe9a7c2-button is-default is-outlined'));
        const description=card=>card.children.find(n=>n.text==='Active milestones for 2024');
        if(!button(src[0])||!button(actual[0])||!description(src[0])||!description(actual[0])||
          Math.abs(button(src[0]).w-button(actual[0]).w)>.5||
          Math.abs(description(src[0]).h-description(actual[0]).h)>.5||
          src.some((card,i)=>Math.abs(card.h-actual[i].h)>.5))
          throw new Error('Sera Savings shared Button size-sm and two-column natural Card height differ: '+JSON.stringify({source:src,qx:actual}));
        if(!dark)console.log('[stage3-savings-row-sera] '+JSON.stringify({source:src,qx:actual}));
        }
      }
      if(style==='nova'&&!dark) for(const id of ['payout-threshold','claimable-balance']) {novaCardStructures[id].qx=await nodeStructure(false,id); console.log('[stage3-structure-'+id+'] '+JSON.stringify(novaCardStructures[id]));}
      if(!dark) for(const id of targetCards[style]||[]) {
        const record=sourceNodePairs[style+'/'+id];
        record.qx=await nodeStructure(false,id);
        if(id==='receiving-method'&&['maia','luma'].includes(style)){
          const srcRow=record.source.find(x=>x.tag==='label'&&x.h>70&&x.h<95&&x.w<200);
          const qxRow=record.qx.find(x=>x.className.includes('qxframe9a7c2-check-field is-choice'));
          if(!srcRow||!qxRow||Math.abs(srcRow.h-91.5)>.5||Math.abs(qxRow.h-srcRow.h)>.5)
            throw new Error(style+' source-locked RadioField row geometry mismatch: '+JSON.stringify({source:srcRow,qx:qxRow}));
        }
        if(id==='syncing-state'&&['vega','nova','maia','luma','sera'].includes(style)){
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' Syncing source-paired Card height mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
          // Both sides have a 16px glyph centered in a larger 32/40px media
          // surface. The QX spinner may rotate; transformed bounding width
          // varies by animation frame, so compare CSS geometry and centers.
          const sourceMedia=record.source.find(n=>n.className.includes('cn-empty-media'));
          const qxMedia=record.qx.find(n=>n.className.includes('qxframe9a7c2-empty-media'));
          const sourceGlyph=record.source.find(n=>n.tag==='svg');
          const qxGlyph=record.qx.find(n=>n.tag==='svg');
          if(!sourceMedia||!qxMedia||!sourceGlyph||!qxGlyph||
            Math.abs(sourceGlyph.cssW-16)>.5||Math.abs(sourceGlyph.cssH-16)>.5||
            Math.abs(qxGlyph.cssW-sourceGlyph.cssW)>.5||
            Math.abs(qxGlyph.cssH-sourceGlyph.cssH)>.5||
            Math.abs((qxGlyph.x+qxGlyph.w/2)-(sourceGlyph.x+sourceGlyph.w/2))>.5||
            Math.abs((qxGlyph.y+qxGlyph.h/2)-(sourceGlyph.y+sourceGlyph.h/2))>.5||
            Math.abs(qxMedia.w-sourceMedia.w)>.5||Math.abs(qxMedia.h-sourceMedia.h)>.5)
            throw new Error(style+' Syncing source-paired Empty icon glyph + media mismatch: '+JSON.stringify({sourceMedia,qxMedia,sourceGlyph,qxGlyph}));
        }
        if(id==='cover-art'){
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' CoverArt source Label/Footer line boxes mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        }
        if(['vega','maia','lyra','luma','sera','rhea'].includes(style)&&id==='kitchen-island'){
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' KitchenIsland Item/Card height mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
          const src=record.source.filter(n=>n.className.startsWith('cn-slider relative'));
          const qx=record.qx.filter(n=>n.className.startsWith('qxframe9a7c2-slider is-'));
          if(src.length!==4||qx.length!==4||src.some((s,j)=>Math.abs(qx[j].x-s.x)>.5||
             Math.abs(qx[j].w-s.w)>.5||
             Math.abs(qx[j].x+qx[j].w-s.x-s.w)>.5||
             Math.abs(qx[j].y+qx[j].h/2-s.y-s.h/2)>.5)||
             Math.max(...qx.map(n=>n.x))-Math.min(...qx.map(n=>n.x))>.5)
            throw new Error(style+' KitchenIsland four source-aligned rails mismatch: '+JSON.stringify({src,qx}));
        }
        if((style==='vega'||style==='nova')&&id==='recent-transactions'){
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' RecentTransactions source collapse/gap0 table mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        }
        if(id==='savings-targets'){
          // Source note is intrinsic-width within the footer flex row: do not
          // force it full-width merely to center the text.
          const note='You have not met your targets for this';
          const sourceNote=record.source.find(n=>(n.text||'').includes(note));
          const qxNote=record.qx.find(n=>(n.text||'').includes(note));
          if(!sourceNote||!qxNote||Math.abs(sourceNote.x-qxNote.x)>.5||
            Math.abs(sourceNote.w-qxNote.w)>.5||
            Math.abs(sourceNote.h-qxNote.h)>.5)
            throw new Error(style+' SavingsTargets footer note source width/inset mismatch: '+JSON.stringify({source:sourceNote,qx:qxNote}));
        }
        if(['vega','lyra','mira','nova','maia'].includes(style)&&id==='savings-targets'){
          const sourceFirst=record.source.find(x=>x.className.includes('cn-item group/item'));
          const qxFirst=record.qx.find(x=>x.className.includes('qxframe9a7c2-item is-muted'));
          const sourceContent=record.source.find(x=>x.className.startsWith('cn-item-content'));
          const qxContent=record.qx.find(x=>x.className.startsWith('qxframe9a7c2-item-content'));
          const sourceFooter=record.source.find(x=>x.className.startsWith('cn-item-footer'));
          const qxFooter=record.qx.find(x=>x.className.includes('qxframe9a7c2-item-footer'));
          if(!sourceFirst||!qxFirst||!sourceContent||!qxContent||!sourceFooter||!qxFooter||
            Math.abs(sourceFirst.h-qxFirst.h)>.5||
            Math.abs(sourceContent.h-qxContent.h)>.5||
            Math.abs(sourceFooter.y-qxFooter.y)>.5||
            Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' SavingsTargets ItemContent/ItemFooter sibling ownership mismatch: '+JSON.stringify({sourceFirst,qxFirst,sourceContent,qxContent,sourceFooter,qxFooter,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='vega'&&id==='card-overview'&&Math.abs(record.source[0].h-record.qx[0].h)>.5)
          throw new Error('Vega Overview source 2xl metric line-box mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        if(style==='sera'&&id==='card-overview'&&Math.abs(record.source[0].h-record.qx[0].h)>.5)
          throw new Error('Sera Overview peer Card Button natural no-wrap/shrink mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        if(['nova','lyra','mira'].includes(style)&&id==='account-access'){
          const srcLabel=record.source.find(x=>x.text==='Current Password');
          const qxLabel=record.qx.find(x=>x.text==='Current Password');
          if(!srcLabel||!qxLabel||Math.abs(srcLabel.h-qxLabel.h)>.5||
            Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' AccountAccess nested FieldLabel source line-box mismatch: '+JSON.stringify({srcLabel,qxLabel,src:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='payout-threshold'){
          const findLabel=(a)=>a.find(n=>n.text==='Minimum Payout Amount');
          const sourceLabel=findLabel(record.source), qxLabel=findLabel(record.qx);
          if(!sourceLabel||!qxLabel||qxLabel.transform!=='uppercase'||
            Math.abs(sourceLabel.h-qxLabel.h)>.5||
            Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera PayoutThreshold editorial FieldLabel wrapping and Card mismatch: '+
              JSON.stringify({sourceLabel,qxLabel,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='mira'&&id==='faq'){
          const srcContent=record.source.find(x=>x.className.includes('cn-accordion-content-inner'));
          const qxContent=record.qx.find(x=>x.className.includes('qxframe9a7c2-collapse-content'));
          if(!srcContent||!qxContent||Math.abs(srcContent.h-qxContent.h)>.5||
            Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Mira FAQ source-paired independent open content trailing padding mismatch: '+JSON.stringify({srcContent,qxContent,src:record.source[0],qx:record.qx[0]}));
        }
        if(style==='nova'&&id==='receiving-method'){
          const sourceFieldset=record.source.find(x=>x.className.includes('cn-field-set'));
          const qxFieldset=record.qx.find(x=>x.className.includes('qxframe9a7c2-form-fieldset'));
          if(!sourceFieldset||!qxFieldset||Math.abs(sourceFieldset.h-qxFieldset.h)>.5||
             Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Nova ReceivingMethod FieldLegend post-legend margin mismatch: '+JSON.stringify({sourceFieldset,qxFieldset,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='index-investing'){
          const sourceProse=record.source.filter(x=>x.className.includes('cn-card-description')).at(-1);
          const qxProse=record.qx.find(x=>x.className.includes('is-prose-intro'));
          if(!sourceProse||!qxProse||Math.abs(sourceProse.y-qxProse.y)>.5||
             Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera IndexInvesting authored prose mt-0 geometry mismatch: '+JSON.stringify({sourceProse,qxProse,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='preferences'&&Math.abs(record.source[0].h-record.qx[0].h)>.5)
          throw new Error('Sera Preferences source Footer action shrink mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        if(style==='sera'&&id==='stock-performance'){
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera StockPerformance source-optional Separator Card mismatch: '+
              JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='claimable-balance'){
          const src=record.source.find(x=>x.className.startsWith('cn-badge'));
          const qx=record.qx.find(x=>x.className.includes('qxframe9a7c2-badge is-status-label'));
          if(!src||!qx||Math.abs(src.h-qx.h)>.5||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera StatusBadge source typography mismatch: '+JSON.stringify({src,qx}));
        }
        if(style==='sera'&&id==='faq'){
          const sourceFooter=record.source.find(x=>x.className.startsWith('cn-card-footer'));
          const qxFooter=record.qx.find(x=>x.className.startsWith('qxframe9a7c2-card-footer'));
          // Source Card owns bottom padding; QX CardFooter owns that same
          // bottom inset, so compare footer box height plus its owning inset.
          const sourceBottomInset=parseFloat(record.source[0].pb)||0;
          if(!sourceFooter||!qxFooter||
             Math.abs(sourceFooter.h+sourceBottomInset-qxFooter.h)>.5||
             Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera FAQ source nonshrinking Button/Footer mismatch: '+JSON.stringify({sourceFooter,qxFooter,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='dividend-income'){
          const sourceItem=record.source.find(x=>x.className.includes('cn-item group/item'));
          const qxItem=record.qx.find(x=>x.className.includes('qxframe9a7c2-item is-muted'));
          const sourceTitle=record.source.find(x=>x.className.includes('cn-item-title'));
          const qxTitle=record.qx.find(x=>x.className.includes('qxframe9a7c2-item-title'));
          if(!sourceItem||!qxItem||!sourceTitle||!qxTitle||sourceTitle.transform!==qxTitle.transform||
              Math.abs(sourceItem.h-qxItem.h)>.5||Math.abs(sourceTitle.h-qxTitle.h)>.5)
            throw new Error('Sera Dividend first Item natural wrapping mismatch: '+JSON.stringify({sourceItem,qxItem,sourceTitle,qxTitle}));
        }
        if(style==='lyra'&&id==='faq'){
          const getTrigger=r=>r.find(x=>x.className.includes('accordion-trigger')||x.className.includes('qxframe9a7c2-collapse-header'));
          const sourceTrigger=getTrigger(record.source),qxTrigger=getTrigger(record.qx);
          if(!sourceTrigger||!qxTrigger||Math.abs(sourceTrigger.h-qxTrigger.h)>.5)
            throw new Error('Lyra FAQ source-paired Accordion trigger height mismatch: '+JSON.stringify({source:sourceTrigger,qx:qxTrigger}));
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Lyra FAQ whole Card height differs after icon alignment');
        }
        if(id==='notification-settings'&&style!=='sera'){
          const sourceRow=record.source.find(n=>n.className.includes('cn-field group/field'));
          const qxRow=record.qx.find(n=>n.className==='qxframe9a7c2-check-field is-center');
          if(!sourceRow||!qxRow||Math.abs(sourceRow.h-16)>.5||
            Math.abs(qxRow.h-sourceRow.h)>.5||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' notification horizontal checkbox align/source Card mismatch: '+JSON.stringify({sourceRow,qxRow,source:record.source[0],qx:record.qx[0]}));
        }
        if(id==='contribution-history'&&['vega','nova','sera'].includes(style)){
          const sourceLabels=record.source.filter(n=>n.text==='Upcoming'||n.text==='Auto-Save Plan');
          const qxLabels=record.qx.filter(n=>n.text==='Upcoming'||n.text==='Auto-Save Plan');
          if(sourceLabels.length!==2||qxLabels.length!==2||sourceLabels.some((n,i)=>Math.abs(n.h-qxLabels[i].h)>.5)||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error(style+' ContributionHistory category ItemDescription leading mismatch: '+JSON.stringify({sourceLabels,qxLabels,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='lyra'&&id==='dividend-income'){
          const titles=rows=>rows.filter(n=>['Vanguard VIG','S&P 500 VOO','Apple AAPL','Realty Income'].includes(n.text));
          const src=titles(record.source),qx=titles(record.qx);
          if(src.length!==4||qx.length!==4||src.some((n,i)=>Math.abs(n.h-qx[i].h)>.5)||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Lyra Dividend source ItemTitle wrapping line-box mismatch: '+JSON.stringify({src,qx,source:record.source[0],actual:record.qx[0]}));
        }
        if(id==='power-usage'&&Math.abs(record.source[0].h-record.qx[0].h)>.5)
          throw new Error(style+' PowerUsage 2px metric-pair source gap mismatch: '+JSON.stringify({source:record.source[0],qx:record.qx[0]}));
        if(style==='mira'&&id==='receiving-method'){
          const titleOf=rows=>rows.find(n=>n.text==='Bank Transfer');
          const srcTitle=titleOf(record.source),qxTitle=titleOf(record.qx);
          if(!srcTitle||!qxTitle||Math.abs(srcTitle.h-19.5)>.5||
            Math.abs(srcTitle.h-qxTitle.h)>.5||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Mira FieldTitle text-xs/relaxed line box differs: '+JSON.stringify({srcTitle,qxTitle,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='lyra'&&['kitchen-island','payments','upcoming-payments'].includes(id)){
          if(id!=='upcoming-payments'){
            const getTitles=nodes=>nodes.filter(n=>['Brightness','Color Temp','Volume','Fade','Change transfer limit','Scheduled transfers','Direct Debits','Recurring card payments'].includes(n.text));
            const st=getTitles(record.source),qt=getTitles(record.qx);
            if(st.length!==4||qt.length!==4||st.some((n,i)=>Math.abs(n.h-qt[i].h)>.5))
              throw new Error('Lyra ordinary ItemTitle source 16px line-box mismatch: '+JSON.stringify({st,qt}));
          }
          if(Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Lyra ItemTitle and related Card height differ: '+JSON.stringify({id,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='nova'&&id==='card-overview'){
          const title=rows=>rows.find(n=>n.text==='US$12.94');
          const st=title(record.source),qt=title(record.qx);
          if(!st||!qt||Math.abs(st.h-33)>.5||Math.abs(st.h-qt.h)>.5||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Nova 2xl CardTitle source 33px leading/Card height differ: '+JSON.stringify({st,qt,source:record.source[0],qx:record.qx[0]}));
        }
        if(style==='sera'&&id==='receiving-method'){
          const legend=rows=>rows.find(n=>n.tag==='legend'||n.className.includes('cn-field-legend'));
          const fieldTitle=rows=>rows.find(n=>n.text==='Bank Transfer');
          const sl=legend(record.source),ql=legend(record.qx),st=fieldTitle(record.source),qt=fieldTitle(record.qx);
          if(!sl||!ql||!st||!qt||Math.abs(sl.h-16)>.5||Math.abs(sl.h-ql.h)>.5||
            Math.abs(st.h-18)>.5||Math.abs(st.h-qt.h)>.5||Math.abs(record.source[0].h-record.qx[0].h)>.5)
            throw new Error('Sera FieldLegend/FieldTitle source line-height Card mismatch: '+JSON.stringify({sl,ql,st,qt,source:record.source[0],qx:record.qx[0]}));
        }
        console.log('[stage3-target-'+style+'-'+id+'] '+JSON.stringify(record));
      }
      if(!dark && ['sera','mira','nova'].includes(style))
        for(const id of (style==='sera'?['dividend-income']:['upcoming-payments'])) {
          const key=style+'/'+id;
          sourceStyleProbes[key].qx=await sourceStyleProbe(false,id);
          if(style==='lyra'&&id==='upcoming-payments'){
            const pair=sourceStyleProbes[key];
            if(!pair.source.weekday||!pair.qx.weekday||
              Math.abs(pair.source.weekday.height-pair.qx.weekday.height)>.5)
              throw new Error('Lyra source Calendar weekday line box mismatch: '+JSON.stringify({source:pair.source.weekday,qx:pair.qx.weekday}));
          }
          console.log('[stage3-css-probe-'+style+'-'+id+'] '+JSON.stringify(sourceStyleProbes[key]));
        }


      if(style==='nova'&&!dark) console.log('[stage3-payout-textarea-css] '+JSON.stringify(await page.evaluate(() => {
        const el=document.querySelector('[data-card="payout-threshold"] textarea'),cs=getComputedStyle(el);
        const slider=document.querySelector('[data-card="payout-threshold"] .qxframe9a7c2-slider');
        const ss=getComputedStyle(slider);
        return {rootFont:getComputedStyle(document.documentElement).fontSize,textarea:{box:el.getBoundingClientRect().height,
          minHeight:cs.minHeight,maxHeight:cs.maxHeight,height:cs.height,boxSizing:cs.boxSizing,
          fieldSizing:cs.fieldSizing,display:cs.display,inlineStyle:el.getAttribute('style'),
          cssClass:el.className,
          matchedRules:(() => {
            const result=[];
            const walk=(rules,source)=>{
              for(const rule of Array.from(rules||[])){
                if(rule.cssRules)walk(rule.cssRules,source);
                if(!rule.selectorText||!rule.style?.minHeight)continue;
                try{if(el.matches(rule.selectorText))result.push({source,selector:rule.selectorText.slice(0,180),minHeight:rule.style.minHeight,priority:rule.style.getPropertyPriority('min-height')});}
                catch{}
              }
            };
            for(const sheet of Array.from(document.styleSheets)){
              try{walk(sheet.cssRules,sheet.href||'[inline]');}catch{}
            }
            return result.slice(-30);
          })()},slider:{box:slider.getBoundingClientRect().height,rail:getComputedStyle(slider.querySelector('.qxframe9a7c2-slider-rail')).height,
          class:slider.className}};
      })));
      if(style==='nova'&&!dark) console.log('[stage3-loading-nova-structure] '+JSON.stringify({source:novaLoadingSource,qx:await loadingStructure(false)}));
      if (style === 'nova') await page.screenshot({ path: path.join(out, key + '-qx.png'), fullPage: true });
      for(const id of new Set([...Object.keys(sourceInner),...Object.keys(actualInner)]))
        innerRows.push({style,mode:dark?'dark':'light',card:id,source:sourceInner[id]||null,qx:actualInner[id]||null});
      for (const id of new Set([...Object.keys(reference), ...Object.keys(actual)])) {
        const ref = reference[id], qx = actual[id];
        const differences = !ref || !qx ? ['missing-card'] : ['radius', 'titleSize', 'titleInset', 'titleTop'].filter(k => ref[k] !== qx[k] && (ref[k] === null || qx[k] === null || Math.abs(ref[k] - qx[k]) > 0.5));
        rows.push({ style, mode: dark ? 'dark' : 'light', card: id, reference: ref, actual: qx, differences });
      }
    }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
const nestedReport={source:'295a1f114a138f23b5dfee0e0c6812394dfeb90c',roles:['header','content','footer','item','button','badge','field'],
  note:'All 33 source Card groups, one representative per nested visual role. Role probes are diagnostic until source/QX mapping is calibrated; no unmeasured pixel parity is claimed.',
  rows:innerRows};
fs.writeFileSync(path.join(out,'inner-roles.json'),JSON.stringify(nestedReport,null,2)+'\n');
console.log('[stage3-inner-roles] '+JSON.stringify({rows:innerRows.length,cards:new Set(innerRows.map(x=>x.card)).size,sourceMissing:innerRows.filter(x=>!x.source).length,qxMissing:innerRows.filter(x=>!x.qx).length,
  sharedRoleComparisons:innerRows.reduce((n,x)=>n+(x.source&&x.qx?Object.keys(x.source).filter(k=>x.source[k]&&x.qx[k]).length:0),0)}));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ source: '295a1f114a138f23b5dfee0e0c6812394dfeb90c', font: 'system-ui, sans-serif', checkedProperties: ['radius', 'titleSize', 'titleInset', 'titleTop'], note: 'First Card in each source example: geometry inventory, not final acceptance or nested-card coverage. Chart/calendar stubs are excluded from content parity. Height/width recorded for diagnosis, wrapping excluded per v3.', errors, rows }, null, 2) + '\n');
console.log(JSON.stringify({ cards: new Set(rows.map(r => r.card)).size, renders: rows.length, geometrySubsetMismatches: rows.filter(r => r.differences.length).length, heightDiagnostics: rows.filter(r => r.reference && r.actual && Math.abs(r.reference.height - r.actual.height) > 0.5).length, errors }));
if (errors.length) process.exitCode = 1;
