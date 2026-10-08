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
  assert.match(read('preview-01.html'), /class="qxframe9a7c2-empty is-composed"><div class="qxframe9a7c2-empty-media is-icon">/);
});

const model = await import(pathToFileURL(path.join(dir, 'model.js')).href);
const data = await import(pathToFileURL(path.join(dir, 'data.js')).href);

check('Empty geometry follows pinned 8-style source, not Nova hardcoding', () => {
  // Source: tools/qa/spec.json at shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c.
  // inset px, outer radius px, media radius px. Both modes share root geometry.
  const expected = {
    vega: [48, 10, 10], nova: [24, 14, 10],
    maia: [48, 10, 10], lyra: [24, 0, 0],
    mira: [24, 14, 8], luma: [48, 18, 14],
    sera: [48, 0, 0], rhea: [48, 22, 14]
  };
  for (const [style, [inset, outer, media]] of Object.entries(expected)) {
    const css = model.compileTheme(model.normalizeConfig({ style })).body;
    const tokens = Object.fromEntries(
      [...css.matchAll(/--qxframe9a7c2-theme-([a-z0-9-]+):\s*([^;]+);/g)]
        .map(m => [m[1], m[2]])
    );
    const n = value => parseFloat(value) * (value === '0' ? 1 : 16);
    assert.equal(n(tokens['empty-inset']), inset, style + ' Empty inset');
    assert.equal(n(tokens['radius-empty']), outer, style + ' Empty root radius');
    assert.equal(n(tokens['radius-empty-media']), media, style + ' Empty media radius');
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
  assert.match(css, /\.pv-accordion-item\s*>\s*summary\s*\{[^}]*padding:\s*var\(--qxframe9a7c2-theme-accordion-padding\)/);
  const levels = {vega:16,nova:10,maia:16,lyra:10,mira:8,luma:16,sera:16,rhea:16};
  for (const [style,px] of Object.entries(levels)) {
    const compiled = model.compileTheme(model.normalizeConfig({style})).body;
    const m=compiled.match(/--qxframe9a7c2-theme-accordion-padding:\s*([^;]+);/);
    assert.ok(m,style+' missing Accordion inset');
    assert.equal(parseFloat(m[1])*16,px,style+' Accordion inset');
  }
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

check('Receiving Method radio choices use shared Field composition, not custom Cards', () => {
  const html=read('preview-01.html');
  const section=html.slice(html.indexOf('data-card="receiving-method"'),
    html.indexOf('<!-- @end receiving-method -->'));
  assert.equal((section.match(/class="qxframe9a7c2-check-field pv-choice-field"/g)||[]).length,2);
  assert.equal((section.match(/class="qxframe9a7c2-field-content"/g)||[]).length,2);
  assert.doesNotMatch(section,/pv-choice-card/,'no invented private Radio choice surface');
  const css=read('preview.css');
  assert.match(css,/\.pv-choice-field\s*\{\s*padding-block-end:\s*\.625rem;/,
    'pinned Field horizontal option has only 10px bottom inset');
  assert.doesNotMatch(css,/\.pv-choice-card(?:\s|\{|\:)/,'obsolete custom Card styling must be absent');
});

check('Payments Item flex basis and Kitchen Slider intrinsic footprint are source-aligned', () => {
  const item=fs.readFileSync(path.join(root,'src/styles/components/item-surface.css'),'utf8');
  const slider=fs.readFileSync(path.join(root,'src/styles/components/slider.css'),'utf8');
  const html=read('preview-01.html');
  assert.match(item,/\.qxframe9a7c2-item-content\{display:flex;flex:1 1 0;/,
    'ItemContent uses pinned flex-1 zero basis and avoids wrapping trailing icons');
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
  assert.match(css,/\.pv-tabs-full\s*\{[^}]*--qxframe9a7c2-tabs-height:\s*calc\(max\(2rem,var\(--qxframe9a7c2-theme-control-height\)\)\s*-\s*\.375rem\)/,
    'FAQ uses source Tab rail height through the public Tabs size API');
  const shared=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(shared,/--_qxframe9a7c2-tabs-height:var\(--qxframe9a7c2-tabs-height,/,
    'public Tab height must continue to consume author override');
});

check('FAQ Accordion description line uses the shared text-leading role', () => {
  const css=read('preview.css');
  assert.match(css,/\.pv-accordion-content\s*\{[^}]*line-height:\s*var\(--qxframe9a7c2-theme-text-leading\)/,
    'Accordion content text-sm line box must not hardcode 1.5');
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    assert.match(theme,/--qxframe9a7c2-theme-text-leading:\s*[^;]+;/,
      style+' must provide the source text line-height role');
  }
});

check('FieldContent labels consume shared Theme lines and FAQ trigger has no non-source gap', () => {
  const composition=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const preview=read('preview.css');
  assert.match(composition,/\.qxframe9a7c2-field-content>\.qxframe9a7c2-form-label\{[^}]*line-height:var\(--qxframe9a7c2-theme-field-label-line-height\)/,
    'FieldContent label should share semantic typography with FormField');
  assert.match(composition,/\.qxframe9a7c2-field-content>\.qxframe9a7c2-form-label\{[^}]*font-weight:var\(--qxframe9a7c2-theme-text-weight-label\)/);
  assert.match(preview,/\.pv-accordion-item\s*>\s*summary\s*\{[^}]*gap:\s*0;/,
    'upstream AccordionTrigger has no horizontal 16px gap');
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

console.log(JSON.stringify({ ok: true, checks: checks.length, names: checks }));
