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
const rows = [], errors = [];
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
        display:cs.display,gap:cs.rowGap,pt:cs.paddingTop,pb:cs.paddingBottom,
        fs:cs.fontSize,lh:cs.lineHeight};
    });
  },{source,id});
  let novaCardStructures = {};
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
      await page.addStyleTag({ content: '*{content-visibility:visible}body,body *{font-family:system-ui,sans-serif!important}*{animation:none;transition:none}' });
      await page.waitForTimeout(350);
      const reference = await measure(true);
      if(style==='nova'&&!dark) for(const id of ['payout-threshold','claimable-balance']) novaCardStructures[id]={source:await nodeStructure(true,id)};
      if(style==='nova'&&!dark) novaLoadingSource=await loadingStructure(true);
      if (style === 'nova') await page.screenshot({ path: path.join(out, key + '-reference.png'), fullPage: true });
      await page.goto(`${origin}/docs/create/preview-01.html`);
      await page.waitForSelector('[data-card="contribution-history"]');
      await page.addStyleTag({ content: compileTheme(normalizeConfig({ style })).css });
      await page.evaluate(({ style, dark }) => { document.documentElement.dataset.createStyle = style; document.documentElement.classList.toggle('dark', dark); }, { style, dark });
      await page.addStyleTag({ content: 'body,body *{font-family:system-ui,sans-serif!important}*{animation:none;transition:none}' });
      await page.waitForTimeout(350);
      const actual = await measure(false);
      if(style==='nova'&&!dark) for(const id of ['payout-threshold','claimable-balance']) {novaCardStructures[id].qx=await nodeStructure(false,id); console.log('[stage3-structure-'+id+'] '+JSON.stringify(novaCardStructures[id]));}
      if(style==='nova'&&!dark) console.log('[stage3-payout-textarea-css] '+JSON.stringify(await page.evaluate(() => {
        const el=document.querySelector('[data-card="payout-threshold"] textarea'),cs=getComputedStyle(el);
        const slider=document.querySelector('[data-card="payout-threshold"] .qxframe9a7c2-slider');
        const ss=getComputedStyle(slider);
        return {rootFont:getComputedStyle(document.documentElement).fontSize,textarea:{box:el.getBoundingClientRect().height,
          minHeight:cs.minHeight,maxHeight:cs.maxHeight,height:cs.height,boxSizing:cs.boxSizing,
          fieldSizing:cs.fieldSizing,display:cs.display,inlineStyle:el.getAttribute('style'),
          cssClass:el.className},slider:{box:slider.getBoundingClientRect().height,rail:getComputedStyle(slider.querySelector('.qxframe9a7c2-slider-rail')).height,
          class:slider.className}};
      })));
      if(style==='nova'&&!dark) console.log('[stage3-loading-nova-structure] '+JSON.stringify({source:novaLoadingSource,qx:await loadingStructure(false)}));
      if (style === 'nova') await page.screenshot({ path: path.join(out, key + '-qx.png'), fullPage: true });
      for (const id of new Set([...Object.keys(reference), ...Object.keys(actual)])) {
        const ref = reference[id], qx = actual[id];
        const differences = !ref || !qx ? ['missing-card'] : ['radius', 'titleSize', 'titleInset', 'titleTop'].filter(k => ref[k] !== qx[k] && (ref[k] === null || qx[k] === null || Math.abs(ref[k] - qx[k]) > 0.5));
        rows.push({ style, mode: dark ? 'dark' : 'light', card: id, reference: ref, actual: qx, differences });
      }
    }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ source: '295a1f114a138f23b5dfee0e0c6812394dfeb90c', font: 'system-ui, sans-serif', checkedProperties: ['radius', 'titleSize', 'titleInset', 'titleTop'], note: 'First Card in each source example: geometry inventory, not final acceptance or nested-card coverage. Chart/calendar stubs are excluded from content parity. Height/width recorded for diagnosis, wrapping excluded per v3.', errors, rows }, null, 2) + '\n');
console.log(JSON.stringify({ cards: new Set(rows.map(r => r.card)).size, renders: rows.length, geometrySubsetMismatches: rows.filter(r => r.differences.length).length, heightDiagnostics: rows.filter(r => r.reference && r.actual && Math.abs(r.reference.height - r.actual.height) > 0.5).length, errors }));
if (errors.length) process.exitCode = 1;
