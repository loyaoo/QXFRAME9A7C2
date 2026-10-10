// createApp (docs/create) static + model gate, v3 §2–§5. Fast, no browser.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs/create');
const read = rel => fs.readFileSync(path.join(dir, rel), 'utf8');
const ONLINE_JS = 'https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js';
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

const FILES = ['index.html', 'app.css', 'app.js', 'model.js', 'data.js', 'themes.js', 'preview-01.html', 'preview-02.html', 'preview.css', 'preview.js', 'preview-cards.js'];
check('files', () => { for (const f of FILES) assert.ok(fs.existsSync(path.join(dir, f)), 'missing docs/create/' + f); });

check('offline changes ledger and packaging are opt-in and do not contaminate production Create HTML', () => {
  const ledger=read('offline-qa-changes.mjs');
  const overlay=read('offline-qa-changes.css');
  const packager=fs.readFileSync(path.join(root,'tools/qa/build-offline-demo.py'),'utf8');
  const preview=read('preview-01.html');
  const current={
    'savings-targets':['.qxframe9a7c2-form-input-group']
  };
  let count=0;
  for(const [id,selectors] of Object.entries(current)){
    assert.ok(preview.includes('data-card="'+id+'"'),'current Card '+id);
    assert.ok(ledger.includes("['"+id+"'"),'active QA group '+id);
    for(const selector of selectors){assert.ok(ledger.includes("'"+selector+"'"),'changed child '+selector);count++;}
  }
  for(const previous of ['sidebar-nav','dividend-income','payout-threshold','preferences','notification-settings',
    'recent-transactions','transfer-funds','receiving-method','claimable-balance','front-door',
    'release-catalog','upcoming-payments','qr-connect','cover-art','new-milestone','social-links'])
    assert.ok(!ledger.includes("['"+previous+"'"),'old highlight absent '+previous);
  assert.equal(count,1,'one exact current-round region in Savings Targets only');
  assert.equal((ledger.match(/__QA_BUNDLE_HEAD__/g)||[]).length,count,'exactly one marker per current changed region');
  assert.match(overlay,/\.qa-changed-region/,'inner changed regions need visible highlight');
  assert.match(ledger,/markedRegions=groups\.reduce/,'offline QA badge count must be derived from live ledger');
  assert.match(ledger,/__QA_BUNDLE_HEAD__/,'new changes must carry CI build HEAD placeholder');
  assert.match(packager,/ledger\.replace\('__QA_BUNDLE_HEAD__',head\[:8\]\)/,'ZIP must embed the exact CI Git HEAD');
  assert.match(ledger,/data-qa-toggle/,'offline QA must support original clean view');
  assert.match(packager,/offline-qa-changes\.mjs/,'packager must inject the QA module into local copies');
  assert.match(packager,/offline-qa-changes\.css/,'packager must inject the QA stylesheet into local copies');
  for(const page of ['index.html','preview-01.html','preview-02.html'])
    assert.doesNotMatch(read(page),/offline-qa-changes/,
      'QA visuals are forbidden in source / online Create HTML: '+page);
});

check('segmented Tabs use the pinned source dark active input/30 recipe', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\{border:1px solid transparent\}/,'source Tab border box');
  assert.match(css,/--_qxframe9a7c2-tabs-tab-bg:light-dark\(var\(--qxframe9a7c2-theme-background\),color-mix\(in oklab,var\(--qxframe9a7c2-theme-input\) 30%,transparent\)\)/,'dark input/30, light background');
  assert.match(css,/--_qxframe9a7c2-tabs-tab-border:light-dark\(transparent,var\(--qxframe9a7c2-theme-choice-border\)\)/,'shared choice border recipe retains source Luma/Rhea transparent policy');
});

check('CheckField 3-way alignment has no margin-offset or Card-specific owner', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-check-field\{[\s\S]*?align-items:center;/,'centered cross axis by default');
  assert.match(css,/\.qxframe9a7c2-check-field>\.qxframe9a7c2-form-check-input\{\s*align-self:center;margin-block:0/,'input and its drawn indicator centered without top offset');
  for(const [name,alignment] of [['start','flex-start'],['center','center'],['end','flex-end']]){
    assert.ok(css.includes('.qxframe9a7c2-check-field.is-'+name+'{align-items:'+alignment+'}'),name+' row alignment');
    assert.ok(css.includes('.qxframe9a7c2-check-field.is-'+name+'>.qxframe9a7c2-form-check-input{align-self:'+alignment+'}'),name+' input alignment');
  }
  assert.doesNotMatch(css,/\.qxframe9a7c2-check-field>\.qxframe9a7c2-form-check-input\{margin-top:/,'no old offset compensation');
  assert.doesNotMatch(css,/\.qxframe9a7c2-check-field\.is-choice\{[^}]*align-items:/,'choice frame must not override cross-axis states');
  const preview=read('preview-01.html');
  const section=preview.slice(preview.indexOf('<!-- @card notification-settings -->'),preview.indexOf('<!-- @end notification-settings -->'));
  assert.equal((section.match(/class="qxframe9a7c2-check-field"/g)||[]).length,5,'five CheckField rows use default center');
  assert.ok(!section.includes('qxframe9a7c2-check-field is-center'),'default center does not require per-Card state');
});

check('Owner feedback batch: density, Tabs, sidebar, popup, native Select and grouped focus are shared recipes',()=>{
  const css=(name)=>fs.readFileSync(path.join(root,'src/styles/components/'+name+'.css'),'utf8');
  const compiler=read('compiler.js');
  const density=compiler.match(/const DENSITY = \{([\s\S]*?)\n\};/);
  assert.ok(density,'density source table');
  const rows=['dense','compact','standard','loose','touch'].map(x=>{
    const re=new RegExp(x+': \\[([^\\]]+)\\]');
    const m=density[1].match(re);assert.ok(m,x+' row exists');
    return m[1].split(',').map(y=>parseFloat(y));
  });
  for(let col=0;col<4;col++)for(let i=1;i<rows.length;i++)
    assert.ok(rows[i][col]>=rows[i-1][col],'density '+i+' property '+col+' is monotonic');
  assert.match(css('tabs'),/\.qxframe9a7c2-tabs-scroll\{width:100%;height:var\(--_qxframe9a7c2-tabs-height\)/,'horizontal Tabs root uses shared tab height');
  assert.match(css('tabs'),/is-segmented:not\(\.is-vertical\) \.qxframe9a7c2-tabs-scroll\{height:calc\(var\(--_qxframe9a7c2-tabs-height\) \+ \.5rem\)/,'segmented Scroll adds the full vertical 8px rail budget');
  assert.match(css('tabs'),/\.qxframe9a7c2-scroll-viewport\{box-sizing:border-box;padding:0\.25rem;/,'viewport 4px vertical padding restored without overflow');
  assert.match(css('form-native'),/form-select-arrow-image,var\(--_qxframe9a7c2-native-select-chevron\)/,'native Select arrow uses a theme-overridable SVG image slot');
  assert.match(css('form-native'),/\.dark \.qxframe9a7c2-form-select,\.dark \.qxframe9a7c2-native-form select\{/,'dark SVG must use theme boundary (light-dark does not accept URLs)');
  assert.match(css('form-native'),/m6 9 6 6 6-6/,'native SVG chevron follows JS icon path');
  assert.match(css('composition'),/html:not\(\.qxframe9a7c2-keyboard-focus-origin\) \.qxframe9a7c2-form-input-group-field:has\(>\.qxframe9a7c2-form-input:focus-visible\)[^\{]*\{[^}]*theme-pointer-width/,'InputGroup mouse focus consumes Theme pointer token and is restricted to pointer origin');
  assert.match(css('motion'),/motion-popup-placement-appear-from[^\{]*\{[^}]*scaleY\(\.88\)/,'vertical anchored expansion');
  assert.match(css('motion'),/\[data-placement\^="right"\][^\{]*\{[^}]*scaleX\(\.88\)/,'horizontal anchored expansion');
  assert.match(css('composition'),/sidebar-menu-button:hover:not\(\.is-active\)[^\{]*\{[^}]*theme-muted/,'muted hover');
  assert.match(css('composition'),/sidebar-menu-button\.is-active:hover[^\{]*\{[^}]*theme-accent/,'theme active');
  assert.match(css('composition'),/form-input-group-field:has\(>\.qxframe9a7c2-form-input:focus-visible\)[^\{]*\{[^}]*outline:/,'group owns keyboard outline');
  assert.match(css('composition'),/form-input-group-addon\+\.qxframe9a7c2-form-input[^\{]*\{[^}]*padding-inline-start:calc/,'internal touching padding half');
  assert.match(css('form-native'),/\.qxframe9a7c2-form-select,\.qxframe9a7c2-native-form select\{[\s\S]*?appearance:none/,'native arrow replacement');
  assert.ok(fs.readFileSync(path.join(root,'docs/create/inputgroup-control-contract.md'),'utf8').includes('独立子组合布局岛'));
  assert.match(css('button'),/\.qxframe9a7c2-button\.is-md:not\(\.is-square\):not\(\.is-icon-only\)[^\{]*\{[^}]*theme-button-md-padding-inline/,'MD Button family uses style-specific inset');
  assert.match(read('tokens.js'),/L\('button-md-padding-inline'/,'registered medium Button slot');
});


check('small Button typography consumes one source-mapped Theme token', () => {
  const compiler=fs.readFileSync(path.join(root,'docs/create/compiler.js'),'utf8');
  const tokens=fs.readFileSync(path.join(root,'docs/create/tokens.js'),'utf8');
  const component=fs.readFileSync(path.join(root,'src/styles/components/button.css'),'utf8');
  const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  assert.match(tokens,/L\('button-sm-font-size'/,'closed theme schema');
  const defaultTheme=fs.readFileSync(path.join(root,'src/styles/main/theme.css'),'utf8');
  assert.equal((defaultTheme.match(/--qxframe9a7c2-theme-button-sm-font-size:/g)||[]).length,2,'default Nova light/dark token symmetry');
  assert.match(compiler,/root\['button-sm-font-size'\]/,'compiler emits independent style recipe');
  assert.match(v2,/\.qxframe9a7c2-button\.is-sm\{\s*font-size:var\(--qxframe9a7c2-theme-button-sm-font-size/,'V2 actual shared geometry owner consumes source Button type');
  assert.match(v2,/\.qxframe9a7c2-button\.is-sm\.is-square,[\s\S]*?font-size:var\(--qxframe9a7c2-theme-control-font-size/,'icon-sm retains source 14px Nova body/control type');
  assert.doesNotMatch(component,/\.qxframe9a7c2-button\.is-sm\{\s*font-size:/,'do not retain overwritten earlier Button owner');
});

check('pages load the online qxframe.js and the local qxframe.css only', () => {
  for (const page of ['index.html', 'preview-01.html', 'preview-02.html']) {
    const html = read(page);
    const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    assert.ok(refs.includes(ONLINE_JS), page + ' must load ' + ONLINE_JS);
    assert.ok(refs.includes('../../dist/qxframe9a7c2.css'), page + ' must load ../../dist/qxframe9a7c2.css');
    const external = refs.filter(r => /^https?:/i.test(r) && r !== ONLINE_JS);
    assert.deepEqual(external, [], page + ' must not load other network resources (v3 §3.2: no online fonts)');
    for (const ref of refs.filter(r => !/^(https?:|#|data:|mailto:)/i.test(r))) {
      assert.ok(fs.existsSync(path.resolve(dir, ref.split(/[?#]/)[0])), page + ' references a missing file: ' + ref);
    }
  }
});

check('no network fonts or @import in createApp styles', () => {
  for (const css of ['app.css', 'preview.css']) {
    const text = read(css);
    assert.doesNotMatch(text, /@import|@font-face|url\(\s*["']?https?:/i, css + ' must not load remote fonts or stylesheets');
  }
});

check('createApp private styles never enter qxframe.css', () => {
  const dist = path.join(root, 'dist/qxframe9a7c2.css');
  const source = fs.existsSync(dist) ? fs.readFileSync(dist, 'utf8') : '';
  assert.doesNotMatch(source, /\.(?:create|pv)-[a-z]/, 'qxframe.css must not contain createApp-private .create-* / .pv-* rules (v3 §2)');
});

check('Empty: shared QX composition replaces preview-private geometry', () => {
  const shared = fs.readFileSync(path.join(root, 'src/styles/components/empty.css'), 'utf8');
  assert.match(shared, /\.qxframe9a7c2-empty\.is-composed\s*\{/);
  assert.match(shared, /\.qxframe9a7c2-empty-media\.is-icon\s*\{/);
  assert.match(shared, /width:\s*var\(--_qxframe9a7c2-empty-media-size\)/);
  assert.match(shared, /font-size:\s*var\(--_qxframe9a7c2-empty-title-size\)/);
  assert.match(shared, /theme-empty-inset/);
  assert.match(shared, /theme-radius-empty-media/);
  for (const page of ['preview-01.html', 'preview-02.html']) {
    const html = read(page);
    const count = (html.match(/class="qxframe9a7c2-empty is-composed/g) || []).length;
    assert.ok(count >= 4, page + ' must use QX Empty in its example cards');
    assert.equal((html.match(/class="qxframe9a7c2-empty-header"/g) || []).length, count, page + ' missing Empty header');
    assert.equal((html.match(/class="qxframe9a7c2-empty-title"/g) || []).length, count, page + ' missing Empty title');
    assert.doesNotMatch(html, /class="pv-empty/, page + ' still uses the preview-private Empty');
  }
  assert.match(read('preview-01.html'), /class="qxframe9a7c2-empty is-composed" style="--qxframe9a7c2-empty-padding:1rem"><div class="qxframe9a7c2-empty-media is-icon">/);
});

const model = await import(pathToFileURL(path.join(dir, 'model.js')).href);
const data = await import(pathToFileURL(path.join(dir, 'data.js')).href);

check('Shared focus ring shadows, theme focus color and State ownership',()=>{
  const source=p=>fs.readFileSync(path.join(root,p),'utf8');
  const data=source('docs/create/data.js');
  const generated=model.compileTheme(model.normalizeConfig({style:'nova',ext:{keyboardFocus:'ring',pointerFocus:'ring',focusColor:'theme'}})).body;
  assert.match(data,/key: 'focusColor'/,'existing color selector is reused');
  assert.match(generated,/--qxframe9a7c2-theme-focus-shadow:\s*0 0 0/,'keyboard ring has a genuine shadow');
  assert.match(generated,/--qxframe9a7c2-theme-pointer-shadow:\s*0 0 0/,'pointer ring has a genuine shadow');
  assert.match(generated,/--qxframe9a7c2-theme-ring:\s*oklch/,'Theme ring is emitted');
  const colorTokens=Object.fromEntries([...generated.matchAll(/--qxframe9a7c2-theme-([\w-]+):\s*([^;]+);/g)].map(x=>[x[1],x[2]]));
  assert.equal(colorTokens.focus,colorTokens.primary,'selected theme sets focus outline to primary');
  assert.equal(colorTokens.ring,colorTokens.primary,'selected theme sets actual control focus border to primary');
  const baseline=model.compileTheme(model.normalizeConfig({style:'nova'})).body;
  assert.match(baseline,/--qxframe9a7c2-theme-focus-shadow:\s*none/,'baseline keyboard default unchanged');
  assert.match(baseline,/--qxframe9a7c2-theme-pointer-shadow:\s*none/,'baseline pointer default unchanged');
  assert.match(source('docs/create/compiler.js'),/light\.ring = light\.primary;/,'theme-colored ring feeds focus border');
  assert.match(source('src/styles/components/focus-closeout.css'),/theme-pointer-shadow/,'native pointer ring');
  assert.match(source('src/styles/components/button.css'),/state-shadow\),var\(--qxframe9a7c2-theme-focus-shadow/,'Button preserves elevation plus focus ring');
  assert.match(source('src/styles/components/button.css'),/html:not\(\.qxframe9a7c2-keyboard-focus-origin\) \.qxframe9a7c2-button:focus[^\{]*\{[^}]*theme-pointer-shadow/,'Button pointer focus projects Theme shadow independently of :active');
  assert.match(source('src/styles/components/native-input.css'),/\.qxframe9a7c2-input:hover:not\(:focus-within\)/,'JS Input native hover');
  assert.match(source('src/styles/main/theme-visual-v2-consumers.css'),/--_qxframe9a7c2-v2-control-border:color-mix\(in oklab,var\(--qxframe9a7c2-theme-field-border\) 70%,var\(--qxframe9a7c2-theme-ring\)\)/,'visible Theme hover step must differ from default field border');
  assert.match(source('src/styles/components/composition.css'),/form-input-group-addon\):hover:not\(:focus-within\)[^\{]*\{[^}]*border-color:color-mix/,'connected InputGroup shares hover border step');

  const groupCss=source('src/styles/components/composition.css');
  assert.match(groupCss,/form-input-group-field:has\(>\.qxframe9a7c2-input\.is-keyboard-focus[^\{]*\{[^}]*theme-focus-shadow/,'JS Input keyboard focus projects its halo to InputGroupField');
  assert.match(groupCss,/form-input-group-field:has\(>\.qxframe9a7c2-input\.is-focused[^\{]*\{[^}]*theme-pointer-shadow/,'JS Input pointer focus projects to its outer composition');
  assert.match(groupCss,/form-input-group-field>\.qxframe9a7c2-input\{[^}]*state-ring:none;[^}]*box-shadow:none/,'hosted JS Input never paints a second ring');
  assert.match(groupCss,/form-input-group-field:hover:not\(:focus-within\)[^\{]*\{[^}]*border-color:color-mix/,'InputGroupField has the same derived hover border');
  assert.match(groupCss,/form-input-group-addon\):hover:not\(:focus-within\)[^\{]*qxframe9a7c2-input\.is-disabled/,'connected InputGroup hover respects JS Input disabled state');

});


check('Empty geometry follows pinned 8-style source, not Nova hardcoding', () => {
  // Source: tools/qa/spec.json at shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c.
  // inset px, outer radius px, media radius px. Both modes share root geometry.
  const expected = {
    vega: [48, 10, 10, 24, 16], nova: [24, 14, 10, 16, 10],
    maia: [48, 10, 10, 24, 16], lyra: [24, 0, 0, 16, 10],
    mira: [24, 14, 8, 16, 8], luma: [48, 18, 14, 20, 16],
    sera: [48, 0, 0, 20, 16], rhea: [48, 22, 14, 20, 16]
  };
  for (const [style, [inset, outer, media, glyph, contentGap]] of Object.entries(expected)) {
    const css = model.compileTheme(model.normalizeConfig({ style })).body;
    const tokens = Object.fromEntries(
      [...css.matchAll(/--qxframe9a7c2-theme-([a-z0-9-]+):\s*([^;]+);/g)]
        .map(m => [m[1], m[2]])
    );
    const n = value => parseFloat(value) * (value === '0' ? 1 : 16);
    assert.equal(n(tokens['empty-inset']), inset, style + ' Empty inset');
    assert.equal(n(tokens['radius-empty']), outer, style + ' Empty root radius');
    assert.equal(n(tokens['radius-empty-media']), media, style + ' Empty media radius');
    assert.equal(n(tokens['empty-icon-size']), glyph, style + ' Empty SVG glyph tier');
    assert.equal(n(tokens['empty-content-gap']), contentGap, style + ' Empty action gap');
  }
  const input = model.normalizeConfig({ style: 'nova', ext: { padding: 'p24' } });
  assert.match(model.compileTheme(input).body, /--qxframe9a7c2-theme-empty-inset:\s*3rem;/);
  const sharp = model.normalizeConfig({ style: 'luma', radius: 'none' });
  const sharpCss = model.compileTheme(sharp).body;
  assert.match(sharpCss, /--qxframe9a7c2-theme-radius-empty:\s*0;/);
  assert.match(sharpCss, /--qxframe9a7c2-theme-radius-empty-media:\s*0;/);
});

check('Item and Field match the pinned 8-style spacing and typography recipes', () => {
  // [item spacing px, item description line px, FieldGroup gap px,
  //  Field gap px, Field label line px, Field label weight]
  const expected = {
    vega:[14,21,28,12,14,500], nova:[10,21,20,8,14,500],
    maia:[14,20,28,12,14,500], lyra:[10,19.5,20,8,12,400],
    mira:[10,19.5,16,8,12,500], luma:[14,20,28,12,14,500],
    sera:[14,22.75,40,12,19.5,600], rhea:[14,20,24,12,14,500]
  };
  for (const [style, [item,desc,group,field,label,weight]] of Object.entries(expected)) {
    const css = model.compileTheme(model.normalizeConfig({ style })).body;
    const token = name => {
      const match = css.match(new RegExp('--qxframe9a7c2-theme-' + name + ':\\s*([^;]+);'));
      assert.ok(match, style + ' missing role ' + name);
      return match[1];
    };
    const px = value => parseFloat(value) * (value.endsWith('rem') ? 16 : 1);
    assert.equal(px(token('item-space')), item, style + ' item space');
    const leading = parseFloat(token('item-description-leading'));
    const font = style === 'lyra' || style === 'mira' ? 12 : 14;
    assert.ok(Math.abs(leading * font - desc) < 0.001, style + ' item desc leading');
    assert.equal(px(token('field-group-gap')), group, style + ' field group');
    assert.equal(px(token('field-gap')), field, style + ' field');
    assert.equal(px(token('field-label-line-height')), label, style + ' field label');
    assert.equal(Number(token('text-weight-label')), weight, style + ' label weight');
  }
  const itemCSS = fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const fieldCSS = fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  const layoutCSS = fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(itemCSS, /theme-item-space/);
  assert.match(itemCSS, /theme-item-description-leading/);
  assert.match(fieldCSS, /theme-field-gap/);
  assert.match(fieldCSS, /theme-field-label-line-height/);
  assert.match(layoutCSS, /theme-field-group-gap/);
});

check('Editorial FieldSeparator policy matches pinned Sera hidden instances', () => {
  const expected=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
  for(const style of expected){
    const compiled=model.compileTheme(model.normalizeConfig({style})).body;
    const m=compiled.match(/--qxframe9a7c2-theme-field-separator-display:\s*(none|block);/);
    assert.ok(m,style+' missing FieldSeparator role');
    assert.equal(m[1],style==='sera'?'none':'block',style+' authored FieldSeparator visibility');
  }
  const css=read('preview.css');
  assert.match(css,/\.pv-divider-bleed\s*\{[^}]*display:var\(--qxframe9a7c2-field-separator-display,var\(--qxframe9a7c2-theme-field-separator-display,block\)\)/,
    'public local override must precede generic Theme visibility policy');
});

check('Preview 01 source-local Empty / FieldSeparator and FAQ Accordion geometry', () => {
  const html = read('preview-01.html');
  for (const id of ['empty-distribute-track','empty-connect-bank','empty-explore-catalog']) {
    const entry = html.slice(html.indexOf('data-card="' + id + '"'), html.indexOf('<!-- @end ' + id + ' -->'));
    assert.match(entry, /class="qxframe9a7c2-empty is-composed" style="--qxframe9a7c2-empty-padding:1rem"/, id + ' needs source p-4 override');
  }
  const prefs = html.slice(html.indexOf('data-card="preferences"'), html.indexOf('<!-- @end preferences -->'));
  assert.equal((prefs.match(/class="qxframe9a7c2-divider pv-divider-bleed"/g) || []).length, 2,
    'Preferences must have two source -my-4 field separators');
  const empty = fs.readFileSync(path.join(root,'src/styles/components/empty.css'),'utf8');
  assert.match(empty, /padding:var\(--qxframe9a7c2-empty-padding,var\(--_qxframe9a7c2-empty-inset\)\)/,
    'local Empty padding must not affect structural media/title size');
  assert.match(empty, /margin-block-end:\.5rem;/);
  const css = read('preview.css');
  assert.match(css, /\.pv-divider-bleed\s*\{[^}]*height:1\.25rem;[^}]*margin-block:-1rem;/,
    'FieldSeparator owns 20px source layout height and -16px margins');
  assert.match(css, /\.pv-divider-bleed::after\s*\{[^}]*height:1px;/,
    'separator line stays 1px within 20px layout slot');
  assert.match(fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8'), /\.qxframe9a7c2-collapse\.is-native>\.qxframe9a7c2-collapse-item>summary\.qxframe9a7c2-collapse-header\{[^}]*padding:var\(--qxframe9a7c2-theme-accordion-padding\)/);
  const levels = {vega:16,nova:10,maia:16,lyra:10,mira:8,luma:16,sera:16,rhea:16};
  for (const [style,px] of Object.entries(levels)) {
    const compiled = model.compileTheme(model.normalizeConfig({style})).body;
    const m=compiled.match(/--qxframe9a7c2-theme-accordion-padding:\s*([^;]+);/);
    assert.ok(m,style+' missing Accordion inset');
    assert.equal(parseFloat(m[1])*16,px,style+' Accordion inset');
  }
});

check('Adaptive Calendar source-style cell/row geometry consumes shared tokens', () => {
  const picker=fs.readFileSync(path.join(root,'src/styles/components/picker-family.css'),'utf8');
  const html=read('preview-01.html'),script=read('preview-cards.js');
  assert.match(picker,/\.qxframe9a7c2-calendar\.is-adaptive-month/);
  for(const index of [29,36])assert.ok(picker.includes('nth-child('+index+').is-outside'),'complete outside week selector '+index);
  assert.match(script,/calendarRoot\.classList\.add\('is-adaptive-month'\)/);
  assert.match(html.slice(html.indexOf('data-card="upcoming-payments"'),html.indexOf('<!-- @end upcoming-payments -->')),/data-pv-calendar-layout="adaptive-month"/);
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const px=name=>parseFloat(body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1])*16;
    assert.equal(px('calendar-padding'),['nova','lyra'].includes(style)?8:12,style+' calendar inset');
    assert.equal(px('calendar-cell-size'),style==='sera'?36:40,style+' source responsive cell');
  }
});

check('Upcoming Payments Calendar follows source today-selected date rather than 2024 transaction copy', () => {
  const html=read('preview-01.html');
  const card=html.slice(html.indexOf('data-card="upcoming-payments"'),html.indexOf('<!-- @end upcoming-payments -->'));
  assert.match(card,/data-pv-calendar\b[^>]*\bdata-pv-calendar-layout="adaptive-month"[^>]*\bdata-value="today"/,
    'Upcoming Payments must retain its date and opt in to shared adaptive Calendar layout');
  assert.doesNotMatch(card,/data-pv-calendar data-value="2024-04-15"/);
  const mounting=read('preview-cards.js');
  assert.match(mounting,/authoredValue === 'today' \? new Date\(\)/,
    'Calendar instance configuration must supply live today via the QX Calendar public API');
  assert.doesNotMatch(mounting,/Date\.parse\(authoredValue\)/,'do not introduce a replacement Calendar parser');
});

check('Dividend Income uses the pinned Item sibling layout rather than an ItemActions wrapper', () => {
  const html=read('preview-01.html');
  const dividend=html.slice(html.indexOf('data-card="dividend-income"'),
    html.indexOf('<!-- @end dividend-income -->'));
  assert.equal((dividend.match(/class="qxframe9a7c2-item is-muted"/g)||[]).length,4);
  assert.equal((dividend.match(/class="pv-mini-chart"/g)||[]).length,4);
  assert.equal((dividend.match(/class="pv-text-sm pv-semibold pv-num"/g)||[]).length,4);
  assert.doesNotMatch(dividend,/qxframe9a7c2-item-actions/,
    'the original shadcn chart and amount are direct Item flex children, not an ItemActions group');
});

check('Source native Accordion trigger retains the one-pixel transparent layout border', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-collapse\.is-native>\.qxframe9a7c2-collapse-item>summary\.qxframe9a7c2-collapse-header\{[^}]*border:1px solid transparent;/,
    'all shadcn AccordionTrigger variants use border border-transparent (two layout pixels)');
});

check('Accordion disclosure icon top offset tracks available source line height', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  assert.match(css,/margin-top:clamp\(0rem,calc\(var\(--qxframe9a7c2-theme-accordion-line-height,1\.25rem\) - 1rem\),\.125rem\)/,
    '16px lyric line leaves no spare space; 20px source line retains 2px');
});

check('Native Accordion typography uses pinned component line boxes instead of body leading', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  assert.match(css,/line-height:var\(--qxframe9a7c2-theme-accordion-line-height,1\.25rem\)/);
  assert.ok(read('tokens.js').includes("L('accordion-line-height'"));
  assert.ok(read('compiler.js').includes("root['accordion-line-height']"));
  const expected={vega:20,nova:20,maia:20,lyra:16,mira:19.5,luma:20,sera:20,rhea:20};
  for(const [style,px] of Object.entries(expected)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const hit=body.match(/--qxframe9a7c2-theme-accordion-line-height:\s*([^;]+);/);
    assert.ok(hit,style+' line-height Theme input');
    assert.equal(parseFloat(hit[1])*16,px,style+' pinned Accordion line box');
  }
});

check('Source Accordion frame and Item intrinsic wrapping are shared Theme/component rules', () => {
  const compiler=read('compiler.js'),tokens=read('tokens.js');
  const collapse=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const html=read('preview-01.html');
  for(const token of ['accordion-framed','accordion-overflow','accordion-trigger-gap']){
    assert.ok(compiler.includes("root['"+token+"']"),token+' Theme compiler');
    assert.ok(tokens.includes("L('"+token+"'"),token+' closed Token schema');
    assert.ok(collapse.includes('var(--qxframe9a7c2-theme-'+token),token+' shared consumer');
  }
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const capture=name=>body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1];
    const framed=['maia','mira','luma','rhea'].includes(style);
    assert.equal(capture('accordion-framed'),framed?'1':'0',style+' source framed recipe');
    assert.equal(capture('accordion-overflow'),framed?'hidden':'visible',style+' source clip recipe');
    assert.equal(parseFloat(capture('accordion-trigger-gap'))*16,
      ['maia','mira','luma','sera','rhea'].includes(style)?24:0,style+' source icon gap');
  }
  assert.match(item,/\.qxframe9a7c2-item-content\.is-intrinsic\{min-width:auto;flex:1 1 0%\}/,
    'pinned ItemContent flex-1 is 0% basis, not a 0px flex basis');
  assert.match(item,/\.qxframe9a7c2-item-title\.is-wrapping\{display:flex;width:fit-content/);
  const dividend=html.slice(html.indexOf('data-card="dividend-income"'),
    html.indexOf('<!-- @end dividend-income -->'));
  assert.equal((dividend.match(/class="qxframe9a7c2-item-content is-intrinsic"/g)||[]).length,4);
  assert.equal((dividend.match(/class="qxframe9a7c2-item-title is-wrapping"/g)||[]).length,4,
    'all four Dividend titles share the same intrinsic source ItemTitle rules');
});

check('ItemMedia icon and ItemGroup size variants follow pinned shadcn sources', () => {
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  assert.match(item,/\.qxframe9a7c2-item-media\.is-icon\{\s*width:1rem;height:1rem;border:0;border-radius:0;background:transparent\}/,
    'ItemMedia icon must be unboxed 16px; EmptyMedia retains its own boxed 32/40px recipe');
  assert.match(item,/\.qxframe9a7c2-item-group\{[^}]*--_qxframe9a7c2-static-item-group-gap:1rem/,'default group gap 16px');
  assert.match(item,/gap:var\(--qxframe9a7c2-item-group-gap,var\(--_qxframe9a7c2-static-item-group-gap\)\)/,
    'public per-instance ItemGroup gap overrides inferred size');
  assert.match(item,/\.qxframe9a7c2-item-group:has\(>\.qxframe9a7c2-item\.is-sm\)\{--_qxframe9a7c2-static-item-group-gap:\.625rem\}/,'sm group gap 10px');
  assert.match(item,/\.qxframe9a7c2-item-group:has\(>\.qxframe9a7c2-item\.is-xs\)\{--_qxframe9a7c2-static-item-group-gap:\.5rem\}/,'xs group gap 8px');
  const html=read('preview-01.html');
  const kitchen=html.slice(html.indexOf('data-card="kitchen-island"'),html.indexOf('<!-- @end kitchen-island -->'));
  assert.equal((kitchen.match(/class="qxframe9a7c2-item-media is-icon"/g)||[]).length,4);
  assert.doesNotMatch(kitchen,/qxframe9a7c2-item-media"><span class="qxframe9a7c2-item-media is-icon"/,
    'Kitchen previously rendered a duplicated media wrapper in each slider row');
});

check('Pinned Radio Field and SidebarMenu static compositions use shared framework classes', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const preview=read('preview-01.html'),app=read('preview.css'),compiled=read('compiler.js');
  assert.match(css,/\.qxframe9a7c2-check-field\.is-choice\{/);
  assert.match(css,/padding-block-end:var\(--qxframe9a7c2-choice-field-padding-bottom,/,
    'source pb-2.5 is a local public option not an app-owned padding override');
  assert.match(css,/\.qxframe9a7c2-field-title\{/);
  assert.match(css,/\.qxframe9a7c2-sidebar-menu-button\{/);
  assert.match(css,/\.qxframe9a7c2-sidebar-group-label\{/);
  for(const token of ['choice-field-inset','sidebar-menu-button-height']){
    assert.ok(read('tokens.js').includes("L('"+token+"'"),token+' Token schema');
    assert.ok(compiled.includes("root['"+token+"']"),token+' Theme recipe');
    assert.ok(css.includes('var(--qxframe9a7c2-theme-'+token),token+' shared consumer');
  }
  const receiving=preview.slice(preview.indexOf('data-card="receiving-method"'),preview.indexOf('<!-- @end receiving-method -->'));
  assert.equal((receiving.match(/class="qxframe9a7c2-check-field is-choice pv-choice-field"/g)||[]).length,2);
  assert.equal((receiving.match(/class="qxframe9a7c2-field-title"/g)||[]).length,2);
  const sidebar=preview.slice(preview.indexOf('data-card="sidebar-nav"'),preview.indexOf('<!-- @end sidebar-nav -->'));
  assert.equal((sidebar.match(/class="qxframe9a7c2-sidebar-menu-button/g)||[]).length,18);
  assert.doesNotMatch(app,/\.pv-nav-button(?:\:hover|\.is-active)?\s*\{/);
  const expectedChoice={vega:12,nova:10,maia:16,lyra:8,mira:8,luma:16,sera:16,rhea:16};
  for(const style of Object.keys(expectedChoice)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const px=name=>parseFloat(body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1])*16;
    assert.equal(px('choice-field-inset'),expectedChoice[style],style+' pinned Field child padding');
    assert.equal(px('sidebar-menu-button-height'),['maia','luma','sera'].includes(style)?36:32,style+' pinned sidebar row height');
  }
});

check('Receiving Method radio choices use shared Field composition, not custom Cards', () => {
  const html=read('preview-01.html');
  const section=html.slice(html.indexOf('data-card="receiving-method"'),
    html.indexOf('<!-- @end receiving-method -->'));
  assert.equal((section.match(/class="qxframe9a7c2-check-field is-choice pv-choice-field"/g)||[]).length,2);
  assert.equal((section.match(/class="qxframe9a7c2-field-content"/g)||[]).length,2);
  assert.match(section,/class="qxframe9a7c2-choice-group"/,'source RadioGroup must consume shared ChoiceGroup');
  const compos=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(compos,/\.qxframe9a7c2-choice-group\{[^}]*var\(--qxframe9a7c2-choice-group-columns,var\(--qxframe9a7c2-theme-choice-group-columns,2\)\)/,
    'public local column override has precedence over Theme columns');
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const m=theme.match(/--qxframe9a7c2-theme-choice-group-columns:\s*([12]);/);
    assert.ok(m,style+' missing ChoiceGroup theme role');
    assert.equal(+m[1],style==='sera'?1:2,style+' source choice columns');
  }

  assert.doesNotMatch(section,/pv-choice-card/,'no invented private Radio choice surface');
  const css=read('preview.css');
  assert.match(css,/\.pv-choice-field\s*\{\s*--qxframe9a7c2-choice-field-padding-bottom:\s*\.625rem;/,
    'pinned Field option sets 10px local inset via public component variable');
  const shared=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(shared,/padding-block-end:var\(--qxframe9a7c2-choice-field-padding-bottom,/,
    'shared CheckField consumes authored source pb-2.5 rather than app-owned padding');
  assert.doesNotMatch(css,/\.pv-choice-card(?:\s|\{|\:)/,'obsolete custom Card styling must be absent');
});

check('Sera editorial ItemTitle consumes shared theme text transformation rather than forcing nowrap', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const html=read('preview-01.html');
  const card=html.slice(html.indexOf('<!-- @card dividend-income -->'),html.indexOf('<!-- @end dividend-income -->'));
  assert.match(css,/\.qxframe9a7c2-item-title\{[^}]*text-transform:var\(--qxframe9a7c2-theme-control-transform,none\)/);
  assert.doesNotMatch(css,/\.qxframe9a7c2-item-title\.is-intrinsic-line\{/,
    'editorial sizing belongs to the Theme and the shared Item, not a forced wrap modifier');
  assert.equal((card.match(/class="qxframe9a7c2-item-title is-wrapping"/g)||[]).length,4);
  const expected={vega:'none',nova:'none',maia:'none',lyra:'none',mira:'none',luma:'none',sera:'uppercase',rhea:'none'};
  for(const [style,transform] of Object.entries(expected)){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const actual=theme.match(/--qxframe9a7c2-theme-control-transform:\s*([^;]+);/)?.[1];
    assert.equal(actual,transform,style+' shared editorial text transformation');
  }
});

check('Payments Item flex basis and Kitchen Slider intrinsic footprint are source-aligned', () => {
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const slider=fs.readFileSync(path.join(root,'src/styles/components/slider.css'),'utf8');
  const html=read('preview-01.html');
  assert.match(item,/\.qxframe9a7c2-item-content\{display:flex;flex:1 1 0;/,
    'ItemContent uses pinned flex-1 zero basis and avoids wrapping trailing icons');
  assert.match(item,/\.qxframe9a7c2-item:has\(\.qxframe9a7c2-item-desc\)>\.qxframe9a7c2-item-media\s*\{\s*align-self:flex-start;\s*transform:translateY\(\.125rem\);/,
    'Pinned descriptive ItemMedia must align at the top, shifted down 2px');
  assert.match(item,/\.qxframe9a7c2-item-media\{[^}]*gap:\.5rem/,
    'ItemMedia consumes the pinned 8px internal glyph gap');
  assert.match(slider,/height:var\(--qxframe9a7c2-slider-height,var\(--_qxframe9a7c2-control-height\)\)/,
    'Slider root height accepts an inherited local variable while preserving default control footprint');
  const kitchen=html.slice(html.indexOf('data-card="kitchen-island"'),html.indexOf('<!-- @end kitchen-island -->'));
  assert.equal((kitchen.match(/style="--qxframe9a7c2-slider-height:var\(--qxframe9a7c2-theme-slider-thumb\)"/g)||[]).length,4,
    'All four Kitchen sliders must use the theme thumb height, not control button height');
  const roller=html.slice(html.indexOf('data-card="roller-shades"'),html.indexOf('<!-- @end roller-shades -->'));
  assert.equal((roller.match(/class="pv-slider pv-grow" style="--qxframe9a7c2-slider-height:var\(--qxframe9a7c2-theme-slider-thumb\)"/g)||[]).length,1,
    'Roller Shades must use theme thumb height like Kitchen without modifying shared Slider defaults');
});

check('FieldContent gap and Item text clamps preserve pinned visual hierarchy', () => {
  const styles={vega:4,nova:2,maia:4,lyra:2,mira:2,luma:4,sera:4,rhea:4};
  for(const [style,pixels] of Object.entries(styles)){
    const css=model.compileTheme(model.normalizeConfig({style})).body;
    const hit=css.match(/--qxframe9a7c2-theme-field-content-gap:\s*([^;]+);/);
    assert.ok(hit,style+' FieldContent role');
    assert.equal(parseFloat(hit[1])*16,pixels,style+' FieldContent gap');
  }
  const compos=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  assert.match(compos,/\.qxframe9a7c2-field-content\{[^}]*theme-field-content-gap/);
  assert.match(item,/flex-wrap:wrap;align-items:center;width:100%/);
  assert.match(item,/\.qxframe9a7c2-item-title\{[^}]*-webkit-line-clamp:1/);
  assert.match(item,/\.qxframe9a7c2-item-desc\{[^}]*-webkit-line-clamp:2/);
  const html=read('preview-01.html');
  for(const [card,expected] of [['preferences',2],['notification-settings',5]]){
    const section=html.slice(html.indexOf('data-card="'+card+'"'),html.indexOf('<!-- @end '+card+' -->'));
    assert.equal((section.match(/class="qxframe9a7c2-field-content"/g)||[]).length,expected,card+' uses shared FieldContent');
  }
});

check('Checkbox Field uses the shared horizontal Field gap role', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-check-field\{[^}]*gap:var\(--qxframe9a7c2-check-field-gap,var\(--qxframe9a7c2-theme-field-gap/);
  const expected={vega:12,nova:8,maia:12,lyra:8,mira:8,luma:12,sera:12,rhea:12};
  for(const [style,pixels] of Object.entries(expected)){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const m=theme.match(/--qxframe9a7c2-theme-field-gap:\s*([^;]+);/);
    assert.ok(m,style+' has Field role');
    assert.equal(parseFloat(m[1])*16,pixels,style+' Checkbox Field gap');
  }
});

check('FAQ TabsList source height uses public Tabs slot without global overrides', () => {
  const css=read('preview.css');
  assert.match(css,/\.pv-tabs-full\s*\{[^}]*--qxframe9a7c2-tabs-height:\s*calc\(max\(2rem,var\(--qxframe9a7c2-theme-control-height\)\)\s*-\s*\.5rem\)/,
    'FAQ uses source Tab rail height through the public Tabs size API');
  const shared=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(shared,/--_qxframe9a7c2-tabs-height:var\(--qxframe9a7c2-tabs-height,/,
    'public Tab height must continue to consume author override');
});

check('FAQ Accordion description consumes its source-locked component line-height role', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-collapse\.is-native>details>\.qxframe9a7c2-collapse-content\{[^}]*line-height:var\(--qxframe9a7c2-theme-accordion-line-height,1\.25rem\)/,
    'Accordion uses its distinct source text line box, not general body leading');
  const expected={vega:20,nova:20,maia:20,lyra:16,mira:19.5,luma:20,sera:20,rhea:20};
  for(const [style,px] of Object.entries(expected)){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const token=theme.match(/--qxframe9a7c2-theme-accordion-line-height:\s*([^;]+);/);
    assert.ok(token,style+' must emit the source Accordion line-height role');
    assert.equal(parseFloat(token[1])*16,px,style+' source-computed Accordion line box');
  }
});

check('FieldContent labels consume shared Theme lines and FAQ trigger gap follows pinned styles', () => {
  const composition=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const preview=read('preview.css');
  assert.match(composition,/\.qxframe9a7c2-field-content>\.qxframe9a7c2-form-label\{[^}]*line-height:var\(--qxframe9a7c2-theme-field-label-line-height\)/,
    'FieldContent label should share semantic typography with FormField');
  assert.match(composition,/\.qxframe9a7c2-field-content>\.qxframe9a7c2-form-label\{[^}]*font-weight:var\(--qxframe9a7c2-theme-text-weight-label\)/);
  assert.match(fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8'),
    /\.qxframe9a7c2-collapse\.is-native>\.qxframe9a7c2-collapse-item>summary\.qxframe9a7c2-collapse-header\{[^}]*gap:var\(--qxframe9a7c2-theme-accordion-trigger-gap,0\);/,
    'upstream AccordionTrigger gap is 24px in framed/Sera styles, zero in other source recipes');
});

check('Pinned SidebarMenu gap and SidebarGroup padding across eight styles', () => {
  const gaps={vega:4,nova:0,maia:4,lyra:0,mira:1,luma:2,sera:2,rhea:2};
  for(const [style,gap] of Object.entries(gaps)){
    const css=model.compileTheme(model.normalizeConfig({style})).body;
    const get=name=>{
      const m=css.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'));
      assert.ok(m,style+' missing '+name);
      const v=m[1].trim();return parseFloat(v)*(v.endsWith('rem')?16:1);
    };
    assert.equal(get('sidebar-menu-gap'),gap,style+' sidebar menu gap');
    assert.equal(get('sidebar-group-padding-block'),style==='mira'?4:8,style+' sidebar group default inset');
  }
  const css=read('preview.css');
  assert.match(css,/\.pv-nav\s*\{[^}]*gap:\s*var\(--qxframe9a7c2-theme-sidebar-menu-gap/);
  assert.match(css,/\.pv-nav-card \.pv-nav-group:first-child\s*\{\s*padding-bottom:\s*0\.25rem/);
  assert.match(css,/\.pv-nav-card \.pv-nav-group:last-child\s*\{\s*padding-top:\s*0\.25rem/);
});

check('QX shape, Luma switch and shared layout contracts', () => {
  const file = p => fs.readFileSync(path.join(root, p), 'utf8');
  const defaultCss = model.compileTheme(model.defaultConfig()).body;
  assert.match(defaultCss, /--qxframe9a7c2-theme-switch-thumb-extra:\s*0rem;/);
  const luma = model.compileTheme(model.normalizeConfig({ style: 'luma' })).body;
  assert.match(luma, /--qxframe9a7c2-theme-switch-thumb-extra:\s*0\.5rem;/);
  const zero = model.compileTheme(model.normalizeConfig({ style: 'nova', radius: 'none' })).body;
  for (const key of ['radius-radio', 'radius-switch', 'radius-switch-thumb', 'radius-avatar']) {
    assert.match(zero, new RegExp('--qxframe9a7c2-theme-' + key + ': 0(?:rem)?;'), 'global sharp shape: ' + key);
  }
  const lyraDefault = model.compileTheme(model.normalizeConfig({ style: 'lyra', radius: 'default' })).body;
  assert.match(lyraDefault, /--qxframe9a7c2-theme-radius-radio:\s*62\.5rem;/, 'source-locked Lyra circle remains by default');
  const explicit = model.compileTheme(model.normalizeConfig({ style: 'nova', radius: 'none', ext: { shapeRadio: 'circle' } })).body;
  assert.match(explicit, /--qxframe9a7c2-theme-radius-radio:\s*62\.5rem;/);
  const button = file('src/styles/main/theme-visual-v2.css');
  assert.doesNotMatch(button, /\.qxframe9a7c2-button\.is-square\s*\{\s*border-radius:\s*0;/);
  const radio = file('src/styles/components/choice-visual.css');
  assert.match(radio, /radio-dot-radius/);
  const composition = file('src/styles/components/composition.css');
  for (const name of ['flex', 'stack', 'field-group', 'check-field', 'divider', 'swatch-cell']) {
    assert.ok(composition.includes('.qxframe9a7c2-' + name), 'missing shared static primitive ' + name);
  }
  for (const page of ['preview-01.html', 'preview-02.html']) {
    assert.doesNotMatch(read(page), /class="[^"]*\b(?:pv-stack|pv-field-group|pv-check-field|pv-swatch-cell|pv-separator|pv-row|pv-item|pv-field|create-grid|create-col|create-pair)\b/, 'duplicate private primitive ' + page);
  }
  assert.match(composition, /form-input-group-prefix/);
  assert.match(composition, /form-input-group-suffix/);
  const privateCss = read('preview.css');
  for (const oldName of ['pv-stack', 'pv-row', 'pv-item', 'pv-field-group', 'pv-separator', 'pv-swatch-cell', 'pv-kbd', 'pv-skeleton', 'pv-spinner', 'pv-progress', 'create-grid', 'create-col']) {
    assert.doesNotMatch(privateCss, new RegExp('\\.' + oldName + '(?:\\b|\\.)'), 'private duplicate not removed: ' + oldName);
  }
  for (const role of ['qxframe9a7c2-kbd','qxframe9a7c2-skeleton','qxframe9a7c2-spinner-icon','qxframe9a7c2-progress']) {
    const count = ['preview-01.html','preview-02.html'].reduce((n,page)=>n+(read(page).match(new RegExp('class="[^"]*' + role, 'g'))||[]).length,0);
    assert.ok(count>0, 'shared static example missing: ' + role);
  }

});

check('option tables match v3 §4', () => {
  assert.deepEqual(data.STYLES.map(s => s.value), ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea']);
  assert.deepEqual(data.BASE_COLORS, ['neutral', 'stone', 'zinc', 'mauve', 'olive', 'mist', 'taupe']);
  assert.equal(Object.keys(data.THEMES).length, 24);
  assert.deepEqual(data.FONTS.map(f => f.value), ['system', 'sans', 'serif', 'mono']);
  assert.deepEqual(data.RADII.map(r => r.rem), [null, '0rem', '0.25rem', '0.45rem', '0.625rem', '0.875rem', '1.125rem']);
  for (const axis of data.ALL_EXT_AXES) {
    assert.ok(axis.options.length <= 7, axis.key + ' has more than 7 levels');
    for (const style of Object.keys(data.STYLE_PRESETS)) assert.ok(axis.defaults[style] !== undefined, axis.key + ' lacks a default for ' + style);
  }
  for (const axis of data.EXT_AXES.filter(a => !['keyboardFocus', 'pointerFocus'].includes(a.key))) {
    for (const [style, value] of Object.entries(axis.defaults)) assert.ok(axis.options.some(o => o.value === value), `${axis.key}.${style} default ${value} is not an option`);
  }
});

check('default configuration is Nova + neutral (v3 §5.10)', () => {
  const c = model.defaultConfig();
  assert.equal(c.style, 'nova'); assert.equal(c.baseColor, 'neutral'); assert.equal(c.theme, 'neutral');
  assert.equal(model.serializeConfig(c), '');
});

check('normalization follows shadcn rules', () => {
  const c = model.normalizeConfig({ baseColor: 'stone', theme: 'neutral', chartColor: 'zinc', menuColor: 'default-translucent', menuAccent: 'bold', ext: { density: 'nope', padding: 'p28' } });
  assert.equal(c.theme, 'stone', 'theme outside the base color list falls back to the base color');
  assert.equal(c.chartColor, 'stone');
  assert.equal(c.menuAccent, 'subtle', 'translucent menu forces the subtle accent');
  assert.deepEqual(c.ext, { padding: 'p28' }, 'unknown extension values are dropped');
  assert.equal(model.normalizeConfig({ style: 'bogus' }).style, 'nova');
});

check('URL parameters round-trip readable configuration', () => {
  const c = model.normalizeConfig({ style: 'sera', radius: 'md', theme: 'rose', ext: { density: 'compact', shapeSwitch: 'square' } });
  const query = model.serializeConfig(c, '02');
  assert.equal(query, 'style=sera&theme=rose&radius=md&density=compact&shape-switch=square&item=02');
  const parsed = model.parseConfig('?' + query);
  assert.equal(model.serializeConfig(parsed.config), model.serializeConfig(c));
  assert.equal(parsed.item, '02');
});

check('follow-style resolution keeps explicit values', () => {
  const c = model.normalizeConfig({ style: 'mira', ext: { padding: 'p32' } });
  const r = model.resolveConfig(c);
  assert.equal(r.ext.density, 'dense', 'Mira follows the 28 density');
  assert.equal(r.ext.padding, 'p32', 'explicit value survives the style');
  const r2 = model.resolveConfig({ ...c, style: 'sera' });
  assert.equal(r2.ext.density, 'loose', 'unset axes follow the new style');
  assert.equal(r2.ext.padding, 'p32');
  assert.equal(model.resolveConfig(model.normalizeConfig({ style: 'lyra' })).radiusValue, 'none');
});

check('export header carries version, time and full readable configuration; import restores it', () => {
  const c = model.normalizeConfig({ style: 'luma', baseColor: 'mauve', theme: 'violet', chartColor: 'yellow', font: 'serif', fontHeading: 'mono', radius: 'xl', menuColor: 'inverted', menuAccent: 'bold', ext: { inputLook: 'borderless', motion: 'fast' } });
  const { css } = model.compileTheme(c, { version: '9.9.9', generatedAt: '2026-10-07T00:00:00.000Z' });
  assert.match(css, /^\/\*!\n \* QXFRAME9A7C2 THEME\n \* 框架版本: 9\.9\.9\n \* 生成时间: 2026-10-07T00:00:00\.000Z/);
  for (const param of [...Object.values(model.MAIN_PARAMS), ...data.ALL_EXT_AXES.map(a => a.param)]) assert.match(css, new RegExp(`\\(${param}\\): `), 'header lacks ' + param);
  const back = model.parseThemeHeader(css);
  assert.ok(back.ok, JSON.stringify(back.errors));
  assert.equal(model.serializeConfig(back.config), model.serializeConfig(c));
});

check('import reports reasons and never returns a config on error', () => {
  const none = model.parseThemeHeader(':root{--x:1}');
  assert.equal(none.ok, false); assert.match(none.errors[0], /头部注释/);
  const css = model.compileTheme(model.defaultConfig()).css;
  const bad = model.parseThemeHeader(css.replace('(density): follow', '(density): huge').replace('(style): nova', '(style): zeta'));
  assert.equal(bad.ok, false); assert.equal(bad.config, undefined);
  assert.ok(bad.errors.some(e => e.includes('density') && e.includes('huge')));
  assert.ok(bad.errors.some(e => e.includes('style') && e.includes('zeta')));
  const unknown = model.parseThemeHeader(css.replace('(density): follow', '(densty): follow'));
  assert.equal(unknown.ok, false); assert.ok(unknown.errors.some(e => e.includes('densty')));
});

check('shuffle: main panel only, locks kept, shadcn biases', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const base = model.normalizeConfig({ style: 'lyra', ext: { density: 'touch' } });
  for (let i = 0; i < 200; i++) {
    const next = model.randomizeConfig(base, new Set(['style', 'baseColor']), rand);
    assert.equal(next.style, 'lyra'); assert.equal(next.baseColor, 'neutral');
    assert.deepEqual(next.ext, { density: 'touch' }, 'shuffle never touches extension axes');
    assert.equal(next.font, 'mono', 'Lyra shuffles to the mono font');
    assert.equal(next.radius, 'none', 'Lyra shuffles to the square radius');
    assert.ok(data.themesForBaseColor(next.baseColor).includes(next.theme));
    const pairing = data.CHART_COLOR_PAIRINGS[next.theme];
    if (pairing) assert.ok(pairing.includes(next.chartColor), `chart ${next.chartColor} not paired with ${next.theme}`);
    if (data.isTranslucentMenu(next.menuColor)) assert.equal(next.menuAccent, 'subtle');
  }
});

check('reset: style preset + follow-style axes; locks kept', () => {
  const c = model.normalizeConfig({ style: 'sera', theme: 'rose', font: 'mono', radius: 'xl', ext: { density: 'touch', motion: 'none' } });
  const r = model.resetConfig(c, new Set(['font', 'motion']));
  assert.equal(r.style, 'sera'); assert.equal(r.baseColor, 'taupe'); assert.equal(r.theme, 'taupe'); assert.equal(r.fontHeading, 'serif');
  assert.equal(r.font, 'mono', 'locked main option is not reset');
  assert.equal(r.radius, 'default');
  assert.deepEqual(r.ext, { motion: 'none' }, 'unlocked axes return to follow-style, locked ones stay');
});



check('audit #17: theme import rejects incomplete, duplicate, conflicting and malformed headers', () => {
  const cfg = model.normalizeConfig({ style: 'luma', radius: 'xl', ext: { inputLook: 'soft' } });
  const css = model.compileTheme(cfg).css;
  const radiusLine = css.match(/^ \*   [^\n]*\(radius\):[^\n]*$/m)?.[0];
  assert.ok(radiusLine, 'exported radius must be present');
  const failures = [
    css.replace(radiusLine + '\n', ''),
    css.replace(radiusLine, radiusLine + '\n' + radiusLine),
    css.replace(/ \*   [^\n]*\(density\):[^\n]*\n/, ''),
    css.replace(radiusLine, ' *   broken radius entry'),
    css.replace(/ \*   [^\n]*\(base\):[^\n]*\n/, ''),
    css.replace('(menu): default', '(menu): default-translucent').replace('(accent): subtle', '(accent): bold')
  ];
  for (const [index, candidate] of failures.entries()) {
    const result = model.parseThemeHeader(candidate);
    assert.equal(result.ok, false, 'invalid import #' + index);
    assert.equal(result.config, undefined, 'invalid import must never yield configuration');
    assert.ok(result.errors.length, 'invalid import must include an actionable reason');
  }
  assert.equal(model.parseThemeHeader(css).ok, true, 'complete current export must still import');
});

check('audit #18: shuffle/reset respect locked theme and chart colors under base changes', () => {
  const start = model.normalizeConfig({
    style: 'sera', baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral',
    menuColor: 'default', menuAccent: 'bold', ext: { density: 'dense' }
  });
  const locks = new Set(['theme','chartColor','menuAccent']);
  for (const random of [() => 0, () => .2, () => .9]) {
    const next = model.randomizeConfig(start, locks, random);
    for (const key of locks) assert.equal(next[key], start[key], key + ' stays locked');
    assert.ok(data.themesForBaseColor(next.baseColor).includes(next.theme));
    assert.ok(data.themesForBaseColor(next.baseColor).includes(next.chartColor));
    assert.ok(!data.isTranslucentMenu(next.menuColor), 'locked bold menu accent cannot be normalized away');
    assert.deepEqual(next.ext, start.ext, 'extension values survive shuffling');
  }
  const reset = model.resetConfig(start, locks);
  assert.equal(reset.theme, 'neutral');
  assert.equal(reset.chartColor, 'neutral');
  assert.equal(reset.menuAccent, 'bold');
  assert.equal(reset.baseColor, 'neutral', 'reset cannot select incompatible taupe base');
});

check('audit #6/#7/#15/#21: shape and switch recipes plus full dual-mode inventory', () => {
  const token = (css, key) => css.match(new RegExp('--qxframe9a7c2-theme-' + key + ':\\s*([^;]+);'))?.[1];
  for (const style of data.STYLES.map(s => s.value)) {
    for (const switchLook of ['standard','wide']) {
      const body = model.compileTheme(model.normalizeConfig({style,ext:{switchLook}})).body;
      assert.equal(token(body,'switch-thumb-extra'), switchLook === 'wide' ? '0.5rem' : '0rem',
        style + '/' + switchLook + ' thumb width must follow switchLook, not style name');
    }
    const body = model.compileTheme(model.normalizeConfig({style})).body;
    const blocks = body.match(/^:root \{([\s\S]*?)\}\n\.dark \{([\s\S]*?)\}\n$/);
    assert.ok(blocks, style + ' light/dark blocks');
    const names = s => [...s.matchAll(/--qxframe9a7c2-theme-[a-z0-9-]+(?=:)/g)].map(m => m[0]);
    assert.deepEqual(names(blocks[2]), names(blocks[1]), style + ' .dark must contain full ordered token registry');
    for (const alloc of ['standard','balanced','rounded','compact','soft','smooth']) {
      const shape = model.compileTheme(model.normalizeConfig({ style, radius:'xl', ext:{radiusAlloc:alloc}})).body;
      assert.ok(parseFloat(token(shape,'radius-card')) * 16 <= 24.0001, style+'/'+alloc+' Card cap');
    }
  }
  const pill = model.compileTheme(model.normalizeConfig({style:'nova',radius:'none',ext:{controlShape:'pill'}})).body;
  assert.equal(token(pill,'radius-switch'),'62.5rem', 'explicit global pill survives radius:none');
  assert.equal(token(pill,'radius-switch-thumb'),'62.5rem');
  const square = model.compileTheme(model.normalizeConfig({style:'nova',radius:'none',ext:{controlShape:'pill',shapeSwitch:'square'}})).body;
  assert.equal(token(square,'radius-switch'),'0', 'explicit per-component shape overrides global pill');
});


check('audit #16: motion:none removes loading animation names, not just durations', () => {
  const none = model.compileTheme(model.normalizeConfig({ ext: { motion:'none' } })).body;
  const standard = model.compileTheme(model.normalizeConfig({ ext: { motion:'standard' } })).body;
  for (const name of ['skeleton-animation','spinner-icon-animation','loading-spin-animation']) {
    assert.match(none,new RegExp('--qxframe9a7c2-theme-' + name + ': none;'));
    assert.match(standard,new RegExp('--qxframe9a7c2-theme-' + name + ': qxframe9a7c2-'));
  }
  const css = fs.readFileSync(path.join(root,'src/styles/components/loading.css'),'utf8');
  for (const name of ['skeleton-animation','spinner-icon-animation','loading-spin-animation'])
    assert.ok(css.includes('var(--qxframe9a7c2-theme-' + name + ')'),name+' has a shared CSS consumer');
  assert.match(fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8'),/transition:\s*transform var\(--qxframe9a7c2-theme-duration-md\)/);
});

check('audit #22: accent-paired Item link states are owned by the shared Item CSS', () => {
  const shared = fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const privateCss = read('preview.css');
  assert.match(shared,/\.qxframe9a7c2-item-link:hover:not\(\.is-disabled\)/);
  assert.match(shared,/\.qxframe9a7c2-item-link:focus-visible:not\(\.is-disabled\)/);
  assert.match(shared,/background:var\(--qxframe9a7c2-theme-accent\);\s*color:var\(--qxframe9a7c2-theme-accent-foreground\)/);
  assert.match(shared,/\.qxframe9a7c2-item-link:hover:not\(\.is-disabled\)[^{]*\.qxframe9a7c2-item-desc/);
  assert.doesNotMatch(privateCss,/\.qxframe9a7c2-item-link(?::hover)?\s*\{/,
    'Preview must not own a second Item hover style');
  assert.match(fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8'),
    /\.qxframe9a7c2-sidebar-menu-button:hover:not\(\.is-active\)/,'SidebarMenu hover is muted and belongs to shared CSS');
  assert.doesNotMatch(privateCss,/\.pv-nav-button(?:\:hover)?\s*\{/,
    'preview must not own a second SidebarMenuButton paint rule');
});



check('Style-derived small Item maps pinned source padding while Preferences preserves Footer action width', () => {
  const html=read('preview-01.html');
  const prefs=html.slice(html.indexOf('<!-- @card preferences -->'),html.indexOf('<!-- @end preferences -->'));
  assert.match(prefs,/<footer class="qxframe9a7c2-card-footer is-gap-0">/);
  const expected={vega:10,nova:10,maia:12,lyra:10,mira:10,luma:12,sera:12,rhea:12};
  for(const [style,px] of Object.entries(expected)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const raw=name=>body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1];
    const parent=parseFloat(raw('item-space'))*16;
    const reduction=parseFloat(raw('item-sm-reduction'))*16;
    assert.equal(Math.max(10,parent-reduction),px,style+' pinned sm Item block inset');
  }
});

check('Embedded source TableRow owns interrow borders, not five TableCells', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/table.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-table\.is-embedded tbody tr:not\(:last-child\)\{\s*border-bottom:1px solid var\(--qxframe9a7c2-theme-border\)/);
  assert.match(css,/\.qxframe9a7c2-table\.is-embedded tbody tr:last-child\{border-bottom:0\}/);
  assert.match(css,/\.qxframe9a7c2-table\.is-embedded tbody tr>td\{border-bottom-width:0\}/);
});

check('Source Card action gap, compact Item, zero Stack and collapsed embedded Table', () => {
  const card=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  const comp=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const table=fs.readFileSync(path.join(root,'src/styles/components/table.css'),'utf8');
  const html=read('preview-01.html');
  assert.match(card,/\.qxframe9a7c2-card-header\{gap:var\(--qxframe9a7c2-card-header-gap,var\(--_qxframe9a7c2-card-heading-gap\)\);align-items:flex-start/);
  assert.doesNotMatch(card,/\.qxframe9a7c2-card-header,\.qxframe9a7c2-card-footer\{[^}]*gap:/,
    'only dedicated CardHeader/CardFooter rules own their respective gaps');
  assert.match(comp,/\.qxframe9a7c2-flex\.is-gap-0,\.qxframe9a7c2-stack\.is-gap-0\{--_qxframe9a7c2-layout-gap:0\}/);
  assert.match(item,/\.qxframe9a7c2-item\.is-sm\{--_qxframe9a7c2-static-item-space:max\(\.625rem,calc\(var\(--qxframe9a7c2-theme-item-space\) - var\(--qxframe9a7c2-item-sm-reduction,var\(--qxframe9a7c2-theme-item-sm-reduction,\.125rem\)\)\)\)\}/);
  assert.ok(read('compiler.js').includes("root['item-sm-reduction']"));
  assert.ok(read('tokens.js').includes("L('item-sm-reduction'"));
  assert.match(table,/\.qxframe9a7c2-table\.is-embedded\{[^}]*border-collapse:collapse;/);
  assert.match(comp,/\.qxframe9a7c2-form-label\.is-artwork-meta\{font-size:\.75rem;line-height:var\(--qxframe9a7c2-theme-artwork-label-leading,1rem\)\}/);
  assert.match(card,/\.qxframe9a7c2-card-description\.is-artwork-meta\{font-size:\.75rem;line-height:var\(--qxframe9a7c2-theme-artwork-description-leading,1rem\)\}/);
  const cover=html.slice(html.indexOf('<!-- @card cover-art -->'),html.indexOf('<!-- @end cover-art -->'));
  assert.match(cover,/qxframe9a7c2-form-label is-artwork-meta/);
  assert.match(cover,/qxframe9a7c2-card-description is-artwork-meta/);
  for(const token of ['artwork-label-leading','artwork-description-leading']){
    assert.ok(read('compiler.js').includes("root['"+token+"']"),token+' compiler');
    assert.ok(read('tokens.js').includes("L('"+token+"'"),token+' schema');
  }
  for(const [style,expectedLabel,expectedDesc] of [['vega',12,16],['sera',19.5,19.5]]){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const number=t=>parseFloat(body.match(new RegExp('--qxframe9a7c2-theme-'+t+':\\s*([^;]+);'))?.[1])*16;
    assert.equal(number('artwork-label-leading'),expectedLabel,style+' source Cover label line');
    assert.equal(number('artwork-description-leading'),expectedDesc,style+' source Cover description line');
  }
});

check('Pinned StatusBadge, optional Divider and CoverArtwork share component compositions', () => {
  const badge=fs.readFileSync(path.join(root,'src/styles/components/badge.css'),'utf8');
  const comp=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const cardCss=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const html=read('preview-01.html'),compiler=read('compiler.js'),tokens=read('tokens.js');
  assert.match(badge,/\.qxframe9a7c2-badge\.is-status-label\{/);
  assert.match(badge,/\.qxframe9a7c2-badge-indicator\{/);
  for(const key of ['badge-label-editorial','badge-label-font-size','badge-label-leading','badge-label-height']){
    assert.ok(compiler.includes("root['"+key+"']"),key+' Theme compiler');
    assert.ok(tokens.includes("L('"+key+"'"),key+' registered Theme input');
    assert.ok(badge.includes('var(--qxframe9a7c2-theme-'+key),key+' shared Badge consumer');
  }
  assert.match(comp,/\.qxframe9a7c2-divider\.is-theme-optional\{display:var\(--qxframe9a7c2-divider-display,var\(--qxframe9a7c2-theme-field-separator-display,block\)\)\}/);
  assert.match(cardCss,/\.qxframe9a7c2-card-footer\.is-column\{flex-direction:column;gap:var\(--qxframe9a7c2-card-footer-gap,\.5rem\)\}/);
  assert.match(item,/\.qxframe9a7c2-item\.is-artwork\{aspect-ratio:1\/1;justify-content:center\}/);
  assert.match(item,/\.qxframe9a7c2-item-artwork-label>svg\{[^}]*width:2\.5rem;height:2\.5rem/);
  const section=id=>html.slice(html.indexOf('<!-- @card '+id+' -->'),html.indexOf('<!-- @end '+id+' -->'));
  assert.match(section('claimable-balance'),/qxframe9a7c2-badge is-status-label/);
  assert.match(section('stock-performance'),/qxframe9a7c2-divider is-theme-optional/);
  assert.match(section('cover-art'),/qxframe9a7c2-card-footer is-column/);
  assert.match(section('cover-art'),/qxframe9a7c2-item-artwork-label/);
  const expectedFont={vega:12,nova:12,maia:12,lyra:12,mira:10,luma:12,sera:10,rhea:12};
  for(const style of Object.keys(expectedFont)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const value=name=>body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1];
    assert.equal(parseFloat(value('badge-label-font-size'))*16,expectedFont[style],style+' Badge font');
    assert.equal(value('badge-label-height'),style==='sera'?'auto':'1.25rem',style+' Badge height policy');
    assert.equal(value('field-separator-display'),style==='sera'?'none':'block',style+' Separator policy');
  }
});

check('FAQ Footer uses source full-width non-shrinking Button composition', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  const buttons=fs.readFileSync(path.join(root,'src/styles/components/button.css'),'utf8');
  const html=read('preview-01.html');
  const faq=html.slice(html.indexOf('<!-- @card faq -->'),html.indexOf('<!-- @end faq -->'));
  assert.match(css,/\.qxframe9a7c2-card-footer\.is-gap-0\{gap:0\}/);
  assert.match(buttons,/\.qxframe9a7c2-button\.is-block\{width:100%\}/);
  assert.match(buttons,/\.qxframe9a7c2-button\.is-no-shrink\{flex-shrink:0\}/);
  assert.match(faq,/<footer class="qxframe9a7c2-card-footer is-gap-0"/);
  assert.equal((faq.match(/qxframe9a7c2-button is-[^"]*is-block is-no-shrink"/g)||[]).length,2,
    'source FAQ has two full-width shrink-0 actions that occupy separate horizontal intrinsic widths');
  assert.doesNotMatch(faq,/<button[^>]*pv-full/,
    'FAQ must use framework Button semantics instead of app-owned forced flex grow');
});

check('Content-only Card and nested EmptyHeader match pinned Syncing State composition', () => {
  const cardCss=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  const emptyCss=fs.readFileSync(path.join(root,'src/styles/components/empty.css'),'utf8');
  const html=read('preview-01.html');
  const section=html.slice(html.indexOf('<!-- @card syncing-state -->'),html.indexOf('<!-- @end syncing-state -->'));
  assert.match(section,/qxframe9a7c2-card is-content-only" data-card="syncing-state"/);
  assert.match(section,/qxframe9a7c2-card-content is-flush/);
  assert.match(section,/qxframe9a7c2-empty-header"><div class="qxframe9a7c2-empty-media is-icon is-glyph-sm"/);
  assert.match(cardCss,/\.qxframe9a7c2-card\.is-content-only\{padding-block:var\(--_qxframe9a7c2-card-padding\)\}/);
  assert.match(cardCss,/\.qxframe9a7c2-card\.is-content-only>\.qxframe9a7c2-card-content:only-child\{padding:0\}/);
  assert.match(emptyCss,/margin-block-start:var\(--qxframe9a7c2-empty-description-offset,var\(--qxframe9a7c2-theme-empty-description-offset,0\)\)/);
  assert.ok(read('tokens.js').includes("L('empty-description-offset'"));
  assert.ok(read('compiler.js').includes("root['empty-description-offset']"));
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const value=theme.match(/--qxframe9a7c2-theme-empty-description-offset:\s*([^;]+);/)?.[1];
    assert.equal(parseFloat(value)*16,style==='sera'?2:0,style+' pinned EmptyDescription margin');
  }
});

check('Syncing State overrides only public Empty instance padding to pinned p-4', () => {
  const html=read('preview-01.html');
  const card=html.slice(html.indexOf('<!-- @card syncing-state -->'),html.indexOf('<!-- @end syncing-state -->'));
  assert.match(card,/qxframe9a7c2-empty is-composed" style="--qxframe9a7c2-empty-padding:1rem"/);
  const shared=fs.readFileSync(path.join(root,'src/styles/components/empty.css'),'utf8');
  assert.match(shared,/padding:var\(--qxframe9a7c2-empty-padding,var\(--_qxframe9a7c2-empty-inset\)\)/);
});

check('Loading Card uses shared 8px Flex/Stack gap instead of preview-owned geometry', () => {
  const html=read('preview-01.html');
  const card=html.slice(html.indexOf('<!-- @card loading-card -->'),html.indexOf('<!-- @end loading-card -->'));
  assert.match(card,/class="qxframe9a7c2-stack is-gap-2"/);
  assert.match(card,/class="qxframe9a7c2-flex is-gap-2"/);
  const shared=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(shared,/\.qxframe9a7c2-flex\.is-gap-2,\.qxframe9a7c2-stack\.is-gap-2\{--_qxframe9a7c2-layout-gap:0\.5rem\}/);
  assert.doesNotMatch(read('preview.css'),/\.pv-loading-skeleton-gap/);
});

check('multi-line Textarea does not inherit single-line Theme min-height', () => {
  const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  const shared=theme.slice(theme.indexOf('/* Controls and multi-line Textarea share typography'),theme.indexOf('  .qxframe9a7c2-input > .qxframe9a7c2-input-control',theme.indexOf('/* Controls and multi-line Textarea share typography')));
  assert.match(shared,/\.qxframe9a7c2-form-textarea\[class\]/);
  const groups=[...shared.matchAll(/\{([^{}]+)\}/g)].map(x=>x[1]);
  assert.ok(groups.length>=2,'separate multiline typography and singleline height rules');
  assert.doesNotMatch(groups[0],/min-height/,'Textareas must never be clamped by Control min-height');
  assert.match(groups[1],/min-height:\s*var\(--_qxframe9a7c2-control-height\)/,'single-line controls retain theme height');
  const forms=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  assert.match(forms,/\.qxframe9a7c2-form-textarea,\.qxframe9a7c2-native-form textarea\{min-height:5rem/);
});

check('Pinned Claimable CardTitle display typography and Payout shared Slider', () => {
  const css=read('preview.css');
  assert.doesNotMatch(css,/\.pv-text-5xl\s*\{/,'Card display typography belongs to shared Card');
  const title=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  assert.match(title,/\.qxframe9a7c2-card-title\.is-display\{[^}]*font-size:3rem;/);
  assert.match(title,/line-height:var\(--qxframe9a7c2-card-display-leading,var\(--qxframe9a7c2-theme-card-display-leading,1\)\)/);
  assert.ok(read('tokens.js').includes("L('card-display-leading'"),'registered closed Theme role');
  assert.ok(read('compiler.js').includes("root['card-display-leading']"),'source theme recipe');
  const html=read('preview-01.html');
  const claim=html.slice(html.indexOf('<!-- @card claimable-balance -->'),html.indexOf('<!-- @end claimable-balance -->'));
  assert.match(claim,/qxframe9a7c2-card-title is-display pv-heading pv-num/);
  const expected={vega:1.5,nova:1.375,maia:1,lyra:1,mira:1,luma:1,sera:1,rhea:1};
  for(const [style,leading] of Object.entries(expected)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const value=body.match(/--qxframe9a7c2-theme-card-display-leading:\s*([^;]+);/)?.[1];
    assert.equal(Number(value),leading,style+' pinned display leading');
  }
  const payout=html.slice(html.indexOf('<!-- @card payout-threshold -->'),html.indexOf('<!-- @end payout-threshold -->'));
  assert.match(payout,/data-pv-slider data-pv-track-height/);
  const sliderCss=fs.readFileSync(path.join(root,'src/styles/components/slider.css'),'utf8');
  assert.match(sliderCss,/\.qxframe9a7c2-slider\.is-track-height\{height:var\(--_qxframe9a7c2-slider-rail\)\}/);
  assert.match(read('preview-cards.js'),/root\.classList\.add\('is-track-height'\)/);
});

check('Payout Threshold amount follows framework Slider onChange, not a second input', () => {
  const html=read('preview-01.html');
  const slice=html.slice(html.indexOf('<!-- @card payout-threshold -->'),html.indexOf('<!-- @end payout-threshold -->'));
  assert.match(slice,/data-pv-slider data-pv-track-height data-pv-output="payout-threshold-amount" data-pv-output-format="money-2"/);
  assert.match(slice,/data-pv-value-for="payout-threshold-amount">\$2500\.00<\/span>/);
  const cards=read('preview-cards.js');
  assert.match(cards,/options\.onChange = function \(nextValue\)/);
  assert.match(cards,/C\.Slider\.create\(options\)/);
  assert.doesNotMatch(cards,/new (?:Slider|RangeController)\(/);
});

check('audit #20: FAQ native details is rendered through the framework Collapse classes', () => {
  const html=read('preview-01.html'),css=read('preview.css');
  const source=fs.readFileSync(path.join(root,'src/styles/components/collapse.css'),'utf8');
  const faq=html.slice(html.indexOf('<!-- @card faq -->'),html.indexOf('<!-- @end faq -->'));
  assert.match(faq,/class="qxframe9a7c2-collapse is-native"/);
  assert.equal((faq.match(/<details name="qx-create-faq" class="qxframe9a7c2-collapse-item"/g)||[]).length,3);
  assert.equal((faq.match(/class="qxframe9a7c2-collapse-header"/g)||[]).length,9);
  assert.equal((faq.match(/class="qxframe9a7c2-collapse-content"/g)||[]).length,9);
  // The pinned FAQ has three independent QX-owned Tabs content panels.
  assert.match(faq,/data-pv-tab-group="faq"/);
  assert.match(faq,/data-pv-tabs data-type="segmented"/);
  for(const key of ['general','billing','goals']){
    assert.match(faq,new RegExp('data-pv-tab-panel="'+key+'"'));
    assert.equal((faq.match(new RegExp('name="qx-create-faq'+(key==='general'?'':'-'+key)+'"','g'))||[]).length,3);
  }
  assert.match(faq,/What is the difference between Basic and Pro pricing tiers/);
  assert.match(faq,/How do I set up a custom financial goal/);
  const panels=read('preview-cards.js');
  assert.match(panels,/options\.onChange = function \(activeKey\)/);
  assert.match(source,/\.qxframe9a7c2-collapse\.is-native\[hidden\]\{display:none\}/);
  assert.doesNotMatch(css,/\.pv-accordion\b/);
  assert.match(source,/\.qxframe9a7c2-collapse\.is-native/);
  assert.match(source,/summary::marker\{content:""\}/);
});

check('audit #19: both preview tables use shared framework Table and pinned density roles', () => {
  const table = fs.readFileSync(path.join(root, 'src/styles/components/table.css'), 'utf8');
  const privateCss = read('preview.css');
  assert.doesNotMatch(privateCss, /\.pv-table\b/, 'no private Table renderer may survive');
  for (const page of ['preview-01.html', 'preview-02.html']) {
    const html = read(page);
    assert.match(html, /class="qxframe9a7c2-table is-embedded is-hover"/);
    assert.doesNotMatch(html, /class="pv-table"/);
  }
  assert.match(table, /\.qxframe9a7c2-table\.is-embedded\s*\{/);
  assert.match(table, /var\(--qxframe9a7c2-theme-table-cell-inset\)/);
  assert.match(table, /var\(--qxframe9a7c2-theme-table-heading-foreground\)/);
  // Source: shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c
  const expected = {vega:8,nova:8,maia:12,lyra:8,mira:8,luma:12,sera:12,rhea:8};
  for (const [style, px] of Object.entries(expected)) {
    const body = model.compileTheme(model.normalizeConfig({style})).body;
    const inset = body.match(/--qxframe9a7c2-theme-table-cell-inset:\s*([^;]+);/)?.[1];
    assert.equal(parseFloat(inset)*16,px,style+' embedded Table cell inset');
    const color = body.match(/--qxframe9a7c2-theme-table-heading-foreground:\s*([^;]+);/)?.[1];
    const source = body.match(new RegExp('--qxframe9a7c2-theme-' +(style === 'sera'?'muted-foreground':'foreground')+':\\s*([^;]+);'))?.[1];
    assert.equal(color,source,style+' semantic Table header text');
  }
});

check('every option of every extension axis changes a theme token that qxframe.css or the preview consumes', () => {
  const dist = path.join(root, 'dist/qxframe9a7c2.css');
  const consumers = (fs.existsSync(dist) ? fs.readFileSync(dist, 'utf8') : '') + read('preview.css');
  const tokens = body => {
    const [rootBlock, darkBlock = ''] = body.split('.dark {');
    const pick = (text, prefix) => [...text.matchAll(/--qxframe9a7c2-theme-([a-z0-9-]+): ([^;]+);/g)].map(m => [prefix + m[1], m[2]]);
    return Object.fromEntries([...pick(rootBlock, ''), ...pick(darkBlock, 'dark:')]);
  };
  const consumed = key => { const name = key.replace(/^dark:/, ''); return consumers.includes('var(--qxframe9a7c2-theme-' + name + ')') || consumers.includes('var(--qxframe9a7c2-theme-' + name + ','); };
  const dead = [];
  for (const style of data.STYLES.map(s => s.value)) {
    const base = tokens(model.compileTheme(model.normalizeConfig({ style })).body);
    for (const axis of data.ALL_EXT_AXES) {
      for (const option of axis.options) {
        const next = tokens(model.compileTheme(model.normalizeConfig({ style, ext: { [axis.key]: option.value } })).body);
        const changed = Object.keys(next).filter(k => next[k] !== base[k]);
        const resolved = model.resolveConfig(model.normalizeConfig({ style })).ext[axis.key];
        if (resolved === option.value) continue; // same as the style's own level
        // Identical tokens = this level equals the style's own geometry (e.g. pill on an already-pill part).
        if (changed.length && !changed.some(consumed)) dead.push(`${style}/${axis.key}=${option.value}`);
      }
    }
  }
  assert.deepEqual(dead, [], 'extension levels whose tokens no consumer reads');
});


check('Preview 01 source-pinned controlled visual state is authored across four Cards', () => {
  const js = read('preview-cards.js');
  const html = read('preview-01.html');
  const overlay = read('offline-qa-changes.mjs');
  for (const id of ['kitchen-island','roller-shades','release-catalog','notification-settings']) {
    assert.ok(html.includes('data-card="'+id+'"'),id+' exists');
    assert.ok(html.includes('data-card="'+id+'"'),id+' source remains authored');
  }
  // These former behavior-fix rounds are no longer marked; the current
  // CheckField policy batch legitimately highlights notification-settings.
  for (const id of ['kitchen-island','roller-shades','release-catalog']) {
    assert.ok(!overlay.includes("['"+id+"'"),id+' last batch is no longer highlighted');
  }
  assert.match(js,/setToggleValue\(group, value\)/);
  assert.match(js,/setDisabled\(!enabled\)/);
  assert.match(js,/kitchenSliders\[index\]\.setValue\(value\)/);
  assert.match(js,/\.pv-shade > div/);
  assert.match(js,/master\.indeterminate = chosen > 0 && chosen < checks\.length/);
  assert.match(js,/do not invent an item-filtering behavior/i);
});


check('fifteen source-locked native FieldLabels connect within seven Cards',()=>{
  const html=read('preview-01.html'), fields=[["payout-threshold","Notes","payout-notes","textarea"],["savings-targets","Amount to Invest","investment-amount","input"],["savings-targets","Order Type","investment-order-type","select"],["account-access","Email Address","email-address","input"],["account-access","Current Password","current-password","input"],["transfer-funds","Amount to Transfer","transfer-amount","input"],["receiving-method","Account Holder Name","account-holder","input"],["receiving-method","IBAN / Account Number","iban","input"],["new-milestone","Goal Name","goal-name","input"],["new-milestone","Target Amount","target-amount","input"],["new-milestone","Target Date","target-date","input"],["social-links","Spotify Artist URL","spotify-url","input"],["social-links","Instagram Handle","instagram-handle","input"],["social-links","SoundCloud URL","soundcloud-url","input"],["social-links","Website","website-url","input"]];
  for(const [card,label,id] of fields){
    const a=html.indexOf('<!-- @card '+card+' -->'),b=html.indexOf('<!-- @end '+card+' -->',a);
    assert.ok(a>=0&&b>a,card+' authored card');
    const section=html.slice(a,b);
    assert.ok(section.includes('for="'+id+'">'+label+'</label>'),card+'/'+label+' association');
    assert.ok(section.includes('id="'+id+'"'),card+'/'+id+' actual target');
  }
  // QX Select has a focusable root (no input), verified by the browser gate.
  for(const id of ['preferred-currency','default-currency','from-account','to-account','stock-ticker'])
    assert.ok(html.includes('data-pv-label-id="'+id+'"'),'QX Select authoring ID present '+id);
});

check('five source-pinned QX Select FieldLabels target existing root focus controls',()=>{
  const preview=read('preview-01.html'),mount=read('preview-cards.js'),fields=[["payout-threshold","Preferred Currency","preferred-currency"],["preferences","Default Currency","default-currency"],["transfer-funds","From Account","from-account"],["transfer-funds","To Account","to-account"],["stock-performance","Ticker","stock-ticker"]];
  for(const [card,label,id] of fields){
    const a=preview.indexOf('<!-- @card '+card+' -->'),b=preview.indexOf('<!-- @end '+card+' -->',a);
    assert.ok(a>=0&&b>a,card+' card');
    const section=preview.slice(a,b);
    assert.ok(section.includes('for="'+id+'">'+label+'</label>'),card+'/'+label+' htmlFor');
    assert.ok(section.includes('data-pv-label-id="'+id+'"'),card+'/'+id+' host');
  }
  assert.match(mount,/\.qxframe9a7c2-select\[tabindex\]/,'QX Select root is the focus target');
  assert.match(mount,/root\.focus\(\{ preventScroll: true \}\)/,'focus forwarded to QX root');
  assert.doesNotMatch(mount,/new MutationObserver\(bindLabel\)/,'no synthetic async inputs');
});

check('pinned secondary Buttons and active segmented Tabs use shared Theme recipes',()=>{
  const html=read('preview-01.html');
  const button=fs.readFileSync(path.join(root,'src/styles/components/button.css'),'utf8');
  const tabs=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  for(const card of ['qr-connect','cover-art','social-links']){
    const start=html.indexOf('data-card="'+card+'"');
    assert.ok(start>0,card+' source card');
    const end=html.indexOf('<!-- @end '+card+' -->',start);
    const part=html.slice(start,end);
    assert.match(part,/qxframe9a7c2-button is-secondary is-solid/,card+' secondary mapping');
  }
  assert.match(button,/\.qxframe9a7c2-button\.is-solid\s*\{/);
  assert.match(button,/--_qxframe9a7c2-button-bg:var\(--_qxframe9a7c2-button-accent\)/);
  assert.match(button,/--_qxframe9a7c2-button-text:var\(--_qxframe9a7c2-button-on-accent\)/);
  const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  assert.match(v2,/\.qxframe9a7c2-button\.is-secondary\s*\{/,'v2 has secondary axis');
  assert.match(v2,/--_qxframe9a7c2-v2-type: var\(--qxframe9a7c2-theme-secondary\)/);
  assert.match(v2,/\.qxframe9a7c2-button\.is-solid\s*\{/,'v2 solid consumes type');
  assert.match(tabs,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\.is-active\{[^}]*--_qxframe9a7c2-tabs-tab-text:var\(--qxframe9a7c2-theme-foreground\)/);
  assert.match(tabs,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\.is-active\{[^}]*--_qxframe9a7c2-tabs-tab-weight:inherit/);
});

check('source pinned Badge roles mapped to QX semantic status-label instead of dead per-card paint',()=>{
  const html=read('preview-01.html');
  const framework=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  const cards=[['claimable-balance','is-outlined',1],['front-door','is-destructive',1],['release-catalog','is-outlined',4],
    ['upcoming-payments','is-secondary',3]];
  for(const [id,role,count] of cards){
    const start=html.indexOf('<!-- @card '+id+' -->'),end=html.indexOf('<!-- @end '+id+' -->',start);
    assert.ok(start>=0&&end>start,'pinned Badge Card '+id);
    const section=html.slice(start,end);
    const selector='qxframe9a7c2-badge is-status-label '+role;
    assert.equal(section.split(selector).length-1,count,id+' exact Badge semantic count');
  }
  for(const role of ['is-destructive','is-outlined','is-secondary'])
    assert.ok(framework.includes('.qxframe9a7c2-badge.is-status-label.'+role),
      'Theme V2 owns '+role+' Badge paint');
  const compiler=read('compiler.js'),catalog=read('tokens.js');
  assert.match(catalog,/C\('badge-label-outline-bg'/,'new sparse source-derived Badge token registered');
  assert.match(compiler,/look\('badge-label-outline-bg'/,'generated Theme light\/dark role matches pinned styles');
  assert.match(framework,/var\(--qxframe9a7c2-theme-badge-label-outline-bg,transparent\)/,'Badge CSS consumes Theme role token');
  for(const role of ['badge-label-destructive-bg','badge-label-secondary-bg','badge-label-secondary-fg','badge-label-solid-border'])
    assert.match(compiler,new RegExp("look\\('"+role+"'"),'Theme compiler owns source editorial semantic role '+role);
  assert.match(compiler,/ext\.textStyle === 'editorial' \? 'transparent' : 'destructive\/10'/,
    'Sera editorial paint must be compiled into Theme, not an unverified runtime mix');
});

check('CardFooter peer Button equal-width semantic only when editorial',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
  const tokens=read('tokens.js'),compiler=read('compiler.js');
  const html=read('preview-01.html');
  assert.match(css,/\.qxframe9a7c2-card-footer\.is-source-peer-actions>\.qxframe9a7c2-button\{flex:var\(--qxframe9a7c2-theme-card-footer-peer-flex,0 1 auto\);min-width:auto/);
  assert.match(css,/\.is-source-peer-actions>\.qxframe9a7c2-button\{[^}]*white-space:nowrap\}/,'source peer labels must not wrap to avoid zero-basis equalization');
  assert.ok(tokens.includes("L('card-footer-peer-flex'"));
  assert.ok(compiler.includes("root['card-footer-peer-flex'] = editorial ? '1 1 0%' : '0 1 auto'"));
  assert.match(html,/data-card="social-links"[\s\S]*?card-footer pv-justify-end pv-gap-2 is-source-peer-actions/);
  const themeDefault=fs.readFileSync(path.join(root,'src/styles/main/theme.css'),'utf8');
  assert.equal((themeDefault.match(/--qxframe9a7c2-theme-card-footer-peer-flex: 0 1 auto;/g)||[]).length,2);
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    assert.match(theme,new RegExp('--qxframe9a7c2-theme-card-footer-peer-flex: '+(style==='sera'?'1 1 0%':'0 1 auto')+';'),'theme peer action role '+style);
  }
});

console.log(JSON.stringify({ ok: true, checks: checks.length, names: checks }));
