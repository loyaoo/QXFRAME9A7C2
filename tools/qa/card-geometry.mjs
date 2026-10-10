// Measured Card regression, shadcn/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c.
// Width/wrapping are intentionally excluded by v3 §7.4. Uses the same system font
// for every render; spec.json supplies the source-locked numeric geometry.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { compileTheme, normalizeConfig } from '../../docs/create/model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(process.env.QA_NODE_MODULES ? path.join(process.env.QA_NODE_MODULES, 'qa.cjs') : new URL('./ref/package.json', import.meta.url));
const { chromium } = require('playwright');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/spec.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'dist/qxframe9a7c2.css'), 'utf8');
const out = path.join(root, 'tools/qa/reports/stage-3/card-geometry');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN } : {}) });
const rows = [];
const prefix = 'qxframe9a7c2-';
const fixture = (body = 'content') => `<article class="${prefix}card"><header class="${prefix}card-header"><div class="${prefix}card-heading"><h3 class="${prefix}card-title">Card title</h3><p class="${prefix}card-description">Card description text</p></div></header><div class="${prefix}card-${body}"><p style="margin:0">Body copy</p></div><footer class="${prefix}card-footer"><button class="${prefix}button is-outline is-md">Cancel</button></footer></article>`;
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 440 } });
  for (const style of Object.keys(spec).filter(key => !key.endsWith('-dark'))) {
    for (const dark of [false, true]) {
      const key = style + (dark ? '-dark' : '');
      const config = normalizeConfig({ style, font: 'system' });
      const theme = compileTheme(config).css;
      await page.setContent(`<!doctype html><html class="${dark ? 'dark' : ''}"><head><style>${css}\n${theme}</style><style>body{margin:0;padding:24px;background:var(--qxframe9a7c2-theme-background);font-family:system-ui,sans-serif}.fixture,.fixture *{font-family:system-ui,sans-serif!important}.fixture{display:flex;gap:24px}.fixture>article{width:360px;flex:none}</style></head><body><div class="fixture">${fixture()}${fixture('body')}</div></body></html>`);
      const measured = await page.evaluate(() => [...document.querySelectorAll('.qxframe9a7c2-card')].map(card => {
        const q = suffix => card.querySelector('.qxframe9a7c2-card-' + suffix);
        const box = el => el.getBoundingClientRect();
        const s = el => getComputedStyle(el);
        const heading = q('heading'), title = q('title'), desc = q('description'), body = q('content') || q('body'), footer = q('footer'), button = footer.querySelector('button');
        return { radius: parseFloat(s(card).borderTopLeftRadius), height: box(card).height,
          inset: box(title).left - box(card).left, top: box(title).top - box(card).top,
          metaGap: box(desc).top - box(title).bottom,
          contentGap: box(body.firstElementChild).top - box(desc).bottom,
          footerGap: box(footer).top - box(body.firstElementChild).bottom,
          footerInset: parseFloat(s(footer).paddingTop), footerBottom: parseFloat(s(footer).paddingBottom),
          divider: parseFloat(s(footer).borderTopWidth),
          titleWeight: Number(s(title).fontWeight), titleSize: parseFloat(s(title).fontSize), titleLine: parseFloat(s(title).lineHeight),
          descriptionLine: parseFloat(s(desc).lineHeight), buttonHeight: box(button).height,
          footerColor: s(footer).backgroundColor, headingGap: parseFloat(s(heading).gap) };
      }));
      const ref = spec[key], c = ref['card-default'], t = ref['card-title-default'], d = ref['card-desc-default'], f = ref['card-footer-default'];
      const expected = { radius: parseFloat(c.rad), height: c.h, inset: parseFloat(ref['card-header-default'].pr),
        top: parseFloat(c.pt), metaGap: parseFloat(ref['card-header-default'].gap), contentGap: parseFloat(c.gap),
        footerGap: parseFloat(c.gap), footerInset: parseFloat(f.pt),
        // QX assigns the bottom card padding to the last slot; shadcn assigns it
        // to the container except for partitioned footers. Compare the total.
        footerBottom: parseFloat(f.pb) + parseFloat(c.pb), divider: parseFloat(f.bw),
        titleWeight: Number(t.fw), titleSize: parseFloat(t.fs), titleLine: parseFloat(t.lh), descriptionLine: parseFloat(d.lh),
        buttonHeight: ref['card-footer-btn-default'].h, headingGap: parseFloat(ref['card-header-default'].gap) };
      for (const [index, values] of measured.entries()) {
        for (const [property, target] of Object.entries(expected)) rows.push({ style, mode: dark ? 'dark' : 'light', markup: index ? 'legacy-body' : 'content', property, expected: target, actual: values[property], pass: Math.abs(values[property] - target) <= 0.5 });
      }
      await page.screenshot({ path: path.join(out, key + '.png') });
      const states = await page.evaluate(() => {
        const card = document.querySelector('.qxframe9a7c2-card');
        const s = () => getComputedStyle(card);
        const results = [];
        const check = (property, actual, expected) => results.push({ property, actual, expected, pass: actual === expected });
        const probe = document.createElement('span');
        card.append(probe);
        probe.style.color = 'var(--qxframe9a7c2-theme-primary)';
        card.classList.add('is-selected');
        check('selected-outline', s().outlineColor, getComputedStyle(probe).color);
        card.classList.remove('is-selected');
        card.classList.add('is-borderless');
        check('borderless-outline', s().outlineColor, 'rgba(0, 0, 0, 0)');
        card.classList.remove('is-borderless');
        card.style.setProperty('--qxframe9a7c2-card-radius', '1.875rem');
        card.style.setProperty('--qxframe9a7c2-card-padding', '1.875rem');
        check('public-radius', s().borderTopLeftRadius, '30px');
        check('public-padding', getComputedStyle(card.firstElementChild).paddingLeft, '30px');
        card.removeAttribute('style');
        const body = card.querySelector('.qxframe9a7c2-card-content');
        const next = body.cloneNode(true);
        next.className = 'qxframe9a7c2-card-body';
        body.after(next);
        check('mixed-content-gap', next.firstElementChild.getBoundingClientRect().top - body.firstElementChild.getBoundingClientRect().bottom, parseFloat(getComputedStyle(body).paddingBottom));
        next.remove();
        const header = card.firstElementChild;
        body.after(header);
        check('content-before-header-gap', header.querySelector('.qxframe9a7c2-card-title').getBoundingClientRect().top - body.firstElementChild.getBoundingClientRect().bottom, parseFloat(getComputedStyle(body).paddingBottom));
        probe.remove();
        return results;
      });
      for (const result of states) rows.push({ style, mode: dark ? 'dark' : 'light', markup: 'states', ...result });
      const card = page.locator('.qxframe9a7c2-card').first();
      await card.evaluate(el => { el.classList.add('is-hoverable'); el.style.transition = 'none'; });
      await card.hover();
      const hover = await card.evaluate(el => {
        const probe = document.createElement('span'); probe.style.color = 'var(--_qxframe9a7c2-semantic-accent-border)'; el.append(probe);
        const result = { actual: getComputedStyle(el).outlineColor, expected: getComputedStyle(probe).color }; probe.remove(); return result;
      });
      rows.push({ style, mode: dark ? 'dark' : 'light', markup: 'states', property: 'hover-outline', ...hover, pass: hover.actual === hover.expected });
    }
  }
} finally { await browser.close(); }
const failures = rows.filter(row => !row.pass);
const report = { source: 'shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c', font: 'system-ui, sans-serif', tolerance: 0.5, checks: rows.length, failures: failures.length, rows };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checks: rows.length, failures: failures.length, examples: failures.slice(0, 20) }));
if (failures.length) process.exitCode = 1;
