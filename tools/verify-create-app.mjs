// createApp (docs/create) static + model gate, v3 §2–§5. Fast, no browser.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import { checkThemeFile } from './css-gates.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs/create');
const read = rel => fs.readFileSync(path.join(dir, rel), 'utf8');
const ONLINE_JS = 'https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js';
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

const FILES = ['index.html', 'app.css', 'app.js', 'model.js', 'data.js', 'themes.js', 'preview-01.html', 'preview-02.html', 'preview-03.html', 'preview-03.css', 'preview-03.js', 'preview-03-extra.js', 'preview-03-coverage.json', 'preview.css', 'preview.js', 'preview-cards.js'];
check('Stage5 Preview03 QX native commercial compositions (18 cards, 3 preview routes)',()=>{
  const html=read('preview-03.html'),js=read('preview-03.js'),css=read('preview-03.css'),model=read('model.js'),index=read('index.html');
  const ids=["platform-tree","workforce-access","onboarding-flow","service-health","brand-studio","plan-governance","release-planner","order-routing","finance-approval","customer-quality","inventory-control","data-inspector","marketing-creative","identity-otp","support-triage","usage-meter","rules-automation","incident-response"];
  assert.match(index,/data-create-item="03"/,'Create switcher has third Preview');
  assert.match(model,/'03': '\.\/preview-03\.html'/,'model routes item=03');
  assert.deepEqual([...html.matchAll(/<!-- @card ([a-z0-9-]+) -->/g)].map(m=>m[1]),ids,'18 independently addressable original Cards');
  for(const id of ids)assert.ok(html.includes('data-card="'+id+'"'),'QX commercial Card '+id);
  assert.match(js,/QXFRAME9A7C2_PREVIEW3/,'JS exports live runtime diagnostics');
  assert.match(js,/Factory\.create/,'Original 18 Cards mount a public QX constructor');
  assert.match(html,/preview-03\.css/);
  assert.ok(css.includes('.pv3-hero h1{font-family:var(--qxframe9a7c2-theme-font-heading,inherit)'),'Preview03 hero follows heading font');
  assert.ok(css.includes('.pv3x-section-heading h2{font-family:var(--qxframe9a7c2-theme-font-heading,inherit)'),'Preview03 second section follows heading font');
  assert.match(css,/\.pv3x-event-list>div\{[^}]*transition:opacity var\(--qxframe9a7c2-theme-duration-sm\) ease,transform var\(--qxframe9a7c2-theme-duration-sm\) ease/,'Event motion maps to Theme');
  assert.match(css,/\.pv3x-process-chip\{[^}]*transition:background-color var\(--qxframe9a7c2-theme-duration-md\) ease/,'Process motion maps to Theme');
  assert.doesNotMatch(css,/transition:[^;}]*\b(?:\.16s|\.2s)\b/,'Preview03 no hard-coded transition durations');
  assert.match(html,/preview-03\.js/);
  assert.doesNotMatch(css,/display\s*:\s*grid|@layer|:is\(|:where\(|\bvw\b|\bvh\b|\bfr\b/,'Preview03 authors Flex-only page layout');
  assert.match(read('offline-qa-changes.mjs'),/group\[3\]==='03'/,'offline QA locator handles third page');
  const inventory=JSON.parse(read('preview-03-coverage.json'));
  assert.equal(inventory.totalCards,66,'full commercial gallery count');
  assert.equal(inventory.addedCards,48,'this batch adds 48');
  assert.equal(inventory.coverage.length,66,'every documented family mapped');
  assert.equal(new Set(inventory.coverage.map(x=>x.component)).size,66,'no duplicated documentation families');
  assert.equal(new Set(inventory.added.map(x=>x.id)).size,48,'new Card ids distinct');
  for(const entry of inventory.added) assert.ok(html.includes('data-card="'+entry.id+'"'),'additional Card '+entry.id);
  assert.equal((html.match(/data-card="/g)||[]).length,66,'exactly 66 Preview03 Card containers');
  assert.match(html,/preview-03-extra\.js/,'extra-QX runtime script wired');
  const extra=read('preview-03-extra.js');
  assert.match(extra,/Factory\.create\(config\)/,'Additional 48 Cards mount through QX runtime constructors');
  assert.match(extra,/QXFRAME9A7C2_PREVIEW3/,'expanded script shares diagnostics with baseline');

});

check('Stage5 shared navigation/data radii do not inherit fixed 4px',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/main/fixed-values.css'),'utf8');
  for(const role of ['navigation','data']) {
    const expected='--_qxframe9a7c2-'+role+'-radius: var(--_qxframe9a7c2-family-'+role+'-radius, var(--qxframe9a7c2-theme-radius-item));';
    assert.ok(css.includes(expected),role+' consumes unified Theme item radius');
  }
});

check('Stage5 QX-only public components consume Theme corner roles',()=>{
  for(const part of ['menu','list','steps','carousel','progress','image','badge','card','slider','tabs','picker-family']){
    const css=fs.readFileSync(path.join(root,'src/styles/components',part+'.css'),'utf8');
    assert.match(css,/--qxframe9a7c2-theme-radius-(?:item|button|track|thumb|popup|badge)/,part+' Theme corner role');
  }
  assert.match(read('preview-03.css'),/\.pv3x-avatars \.qxframe9a7c2-avatar[^}]*border-radius:var\(--qxframe9a7c2-theme-radius-avatar\)/,'Preview03 Avatar is not hard-coded pill');
});

check('menu-inverted Picker descendants consume matched Menu surface roles',()=>{
  const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  const menuScope='qxframe9a7c2-popup-surface:not(.qxframe9a7c2-popover-container)';
  assert.ok(v2.includes(menuScope),'Picker surface is menu-scoped, not global');
  for(const role of ['semantic-text','semantic-text-secondary','semantic-text-disabled','semantic-text-placeholder',
    'semantic-surface','semantic-border-subtle','navigation-bg','control-bg','control-text','control-border'])
    assert.match(v2,new RegExp('--_qxframe9a7c2-'+role+':'),'nested popup semantic role '+role);
  for(const component of ['item-surface.is-selected','date-panel-cell.is-selected','date-panel-cell.is-today',
    'date-picker-preset','color-panel'])
    assert.ok(v2.includes('qxframe9a7c2-'+component),'nested Picker state '+component);
  assert.ok(v2.includes('qxframe9a7c2-popup-surface.qxframe9a7c2-popover-container'),'Popover stays on non-menu surface');
  assert.doesNotMatch(v2,/\.qxframe9a7c2-picker-field-panel \.qxframe9a7c2-wheel-panel-item\.is-selected/,'TimePicker must not paint a second TimePanel selected skin');
});

check('all CSS private Focus shadows use focus, not ring terminology',()=>{
  const dirs=['src/styles/components','src/styles/main'];
  const found=[];
  for(const dir of dirs)for(const file of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.css'))){
    const css=fs.readFileSync(path.join(root,dir,file),'utf8');
    const matches=[...css.matchAll(/--_qxframe9a7c2-[a-z0-9-]*ring(?:-size|-color)?/g)];
    for(const m of matches)found.push(dir+'/'+file+':'+m[0]);
  }
  assert.deepEqual(found,[],'legacy private Focus ring tokens must be eliminated across concatenated CSS');
  const readCss=p=>fs.readFileSync(path.join(root,'src/styles/components',p),'utf8');
  assert.ok(readCss('native-input.css').includes('--_qxframe9a7c2-state-focus-shadow'),'JS Input Focus shadow state role');
  assert.ok(readCss('tabs.css').includes('--_qxframe9a7c2-tabs-tab-focus-shadow'),'Tabs preserves separate elevation + Focus shadow');
  assert.ok(readCss('form-native.css').includes('--_qxframe9a7c2-choice-focus-shadow'),'SelectGroup Focus shadow role');
  assert.ok(readCss('composition.css').includes('--_qxframe9a7c2-state-focus-shadow'),'hosted JS input drops duplicate Focus shadow');
});

check('Canonical Field structure shares one CSS owner with native Form', () => {
  const native=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  const composition=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const docs=fs.readFileSync(path.join(root,'docs/assets/qxframe9a7c2-component-demo-supplements.js'),'utf8');
  for(const selector of ['.qxframe9a7c2-field,.qxframe9a7c2-form-field{',
    '.qxframe9a7c2-field-label {',
    '.qxframe9a7c2-field-description,.qxframe9a7c2-form-description {',
    '.qxframe9a7c2-field-error,.qxframe9a7c2-form-feedback{'])
    assert.ok(native.includes(selector),'Field and native Form share one owner: '+selector);
  for(const selector of ['.qxframe9a7c2-field-set,.qxframe9a7c2-form-fieldset{',
    '.qxframe9a7c2-field-set>.qxframe9a7c2-field-legend,',
    '.qxframe9a7c2-field-separator,.qxframe9a7c2-divider{'])
    assert.ok(composition.includes(selector),'Field composition shares owner: '+selector);
  assert.match(docs,/Field · Shared structure/,'working docs example');
  assert.match(docs,/qxframe9a7c2-field-error/,'FieldError docs');
});

check('files', () => { for (const f of FILES) assert.ok(fs.existsSync(path.join(dir, f)), 'missing docs/create/' + f); });

check('Chromium acceptance module must parse before any heavy browser workflow',()=>{
  execFileSync(process.execPath,['--check',path.join(root,'tools/verify-create-app-browser.mjs')],{stdio:'pipe'});
});

check('font-mono and Alert radius consume registered Theme mapping',()=>{
 const json=fs.readFileSync(path.join(root,'src/styles/components/json.css'),'utf8');
 const alert=fs.readFileSync(path.join(root,'src/styles/components/alert.css'),'utf8');
 const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-style.css'),'utf8');
 assert.ok(json.includes('font-family:var(--qxframe9a7c2-font-mono,var(--_qxframe9a7c2-fixed-font-family-mono,'),'JSON must preserve public font-mono override then shared theme-mono mapping');
 assert.match(v2,/--_qxframe9a7c2-fixed-font-family-mono:\s*var\(--qxframe9a7c2-theme-font-mono\)/,'Theme V2 maps registered mono font to consumers');
 assert.ok(alert.includes('border-radius:var(--qxframe9a7c2-alert-radius,var(--_qxframe9a7c2-surface-radius))'),'Alert radius already follows public and shared Theme radius; no fixed 14px');
});


check('Stage5 P1 Menu subtle ink and Notice shape own closed Theme mappings',()=>{
 const compiler=read('compiler.js');
 const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 const notice=fs.readFileSync(path.join(root,'src/styles/components/notice.css'),'utf8');
 const defaults=fs.readFileSync(path.join(root,'src/styles/main/theme.css'),'utf8');
 assert.ok(compiler.includes("target['menu-accent-foreground'] = resolved.menuAccent === 'bold' ? src['primary-foreground'] : src['popover-foreground']"),'subtle ink must be popover foreground');
 assert.match(defaults,/--qxframe9a7c2-theme-menu-accent-foreground: light-dark\(oklch\(0\.145 0 0\), oklch\(0\.985 0 0\)\)/,'default Menu ink uses both light/dark variants');
 assert.equal((defaults.match(/--qxframe9a7c2-theme-menu-accent-foreground: light-dark\(/g)||[]).length,1,'one COLOR owner for both modes');
 for(const component of ['notice-slot','message-root','notification-root'])
   assert.ok(theme.includes('.qxframe9a7c2-'+component+'[class]'),'real Notice surface '+component+' resolves Theme geometry');
 for(const part of ['message-root','notification-root','notice-slot'])
   assert.ok(notice.includes('border-radius:var(--qxframe9a7c2-'+(part==='message-root'?'message':part==='notification-root'?'notification':'notice')+'-radius,var(--_qxframe9a7c2-surface-radius))'),'Notice '+part+' uses surface mapping');
 assert.ok(notice.includes('transition:box-shadow var(--qxframe9a7c2-theme-duration-md) ease'),'Notice transition maps to motion duration');
});

check('Card Skeleton preserves shimmer but follows shared Skeleton disable',()=>{
 const card=fs.readFileSync(path.join(root,'src/styles/components/card.css'),'utf8');
 const tokens=fs.readFileSync(path.join(root,'docs/create/tokens.js'),'utf8');
 assert.ok(card.includes('animation:qxframe9a7c2-card-skeleton 1.3s ease-in-out infinite'),'Card keeps its distinct shimmer animation');
 assert.ok(card.includes('@container style(--qxframe9a7c2-theme-skeleton-animation: none){'),'inherited Theme token controls Card animation shutdown');
 assert.ok(card.includes('.qxframe9a7c2-card-skeleton-line{animation:none}'),'Card must disable shimmer on shared none');
 assert.ok(tokens.includes("L('skeleton-animation'"),'shared Skeleton name remains registered Theme input');
});

check('offline QA annotation module must parse before packaging',()=>{
 const modulePath=path.join(root,'docs/create/offline-qa-changes.mjs');
 execFileSync(process.execPath,['--check',modulePath],{stdio:'pipe'});
 const source=fs.readFileSync(modulePath,'utf8');
 assert.match(source,/<\/p><\/div>'/,'QA caption must close both paragraph and container');
});

check('offline changes ledger and packaging are opt-in and do not contaminate production Create HTML', () => {
  const ledger=read('offline-qa-changes.mjs');
  const overlay=read('offline-qa-changes.css');
  const packager=fs.readFileSync(path.join(root,'tools/qa/build-offline-demo.py'),'utf8');
  const preview=read('preview-01.html');
  const preview02=read('preview-02.html');
  assert.match(preview02,/preview-stage4-actions\.js/,'current action wiring loads on Preview02');
  const current={"platform-tree":["[data-pv3-component=\"workspace-tree-select\"]"],"brand-studio":["[data-pv3-component=\"brand-color\"]"]}; // Current light-dark scope/ColorPicker acceptance only
  let count=0;
  for(const [id,selectors] of Object.entries(current)){
    assert.ok(read('preview-03.html').includes('data-card="'+id+'"'),'current Preview 03 Card '+id);
    assert.ok(ledger.includes("['"+id+"'"),'active QA group '+id);
    for(const selector of selectors){assert.ok(ledger.includes("'"+selector+"'"),'changed child '+selector);count++;}
  }
  assert.doesNotMatch(ledger,/\['live-waveform'|\['no-team-members'|\['shipping-address'|\['feedback-form'|\['report-bug'|\['invite-team'|\['github-profile'|\['contributions-activity'|\['book-appointment'/,'previous Preview 02 highlights are cleared');
  for(const [id] of Object.entries(current)) {
    assert.ok(ledger.includes("['"+id+"'"),'current-round composition card '+id);
  }
  for(const previous of ['quick-action-menu','release-planner','brand-studio','dial-settings','identity-otp','feature-flags','navigation-workspace','activity-timeline','onboarding-flow','org-hierarchy','marketing-creative','service-health','asset-preview','stakeholder-roster','compliance-flags','revenue-surfaces','usage-meter','segmented-console',
    'sidebar-nav','dividend-income','savings-targets','receiving-method','payout-threshold','faq','preferences','recent-transactions','transfer-funds','claimable-balance','front-door',
    'release-catalog','upcoming-payments','qr-connect','cover-art','new-milestone','social-links'])
    if(!Object.prototype.hasOwnProperty.call(current,previous))assert.ok(!ledger.includes("['"+previous+"'"),'old highlight absent '+previous);
  assert.equal(count,2,'exactly two current Theme scope consumer regions highlighted');
  const feature=read('preview-03.html').split('data-card="feature-flags"')[1]?.split('</article>')[0] || '';
  assert.ok(feature,'feature-flags Card content must be present');
  assert.equal((feature.match(/class="qxframe9a7c2-switch-input"/g)||[]).length,3,'Preview03 must use three real QX Switch inputs');
  assert.equal((feature.match(/class="qxframe9a7c2-switch-track"/g)||[]).length,3,'each real QX Switch input has its track');
  assert.equal((feature.match(/class="qxframe9a7c2-switch-thumb"/g)||[]).length,3,'each real QX Switch track has its thumb');
  assert.match(ledger,/const groups = \[/,'live Control/Choice ledger exists');
  assert.equal((ledger.match(/__QA_BUNDLE_HEAD__/g)||[]).length,count,'exactly one marker per current changed region');
  assert.match(overlay,/\.qa-changed-region/,'inner changed regions need visible highlight');
  assert.match(ledger,/markedRegions=groups\.reduce/,'offline QA badge count must be derived from live ledger');
  if(count)assert.match(ledger,/__QA_BUNDLE_HEAD__/,'new changes must carry CI build HEAD placeholder');
  assert.match(packager,/ledger\.replace\('__QA_BUNDLE_HEAD__',head\[:8\]\)/,'ZIP must embed the exact CI Git HEAD');
  assert.match(ledger,/data-qa-toggle/,'offline QA must support original clean view');
  assert.match(packager,/offline-qa-changes\.mjs/,'packager must inject the QA module into local copies');
  assert.match(packager,/offline-qa-changes\.css/,'packager must inject the QA stylesheet into local copies');
  assert.match(packager,/31 张 Preview 02 卡片已经用户人工验收通过/,'offline bundle must reflect Stage4 owner acceptance');
  assert.doesNotMatch(packager,/尚待人工验收/,'do not ship stale pending Stage4 copy after owner acceptance');
  for(const page of ['index.html','preview-01.html','preview-02.html','preview-03.html'])
    assert.doesNotMatch(read(page),/offline-qa-changes/,
      'QA visuals are forbidden in source / online Create HTML: '+page);
});

check('Tabs keyboard focus preserves the selected elevation on the same focus shell',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-tabs-tab\.is-keyboard-focus\{box-shadow:var\(--_qxframe9a7c2-tabs-tab-elevation\),var\(--_qxframe9a7c2-tabs-tab-focus-shadow\);outline:var\(--_qxframe9a7c2-focus-visible-outline\)/,'Tab keyboard ring must preserve existing selected elevation');
  assert.match(css,/\.qxframe9a7c2-tabs-tab-action:focus-visible\{outline:none;box-shadow:none\}/,'inner action must not introduce a second outline');
  assert.doesNotMatch(css,/\.qxframe9a7c2-tabs-tab\.is-keyboard-focus\{box-shadow:none/,'focused selected Tab must not lose its elevation');
});

check('Native Control elevation and nested InputGroup shadow owner, Choice Hover field border',()=>{
 const source=p=>fs.readFileSync(path.join(root,p),'utf8');
 const f=source('src/styles/components/form-native.css'),g=source('src/styles/components/composition.css'),c=source('src/styles/components/choice-visual.css');
 assert.ok(f.includes('color:var(--_qxframe9a7c2-native-field-text);box-shadow:var(--qxframe9a7c2-theme-shadow-control,none)'),'standalone native input/select gets Control elevation');
 assert.match(g,/\.qxframe9a7c2-input-group-field>\.qxframe9a7c2-form-input,[\s\S]*?\.qxframe9a7c2-input-group-field>\.qxframe9a7c2-form-select\{box-shadow:none\}/,'inner grouped native editors do not shadow twice');
 assert.ok(c.includes('color-mix(in oklab,var(--qxframe9a7c2-theme-field-border),var(--qxframe9a7c2-theme-hover-color) var(--qxframe9a7c2-theme-hover-border-strength))'),'Choice Hover is same field-border blend as native Input/Select');
});

check('unwrapped native SelectGroup checkbox and radio share canonical visuals',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/components/choice-visual.css'),'utf8');
 const base=css.slice(0,css.indexOf('/* Checkbox check / indeterminate glyph. */'));
 assert.match(base,/selectgroup-item:not\(:has\(>\.qxframe9a7c2-selectgroup-label\)\)>\.qxframe9a7c2-selectgroup-input\[type="checkbox"\]/);
 assert.match(base,/selectgroup-item:not\(:has\(>\.qxframe9a7c2-selectgroup-label\)\)>\.qxframe9a7c2-selectgroup-input\[type="radio"\]/);
 for(const kind of ['checkbox','radio'])
   assert.ok(css.includes('selectgroup-item:hover:not(:focus-within):not(:has(>.qxframe9a7c2-selectgroup-input:checked)):not(:has(>.qxframe9a7c2-selectgroup-input:disabled)) .qxframe9a7c2-selectgroup-indicator.is-'+kind),'Hover never supersedes checked, disabled, or focused '+kind);
});

check('connected JS Input never draws a second pointer Outline',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/native-input.css'),'utf8');
  assert.match(css,/html:not\(\.qxframe9a7c2-keyboard-focus-origin\) \.qxframe9a7c2-input-group-field>\.qxframe9a7c2-input\.is-focused/);
  assert.match(css,/\.qxframe9a7c2-input-group:not\(\.is-separated\):not\(\.is-vertical\):has\(>\.qxframe9a7c2-input-group-addon\)>\.qxframe9a7c2-input:focus-within/);
  assert.match(css,/\.qxframe9a7c2-input-group-field>\.qxframe9a7c2-input\.is-focused:not\(\.is-disabled\):not\(\.is-focus-outline-disabled\):not\(\.is-readonly\)\{\s*outline:none/);
});

check('normal Control Shadow is shared and separate from pointer/keyboard focus',()=>{
  const compiler=read('compiler.js'),source=p=>fs.readFileSync(path.join(root,p),'utf8');
  const native=source('src/styles/components/native-input.css'),form=source('src/styles/components/form-native.css');
  const button=source('src/styles/components/button.css'),theme=source('src/styles/main/theme.css');
  assert.ok(compiler.includes("root['shadow-control'] = ext.controlShadow === 'off' ? '0 0 0 0 transparent' : SHADOWS.xs"));
  for(const suffix of ['shadow-control','focus-shadow','pointer-shadow'])assert.ok(
    theme.includes('--qxframe9a7c2-theme-'+suffix+': 0 0 0 0 transparent;'),'default transparent shadow is visually off and composition-safe: '+suffix);
  assert.ok(native.includes('--_qxframe9a7c2-state-focus-shadow:0 0 0 0 transparent'),'JS Input never invalidates normal shadow with comma+none');
  assert.ok(form.includes('--_qxframe9a7c2-choice-focus-shadow:0 0 0 0 transparent'),'SelectGroup never invalidates normal shadow with comma+none');
  assert.ok(native.includes('box-shadow:var(--qxframe9a7c2-theme-shadow-control,0 0 0 0 transparent),var(--_qxframe9a7c2-state-focus-shadow)'),'JS Input retains normal-state elevation');
  assert.ok(form.includes('box-shadow:var(--qxframe9a7c2-theme-shadow-control,0 0 0 0 transparent),var(--_qxframe9a7c2-choice-focus-shadow)'),'SelectGroup retains normal-state elevation');
  for(const css of [native,button]){
    assert.ok(css.includes('outline:var(--qxframe9a7c2-theme-pointer-width,0px) solid color-mix('),'pointer mode paints real CSS outline');
    assert.ok(css.includes('outline-offset:var(--qxframe9a7c2-theme-pointer-offset,-1px)'),'pointer outline offset is -1px in Outline mode');
  }
});


check('bare native controls retain normal elevation and independent pointer/keyboard outline',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/components/native-input.css'),'utf8');
 const focus=fs.readFileSync(path.join(root,'src/styles/components/focus-closeout.css'),'utf8');
 assert.ok(css.includes('outline:0;box-shadow:var(--qxframe9a7c2-theme-shadow-control,0 0 0 0 transparent);transition:'),'bare input/textarea/select normal elevation');
 assert.ok(css.includes('border-color:var(--qxframe9a7c2-theme-pointer-focus);outline:0;box-shadow:'),'ordinary bare focus owns border but never an ungated outline');
 assert.ok(css.includes('html:not(.qxframe9a7c2-keyboard-focus-origin) input:not([class*="qxframe9a7c2-"])'),'bare pointer Outline requires FocusOrigin');
 assert.ok(css.includes('outline:var(--qxframe9a7c2-theme-pointer-width,0px) solid'),'genuine bare pointer CSS Outline remains Theme gated');
 assert.ok(css.includes('border-color:var(--qxframe9a7c2-theme-focus);outline:var(--qxframe9a7c2-theme-focus-width,0.125rem) solid'),'bare keyboard focus color and outline');
 assert.ok(css.includes('.qxframe9a7c2-input-group-field>input:not([class*="qxframe9a7c2-"])'),'bare hosted editors have no second shadow');
 assert.ok(focus.includes('.qxframe9a7c2-form-textarea:focus:not(:disabled):not([readonly])'),'authored Textarea pointer outline is real CSS');
});

check('real Focus outline and common Choice/Slider/Control Surface contracts',()=>{
 const compiler=fs.readFileSync(path.join(root,'docs/create/compiler.js'),'utf8');
 const group=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
 const button=fs.readFileSync(path.join(root,'src/styles/components/button.css'),'utf8');
 const choice=fs.readFileSync(path.join(root,'src/styles/components/choice-visual.css'),'utf8');
 const form=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
 const slider=fs.readFileSync(path.join(root,'src/styles/components/slider.css'),'utf8');
 const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 assert.ok(compiler.includes("root['shadow-control'] = ext.controlShadow === 'off' ? '0 0 0 0 transparent' : SHADOWS.xs"),'normal shadow-control follows Theme Shadow axis');
 assert.ok(compiler.includes("root['pointer-shadow'] = ext.pointerFocus === 'ring'"),'only explicit halo owns focus shadow');
 assert.ok(!compiler.includes("ext.pointerFocus === 'outline'\n      ? '0 0 0"),'no shadow-simulated outline');
 assert.doesNotMatch(group,/var\(--qxframe9a7c2-theme-ring\)/,'InputGroup no imported palette ring');
 assert.doesNotMatch(button,/var\(--qxframe9a7c2-theme-ring\)/,'Button no imported palette ring');
 assert.ok(group.includes('border-color:var(--qxframe9a7c2-theme-pointer-focus)'),'pointer Focus border');
 assert.ok(group.includes('border-color:var(--qxframe9a7c2-theme-focus)'),'keyboard Focus border');
 assert.ok(form.includes('border-radius:var(--qxframe9a7c2-theme-radius-item)'),'SelectGroup uses Item radius not Card');
 assert.ok(form.includes('selectgroup-item:has(>.qxframe9a7c2-selectgroup-label)>.qxframe9a7c2-selectgroup-input'),'only labels hide native input');
 assert.ok(choice.includes('selectgroup-item:not(:has(>.qxframe9a7c2-selectgroup-label))'),'bare SelectGroup uses shared Choice visuals');
 assert.ok(choice.includes('var(--qxframe9a7c2-theme-hover-border-strength)'),'choice Hover consumes Theme strength');
 assert.ok(v2.includes('.qxframe9a7c2-form-check-input[type="checkbox"]:indeterminate'),'half-selected foreground is shared');
 assert.ok(slider.includes('border:1px solid var(--_qxframe9a7c2-slider-handle-border)'),'all Slider handles use 1px');
});

check('Tabs pointer Focus paints once on the shell using independent Theme axes',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.ok(css.includes('html:not(.qxframe9a7c2-keyboard-focus-origin) .qxframe9a7c2-tabs-tab:focus-within:not(.is-disabled):not(:disabled){'),'pointer Tab shell has terminal guards');
  assert.ok(css.includes('outline:var(--qxframe9a7c2-theme-pointer-width,0px) solid color-mix('),'pointer outline paints genuine 2px/-1px CSS outline when configured');
  assert.ok(css.includes('--_qxframe9a7c2-tabs-tab-focus-shadow:var(--qxframe9a7c2-theme-pointer-shadow,0 0 0 0 transparent)'),'only explicit pointer halo uses shadow');
  assert.match(css,/outline-offset:var\(--qxframe9a7c2-theme-pointer-offset,-1px\)/,'pointer outline offset belongs to Theme');
  assert.ok(css.includes('box-shadow:var(--_qxframe9a7c2-tabs-tab-elevation),var(--_qxframe9a7c2-tabs-tab-focus-shadow)'),'selected elevation is never replaced');
});

check('Maia and Rhea Tabs radius allocation follows source while Shape override wins',()=>{
  const compiler=fs.readFileSync(path.join(root,'docs/create/compiler.js'),'utf8');
  assert.ok(compiler.includes("ext.radiusAlloc === 'rounded' ? px(basePx * 1.6)"),'Maia rounded Tabs list alloc');
  assert.ok(compiler.includes("ext.radiusAlloc === 'smooth' ? px(basePx * 2)"),'Rhea smooth Tabs list alloc');
  assert.ok(compiler.includes("shapeRadius(ext.shapeTabs, tabsListRadius, controlShape)"),'Tabs Shape override retained');
  const css=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-style-consumers.css'),'utf8');
  assert.ok(css.includes("calc(var(--_qxframe9a7c2-tabs-radius) - .125rem)"),'shared trigger radius inset remains 2px');
});

check('segmented Tabs use the pinned source dark active input/30 recipe', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\{[^}]*border:1px solid transparent\}/,'source Tab border box with typography role');
  assert.match(css,/--_qxframe9a7c2-tabs-tab-bg:light-dark\(var\(--qxframe9a7c2-theme-background\),color-mix\(in oklab,var\(--qxframe9a7c2-theme-input\) 30%,transparent\)\)/,'dark input/30, light background');
  assert.match(css,/--_qxframe9a7c2-tabs-tab-border:light-dark\(transparent,var\(--qxframe9a7c2-theme-choice-border\)\)/,'shared choice border recipe retains source Luma/Rhea transparent policy');
});

check('Retired form-selectgroup selectors have no Theme V2 paint authority',()=>{
  const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  assert.doesNotMatch(theme,/qxframe9a7c2-form-selectgroup/,'no retired form-selectgroup selectors in V2 mapping');
  assert.match(theme,/\.qxframe9a7c2-selectgroup-input:checked \+ \.qxframe9a7c2-selectgroup-label \.qxframe9a7c2-selectgroup-indicator\.is-radio/,'native SelectGroup radio owns checked V2 glyph');
  assert.match(theme,/\.qxframe9a7c2-selectgroup\.is-xs/,'SelectGroup inherits public Theme size mapping');
  const tabCss=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  assert.match(tabCss,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\{--_qxframe9a7c2-tabs-tab-weight:var\(--qxframe9a7c2-theme-control-weight,500\)/,'segmented Tabs inherit Theme typography');
});

check('V2 JS FocusOrigin draws the final pointer/keyboard border and shadow; Field success stays distinct',()=>{
 const consumer=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-consumers.css'),'utf8');
 const native=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
 const style=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-style-consumers.css'),'utf8');
 assert.match(consumer,/--_qxframe9a7c2-v2-control-border:var\(--qxframe9a7c2-theme-pointer-focus\)/,'pointer V2 physical border');
 assert.match(consumer,/--_qxframe9a7c2-v2-control-border:var\(--qxframe9a7c2-theme-focus\)/,'keyboard V2 physical border');
 assert.match(consumer,/--_qxframe9a7c2-state-focus-shadow:var\(--qxframe9a7c2-theme-pointer-shadow,none\)/,'pointer JS surface shadow');
 assert.match(consumer,/--_qxframe9a7c2-state-focus-shadow:var\(--qxframe9a7c2-theme-focus-shadow,none\)/,'keyboard JS surface shadow');
 assert.match(native,/\.qxframe9a7c2-field\.is-valid \.qxframe9a7c2-form-input:not\(:disabled\)/,'native Field success feedback');
 assert.match(style,/\.qxframe9a7c2-field\.is-valid \.qxframe9a7c2-input:not\(\.is-disabled\)/,'JS Field success V2 feedback');
 assert.match(style,/\.qxframe9a7c2-field\.is-valid \.qxframe9a7c2-input:focus-within:not\(\.is-disabled\)/,'focused valid JS Field must outrank generic FocusOrigin color');
 assert.match(consumer,/html\.qxframe9a7c2-keyboard-focus-origin \.qxframe9a7c2-field\.is-valid \.qxframe9a7c2-selectgroup-input:focus/,'SelectGroup valid border survives keyboard focus');
});

check('Shared seven-axis Hover paints the actual V2 Input/Select owner', () => {
  const consumer=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-consumers.css'),'utf8');
  const style=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-style-consumers.css'),'utf8');
  const structure=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  for(const name of ['hover-border-strength','hover-background-strength','hover-color']){
    assert.ok(consumer.includes('--qxframe9a7c2-theme-'+name),'real Theme Hover token '+name);
  }
  assert.match(consumer,/--_qxframe9a7c2-v2-control-border:color-mix\(in oklab,var\(--qxframe9a7c2-theme-field-border\)/,'native and JS Hover must update V2 physical border owner');
  assert.match(consumer,/--_qxframe9a7c2-v2-control-bg:color-mix\(in oklab,var\(--qxframe9a7c2-theme-field\)/,'native and JS Hover must update V2 physical background owner');
  assert.match(style,/\.qxframe9a7c2-field\.is-warning \.qxframe9a7c2-form-input:hover:not\(:disabled\)/,'warning feedback wins on hover');
  assert.match(style,/\.qxframe9a7c2-field\.is-invalid \.qxframe9a7c2-form-input:hover:not\(:disabled\)/,'invalid feedback wins on hover');
  assert.match(structure,/is-connected\.is-outline>\.qxframe9a7c2-flex>\.qxframe9a7c2-selectgroup-item:first-child/,'horizontal corners scoped to Flex');
  assert.doesNotMatch(structure,/is-connected\.is-outline \.qxframe9a7c2-selectgroup-item:first-child/,'horizontal corner cannot leak to vertical Stack');
});

check('SelectGroup Hover cannot supersede Focus or Field feedback in Outline and Muted',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  for(const appearance of ['is-outline','is-muted']){
    assert.match(css,new RegExp('selectgroup\\.'+appearance+' \\.qxframe9a7c2-selectgroup-item:hover:not\\(:focus-within\\)'),'Hover must exclude Focus within '+appearance);
  }
  for(const status of ['is-invalid','is-warning','is-valid'])
    assert.ok(css.includes('qxframe9a7c2-field.'+status+' .qxframe9a7c2-selectgroup'),'shared status controls SelectGroup Hover '+status);
  assert.ok(css.includes('--_qxframe9a7c2-choice-hover-border,color-mix('),'Outline Hover reuses one border slot with status fallback');
  assert.ok((css.match(/--_qxframe9a7c2-choice-hover-background-strength,var\(--qxframe9a7c2-theme-hover-background-strength\)/g)||[]).length===2,'Outline and Muted Hover derive background from the same status-aware strength');
});

check('SelectGroup replaces CheckField without a duplicate choice Field owner', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const selectCss=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  assert.doesNotMatch(css,/qxframe9a7c2-check-field/,'retired dedicated CheckField must be absent');
  assert.match(selectCss,/\.qxframe9a7c2-selectgroup\.is-outline/,'framed choices are SelectGroup appearance');
  assert.match(selectCss,/\.qxframe9a7c2-selectgroup\.is-muted/,'filled choices use Theme muted appearance');
  assert.match(selectCss,/--_qxframe9a7c2-choice-bg:transparent/,'default None has no surface');
  const preview=read('preview-01.html');
  const section=preview.slice(preview.indexOf('<!-- @card notification-settings -->'),preview.indexOf('<!-- @end notification-settings -->'));
  assert.equal((section.match(/class="qxframe9a7c2-selectgroup-item"/g)||[]).length,5,'five native checkbox SelectGroup items');
  assert.match(section,/qxframe9a7c2-flex is-start/,'cross-axis top alignment is an independent inner Flex');
  assert.doesNotMatch(section,/qxframe9a7c2-check-field/,'old CheckField not present');
});

check('SelectGroup appearance and nine floating positions have no retired scene owner', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  const visual=fs.readFileSync(path.join(root,'src/styles/components/choice-visual.css'),'utf8');
  const composition=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const demos=fs.readFileSync(path.join(root,'docs/assets/qxframe9a7c2-component-demo-supplements.js'),'utf8');
  assert.match(demos,/Floating indicator · Nine anchors/,'nine-anchor interactive docs example');
  assert.match(demos,/Field \+ vertical Connected \+ Theme Focus/,'native Field / vertical connected docs example');
  assert.ok((demos.match(/qxframe9a7c2-flex is-center is-gap-2/g)||[]).length>=16,'ordinary choice content composes through independent inner Flex');
  assert.match(demos,/\['top','middle','bottom'\]/);
  assert.match(demos,/\['left','center','right'\]/);
  assert.doesNotMatch(demos,/is-pill|is-boxes|is-image-grid|is-color-grid|display:grid/,'demos use composable appearances and Flex');
  assert.match(css,/--_qxframe9a7c2-choice-focus-shadow:var\(--qxframe9a7c2-theme-focus-shadow,none\)/,'keyboard Theme shadow paints on Surface');
  assert.match(composition,/html\.qxframe9a7c2-keyboard-focus-origin \.qxframe9a7c2-selectgroup \.qxframe9a7c2-selectgroup-input:focus\+\.qxframe9a7c2-selectgroup-label/,'FocusOrigin keyboard projection must be outside scoped canonical component CSS');
  assert.match(composition,/--_qxframe9a7c2-choice-focus-shadow:var\(--qxframe9a7c2-theme-pointer-shadow,none\)/,'pointer Theme shadow paints on Surface (outside @scope)');
  assert.match(visual,/\.qxframe9a7c2-selectgroup-indicator\.is-radio\{border-color:var\(--_qxframe9a7c2-semantic-focus\);outline:none;box-shadow:none\}/,'indicator cannot draw second focus halo');
  for(const side of ['top-left','top-center','middle-left','middle-center','bottom-center','bottom-right'])
    assert.match(css,new RegExp('is-'+side+'\\b'),'named floating anchor exists: '+side);
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
  assert.match(css('composition'),/html:not\(\.qxframe9a7c2-keyboard-focus-origin\) \.qxframe9a7c2-input-group-field:has\(>\.qxframe9a7c2-form-input:focus-visible\)[^\{]*\{[^}]*theme-pointer-width/,'InputGroup mouse focus consumes Theme pointer token and is restricted to pointer origin');
  assert.match(css('motion'),/motion-popup-placement-appear-from[^\{]*\{[^}]*scaleY\(\.88\)/,'vertical anchored expansion');
  assert.match(css('motion'),/\[data-placement\^="right"\][^\{]*\{[^}]*scaleX\(\.88\)/,'horizontal anchored expansion');
  assert.match(css('composition'),/sidebar-menu-button:hover:not\(\.is-active\)[^\{]*\{[^}]*theme-muted/,'muted hover');
  assert.match(css('composition'),/sidebar-menu-button\.is-active:hover[^\{]*\{[^}]*theme-accent/,'theme active');
  assert.match(css('composition'),/input-group-field:has\(>\.qxframe9a7c2-form-input:focus-visible\)[^\{]*\{[^}]*outline:/,'group owns keyboard outline');
  assert.match(css('composition'),/input-group-addon\+\.qxframe9a7c2-form-input[^\{]*\{[^}]*padding-inline-start:calc/,'internal touching padding half');
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
  assert.equal((defaultTheme.match(/--qxframe9a7c2-theme-button-sm-font-size:/g)||[]).length,1,'default Nova geometry has one invariant Theme owner');
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

check('All 78 COLOR Theme tokens have a single light-dark owner, with scheme-only dark boundary',()=>{
  const registry=read('tokens.js');
  const colors=[...registry.matchAll(/\bC\('([a-z0-9-]+)'/g)].map(m=>m[1]);
  assert.equal(colors.length,78,'closed COLOR inventory must not change');
  for(const style of data.STYLES.map(s=>s.value)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const darkStart=body.indexOf('\n.dark {');
    assert.ok(body.startsWith(':root {\n  color-scheme: light;\n')&&darkStart>0,style+' scheme boundaries');
    const root=body.slice(0,darkStart),dark=body.slice(darkStart);
    for(const name of colors){
      const exp='--qxframe9a7c2-theme-'+name+': light-dark(';
      assert.equal(body.split(exp).length-1,1,style+'/'+name+' single COLOR owner');
      assert.ok(root.includes(exp),style+'/'+name+' root owns COLOR');
      assert.ok(!dark.includes(exp),style+'/'+name+' .dark must never repeat COLOR');
    }
    assert.match(root,/--qxframe9a7c2-theme-color-scheme: light;/);
    assert.match(dark,/\.dark \{\n  color-scheme: dark;\n  --qxframe9a7c2-theme-color-scheme: dark;\n\}/);
    const darkTokens=[...dark.matchAll(/--qxframe9a7c2-theme-[a-z0-9-]+(?=:)/g)].map(m=>m[0]);
    assert.deepEqual(darkTokens,['--qxframe9a7c2-theme-color-scheme'],style+' only keyword exception in dark');
  }
  const values=fs.readFileSync(path.join(root,'src/styles/main/fixed-values.css'),'utf8');
  assert.doesNotMatch(values,/color-scheme:\s*var\(--qxframe9a7c2-theme-color-scheme\)/,'fixed aliases cannot override local Popup color-scheme');
});


check('Control Shadow and Card Shadow independently switch and round-trip without new Theme tokens',()=>{
 const control=data.EXT_AXES.find(a=>a.key==='controlShadow'),surface=data.EXT_AXES.find(a=>a.key==='shadow');
 assert.ok(control&&surface,'distinct UI axes');
 assert.equal(control.param,'control-shadow');
 assert.deepEqual(control.options.map(o=>o.value),['on','off']);
 for(const style of data.STYLES.map(s=>s.value))assert.ok(['on','off'].includes(
   model.resolveConfig(model.normalizeConfig({style})).ext.controlShadow),'valid Style default '+style);
 const compile=(controlShadow,shadow)=>model.compileTheme(
   model.normalizeConfig({style:'vega',ext:{controlShadow,shadow}}),{generatedAt:''}).body;
 const token=(css,name)=>new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);').exec(css)?.[1];
 const oo=compile('off','none'),oi=compile('on','none'),ho=compile('off','heavy'),hi=compile('on','heavy');
 assert.equal(token(oo,'shadow-control'),token(ho,'shadow-control'),'Card strength cannot change Control=off');
 assert.equal(token(oi,'shadow-control'),token(hi,'shadow-control'),'Card strength cannot change Control=on');
 assert.notEqual(token(oo,'shadow-control'),token(oi,'shadow-control'),'Control switch toggles normal elevation');
 for(const name of ['shadow-card','shadow-popup','shadow-dialog']){
   assert.equal(token(oo,name),token(oi,name),'Control switch leaves '+name+' unchanged with surface none');
   assert.equal(token(ho,name),token(hi,name),'Control switch leaves '+name+' unchanged with surface heavy');
 }
 assert.notEqual(token(oo,'shadow-card'),token(ho,'shadow-card'),'Surface switch changes Card');
 const cfg=model.normalizeConfig({style:'vega',ext:{controlShadow:'off',shadow:'heavy'}});
 assert.deepEqual(model.parseConfig(model.serializeConfig(cfg)).config.ext,cfg.ext,'URL axes roundtrip');
 const parsed=model.parseThemeHeader(model.compileTheme(cfg,{generatedAt:''}).css);
 assert.equal(parsed.ok,true,JSON.stringify(parsed.errors));
 assert.equal(parsed.config.ext.controlShadow,'off','CSS header Control setting roundtrip');
 assert.equal(parsed.config.ext.shadow,'heavy','CSS header Card setting roundtrip');
});


check('inverted Popup ItemCollection and Select idle text use menu foreground',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 assert.match(css,/\.qxframe9a7c2-popup-surface \.qxframe9a7c2-item-collection\s*\{\s*color:\s*var\(--_qxframe9a7c2-popup-surface-text\)/);
 assert.match(css,/\.qxframe9a7c2-popup-surface \.qxframe9a7c2-item-surface\s*\{\s*--_qxframe9a7c2-item-text:\s*var\(--_qxframe9a7c2-popup-surface-text\)/);
 assert.match(css,/\.qxframe9a7c2-popup-surface:not\(\.qxframe9a7c2-popover-container\) \.qxframe9a7c2-item-surface\.is-selected[^}]*theme-menu-accent-foreground/);
 const result=model.compileTheme(model.normalizeConfig({menuColor:'inverted'}),{generatedAt:''}).body;
 assert.match(result,/--qxframe9a7c2-theme-menu-foreground:/);
});


check('Chromium native select picker inherits Menu colors and Popup geometry without a second custom JS popup',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  assert.match(css,/@supports\s*\(appearance:base-select\)/,'native opt-in only where supported');
  for(const base of ['.qxframe9a7c2-form-select:not([multiple]):not([size])','.qxframe9a7c2-native-form select:not([multiple]):not([size])','select:not([class*="qxframe9a7c2-"]):not([multiple]):not([size])']){
    assert.ok(css.includes(base+'::picker(select)'),'native picker enabled for '+base);
    assert.ok(css.includes(base+'::picker-icon'),'native extra built-in icon suppressed for '+base);
    assert.ok(css.includes(base+' option:checked'),'checked option uses theme');
    assert.ok(css.includes(base+' option:disabled'),'disabled option still readable');
  }
  for(const token of ['menu','menu-foreground','menu-accent','menu-accent-foreground','radius-popup','shadow-popup','popup-edge'])
    assert.ok(css.includes('--qxframe9a7c2-theme-'+token),'picker uses shared Theme token '+token);
  assert.doesNotMatch(css,/color-scheme:\\s*(?:light|dark);/,'Native Select must inherit global/local color-scheme rather than pinning the page mode');
  assert.ok(css.includes('Native select inherits the computed Theme color-scheme'),'Native controls share the Theme scheme owner');
});


check('Stage 4 Preview 02 pinned 31-card inventory and same-browser audit entrypoint',()=>{
  const html=read('preview-02.html');
  const markers=[...html.matchAll(/<!-- @card ([a-z0-9-]+) -->/g)].map(m=>m[1]);
  const close=[...html.matchAll(/<!-- @end ([a-z0-9-]+) -->/g)].map(m=>m[1]);
  const expected=["style-overview","typography-specimen","codespaces-card","invoice","icon-preview-grid","ui-elements","observability-card","shipping-address","environment-variables","bar-chart-card","invite-team","activate-agent-dialog","skeleton-loading","pie-chart-card","no-team-members","report-bug","contributors","feedback-form","book-appointment","sleep-report","github-profile","weekly-fitness-summary","file-upload","analytics-card","usage-card","shortcuts","anomaly-alert","live-waveform","visitors","contributions-activity","not-found"];
  assert.deepEqual(markers,expected,'all 31 QX Preview 02 Cards remain ordered');
  assert.deepEqual(close,expected,'each Stage 4 Card has explicit paired close marker');
  const audit=fs.readFileSync(path.join(root,'tools/qa/preview-02-audit.mjs'),'utf8');
  assert.match(audit,/item=preview&style=/,'Stage4 must use pinned reference Preview, not Stage3 Preview-02');
  assert.match(audit,/docs\/create\/preview-02\.html/,'Stage4 must compare QX Preview 02');
  assert.match(audit,/assert\.equal\(rows\.length,496/,'31 Cards times eight styles and two themes');
  execFileSync(process.execPath,['--check',path.join(root,'tools/qa/preview-02-audit.mjs')],{stdio:'pipe'});
});


check('Stage4 Codespaces nested QX Tabs and BookAppointment multiple button state owner',()=>{
 const page=read('preview-02.html');
 const codespaces=page.slice(page.indexOf('<!-- @card codespaces-card -->'),page.indexOf('<!-- @end codespaces-card -->'));
 const appointment=page.slice(page.indexOf('<!-- @card book-appointment -->'),page.indexOf('<!-- @end book-appointment -->'));
 for(const name of ['codespaces','local','https','ssh','cli'])
   assert.match(codespaces,new RegExp('data-pv-tab-panel="'+name+'"'),'real nested source tab panel '+name);
 assert.match(codespaces,/data-pv-tab-group="codespaces"/,'outer QX Tabs');
 assert.match(codespaces,/data-pv-tab-group="codespaces-local"/,'nested QX Tabs');
 assert.match(appointment,/data-pv-multi-toggle="appointment"/,'authored multiple group');
 assert.equal((appointment.match(/aria-pressed=/g)||[]).length,4,'4 independent time slots');
 const runtime=read('preview-cards.js');
 assert.match(runtime,/host\.parentNode\.children/,'QX Tabs only owns direct panels');
 assert.match(runtime,/data-pv-multi-toggle/,'delegated real multiple choice Buttons');
 assert.match(read('preview.css'),/\[data-pv-tab-panel\]\[hidden\]\s*\{\s*display:\s*none/,'nested Stack panels stay hidden');
});


check('Stage4 font labels, source dialogs and Codespaces loading are restored with existing QX components',()=>{
 const app=read('app.js'),preview=read('preview-02.html'),runtime=read('preview-cards.js');
 assert.match(app,/const previewFont = \{/,'display category names separate from Chinese Theme Picker labels');
 for(const [id,key] of [['style-overview','style-font'],['typography-specimen','heading-body']]){
   const card=preview.slice(preview.indexOf('<!-- @card '+id+' -->'),preview.indexOf('<!-- @end '+id+' -->'));
   assert.ok(card.includes('data-pv-text="'+key+'"'),'live label binding in '+id);
   assert.doesNotMatch(card,/无衬线|跟随正文/,'no missing CJK glyph labels in English sample '+id);
 }
 for(const kind of ['feedback','alert']) assert.ok(preview.includes('data-pv-dialog="'+kind+'"'),'source modal trigger '+kind);
 assert.match(runtime,/C\.Modal\.create\(/,'reuse existing framework Modal, no fake overlay');
 for(const role of ['Name','Email','Category','Message'])assert.ok(runtime.includes(role),'feedback content '+role);
 assert.match(preview,/data-pv-create-codespace/,'Codespaces action wired');
 assert.match(runtime,/button\.classList\.add\('is-loading'\)/,'framework Button loading state');
 assert.match(runtime,/button\.classList\.remove\('is-loading'\)/,'loading recovery');
 assert.match(runtime,/2000\)/,'pinned source two second action feedback');
});


check('Stage4 local file selection, attachment, and dynamic invite use real native/QX owners',()=>{
 const page=read('preview-02.html'),runtime=read('preview-cards.js');
 for(const attr of ['data-pv-file-drop','data-pv-upload-input','data-pv-upload-browse','data-pv-upload-status','data-pv-bug-file-input','data-pv-bug-attach','data-pv-bug-file-status','data-pv-invite-rows','data-pv-invite-add','data-pv-invite-copy'])
   assert.ok(page.includes(attr),'Preview02 wires '+attr);
 assert.match(runtime,/10 \* 1024 \* 1024/,'10 MiB max local file validation');
 assert.match(runtime,/local preview only; not uploaded/,'local selection is never falsely presented as a remote upload');
 assert.match(runtime,/Attached locally:/,'Bug attachment is locally chosen only');
 assert.match(runtime,/C\.Select\.create\(\{\s*container: role/,'new invite row uses QX Select instance, not cloned DOM');
 assert.match(runtime,/navigator\.clipboard\.writeText/,'copy supports native browser clipboard');
 assert.match(runtime,/Invite link selected; use Ctrl\+C/,'copy failure remains actionable');
});


check('Stage4 waveform media lifecycle and InviteMembers cross-card focus are real behaviors',()=>{
 const html=read('preview-02.html'),runtime=read('preview-cards.js');
 for(const action of ['listen','process','mode'])
   assert.ok(html.includes('data-pv-wave-action="'+action+'"'),'QX waveform button '+action);
 assert.match(html,/data-pv-wave-visual/,'live waveform data state');
 assert.match(html,/data-pv-jump-invites/,'invite CTA');
 assert.match(runtime,/navigator\.mediaDevices\.getUserMedia\(\{audio:/,'microphone only on action');
 assert.match(runtime,/getTracks\(\)\.forEach/,'stop all microphone tracks');
 assert.match(runtime,/createMediaStreamSource\(stream\)\.connect\(analyser\)/,'actual analyser consumes live microphone stream');
 assert.match(runtime,/window\.addEventListener\('pagehide'/,'release media and timer on unload');
 assert.match(runtime,/waveState\.mode === 'static' \? 'scrolling' : 'static'/,'mode toggles static/scrolling');
 assert.match(runtime,/target\.focus\(\{preventScroll:true\}\)/,'invite CTA focuses existing QX action');
 assert.match(runtime,/not recorded or uploaded/,'local privacy disclosure');
});

check('Shared focus ring shadows, theme focus color and State ownership',()=>{
  const source=p=>fs.readFileSync(path.join(root,p),'utf8');
  const data=source('docs/create/data.js');
  const axes=['hoverStyle','hoverColor','keyboardFocus','keyboardFocusColor','pointerFocus','pointerFocusColor','focusBackground'];
  for (const key of axes) assert.ok(data.includes("key: '"+key+"'"),'independent Theme axis: '+key);
  const generated=model.compileTheme(model.normalizeConfig({style:'nova',ext:{keyboardFocus:'ring',pointerFocus:'ring',keyboardFocusColor:'theme',pointerFocusColor:'black-white',hoverStyle:'both',hoverColor:'theme',focusBackground:'parent-surface'}})).body;
  assert.match(generated,/--qxframe9a7c2-theme-focus-shadow:\s*0 0 0/,'keyboard ring has a genuine shadow');
  assert.match(generated,/--qxframe9a7c2-theme-pointer-shadow:\s*0 0 0/,'pointer ring has a genuine shadow');
  assert.doesNotMatch(generated,/--qxframe9a7c2-theme-ring:/,'source palette ring must not be exported as a Theme CSS Focus token');
  const colorTokens=Object.fromEntries([...generated.matchAll(/--qxframe9a7c2-theme-([\w-]+):\s*([^;]+);/g)].map(x=>[x[1],x[2]]));
  assert.equal(colorTokens.focus,colorTokens.primary,'selected theme sets focus outline to primary');
  assert.equal(colorTokens.ring,undefined,'the Theme export must not emit an obsolete ring role');
  assert.equal(colorTokens['hover-color'],colorTokens.primary,'Hover theme color is resolved independently');
  assert.notEqual(colorTokens['pointer-focus'],colorTokens.primary,'Pointer black-white does not inherit keyboard Theme color');
  assert.match(generated,/--qxframe9a7c2-theme-hover-background-strength:\s*15%/,'combined hover paints background');
  assert.match(generated,/--qxframe9a7c2-theme-focus-background-strength:\s*100%/,'parent surface Focus policy');
  const seven=model.normalizeConfig({ext:Object.fromEntries(axes.map((k,i)=>[k,['both','theme','ring','theme','outline','neutral','parent-surface'][i]]))});
  const fromUrl=model.parseConfig(model.serializeConfig(seven)).config;
  for(const key of axes)assert.equal(fromUrl.ext[key],seven.ext[key],key+' URL roundtrip');
  const fromHeader=model.parseThemeHeader(model.compileTheme(seven,{generatedAt:''}).css);
  assert.equal(fromHeader.ok,true,JSON.stringify(fromHeader.errors));
  for(const key of axes)assert.equal(fromHeader.config.ext[key],seven.ext[key],key+' CSS header roundtrip');
  const baseline=model.compileTheme(model.normalizeConfig({style:'nova'})).body;
  assert.match(baseline,/--qxframe9a7c2-theme-focus-shadow:\s*0 0 0 0 transparent/,'baseline keyboard halo is visually absent and comma-safe');
  assert.match(baseline,/--qxframe9a7c2-theme-pointer-shadow:\s*0 0 0 0 transparent/,'baseline pointer halo has no visible paint and is comma-safe');
  assert.doesNotMatch(source('docs/create/compiler.js'),/light\.ring\s*=\s*light\.primary/,'Theme Focus may not mutate imported shadcn palette ring');
  assert.match(source('src/styles/components/focus-closeout.css'),/theme-pointer-shadow/,'native pointer ring');
  assert.match(source('src/styles/components/button.css'),/state-shadow\),var\(--qxframe9a7c2-theme-focus-shadow/,'Button preserves elevation plus focus ring');
  assert.match(source('src/styles/components/button.css'),/html:not\(\.qxframe9a7c2-keyboard-focus-origin\) \.qxframe9a7c2-button:focus[^\{]*\{[^}]*theme-pointer-shadow/,'Button pointer focus projects Theme shadow independently of :active');
  assert.match(source('src/styles/components/native-input.css'),/\.qxframe9a7c2-input:hover:not\(:focus-within\)/,'JS Input native hover');
  assert.match(source('src/styles/main/theme-visual-v2-consumers.css'),/theme-hover-border-strength/,'hover border is resolved from independent style axis');
  assert.match(source('src/styles/components/composition.css'),/input-group-addon\):hover:not\(:focus-within\)[^\{]*\{[^}]*border-color:color-mix/,'connected InputGroup shares hover border step');

  const groupCss=source('src/styles/components/composition.css');
  assert.match(groupCss,/input-group-field:has\(>\.qxframe9a7c2-input\.is-keyboard-focus[^\{]*\{[^}]*theme-focus-shadow/,'JS Input keyboard focus projects its halo to InputGroupField');
  assert.match(groupCss,/input-group-field:has\(>\.qxframe9a7c2-input\.is-focused[^\{]*\{[^}]*theme-pointer-shadow/,'JS Input pointer focus projects to its outer composition');
  assert.match(groupCss,/input-group-field>\.qxframe9a7c2-input\{[^}]*state-focus-shadow:none;[^}]*box-shadow:none/,'hosted JS Input never paints a second ring');
  assert.match(groupCss,/input-group-field:hover:not\(:focus-within\)[^\{]*\{[^}]*border-color:color-mix/,'InputGroupField has the same derived hover border');
  assert.match(groupCss,/input-group-addon\):hover:not\(:focus-within\)[^\{]*qxframe9a7c2-input\.is-disabled/,'connected InputGroup hover respects JS Input disabled state');

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
  assert.match(picker,/\.qxframe9a7c2-calendar\.is-adaptive-month \.qxframe9a7c2-calendar-cell\{[^}]*min-height:0;height:var\(--_qxframe9a7c2-calendar-adaptive-cell\)/,'adaptive cell height consumes shared size');
  assert.match(picker,/\.qxframe9a7c2-calendar-cell\.is-outside:not\(\.is-selected\):not\(\.is-in-range\)\{[^}]*color:var\(--_qxframe9a7c2-semantic-text-disabled\)/,'outside-month day paints muted foreground');
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

check('Pinned Radio Field and SidebarMenu composition retain Theme owners', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  const choice=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  const preview=read('preview-01.html'),compiled=read('compiler.js');
  assert.match(choice,/\.qxframe9a7c2-selectgroup\.is-outline \.qxframe9a7c2-selectgroup-label/);
  assert.match(choice,/padding:var\(--qxframe9a7c2-selectgroup-padding-block-start,/,
    'source Field choice inset consumes shared Theme variable');
  assert.match(css,/\.qxframe9a7c2-field-title\{/);
  assert.match(css,/\.qxframe9a7c2-sidebar-menu-button\{/);
  assert.match(css,/\.qxframe9a7c2-sidebar-group-label\{/);
  for(const token of ['choice-field-inset','sidebar-menu-button-height']){
    assert.ok(read('tokens.js').includes("L('"+token+"'"),token+' Token schema');
    assert.ok(compiled.includes("root['"+token+"']"),token+' Theme recipe');
    assert.ok((css+choice).includes('var(--qxframe9a7c2-theme-'+token),token+' shared consumer');
  }
  const receiving=preview.slice(preview.indexOf('data-card="receiving-method"'),preview.indexOf('<!-- @end receiving-method -->'));
  assert.equal((receiving.match(/class="qxframe9a7c2-selectgroup-item"/g)||[]).length,2);
  assert.match(receiving,/qxframe9a7c2-selectgroup is-outline/);
  assert.equal((receiving.match(/class="qxframe9a7c2-field-title"/g)||[]).length,2);
  const sidebar=preview.slice(preview.indexOf('data-card="sidebar-nav"'),preview.indexOf('<!-- @end sidebar-nav -->'));
  assert.equal((sidebar.match(/class="qxframe9a7c2-sidebar-menu-button/g)||[]).length,18);
  const expectedChoice={vega:12,nova:10,maia:16,lyra:8,mira:8,luma:16,sera:16,rhea:16};
  for(const style of Object.keys(expectedChoice)){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    const px=name=>parseFloat(body.match(new RegExp('--qxframe9a7c2-theme-'+name+':\\s*([^;]+);'))?.[1])*16;
    assert.equal(px('choice-field-inset'),expectedChoice[style],style+' pinned Field child padding');
    assert.equal(px('sidebar-menu-button-height'),['maia','luma','sera'].includes(style)?36:32,style+' pinned sidebar height');
  }
});

check('Receiving Method radio uses Outline SelectGroup and source Theme columns', () => {
  const html=read('preview-01.html'),section=html.slice(html.indexOf('data-card="receiving-method"'),html.indexOf('<!-- @end receiving-method -->'));
  assert.equal((section.match(/class="qxframe9a7c2-selectgroup-item"/g)||[]).length,2);
  assert.equal((section.match(/class="qxframe9a7c2-field-content"/g)||[]).length,2);
  assert.match(section,/class="qxframe9a7c2-choice-group"/,'external Flex group owns columns');
  assert.match(section,/class="qxframe9a7c2-selectgroup is-outline"/,'appearance is explicit Outline');
  assert.doesNotMatch(section,/check-field|pv-choice-field/);
  const compos=fs.readFileSync(path.join(root,'src/styles/components/composition.css'),'utf8');
  assert.match(compos,/\.qxframe9a7c2-choice-group\{[^}]*var\(--qxframe9a7c2-choice-group-columns,var\(--qxframe9a7c2-theme-choice-group-columns,2\)\)/);
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const m=theme.match(/--qxframe9a7c2-theme-choice-group-columns:\s*([12]);/);
    assert.ok(m,style+' missing ChoiceGroup Theme columns');
    assert.equal(+m[1],style==='sera'?1:2,style+' source choice columns');
  }
  const css=read('preview.css');
  assert.doesNotMatch(css,/\.pv-choice-field/,'Preview must not own the choice inset');
  const shared=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  assert.match(shared,/--qxframe9a7c2-selectgroup-padding-block-end/,'public local choice end inset');
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

check('Checkbox SelectGroup Flex consumes Theme Field gap', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/components/form-native.css'),'utf8');
  assert.match(css,/\.qxframe9a7c2-selectgroup\{--_qxframe9a7c2-layout-gap:var\(--qxframe9a7c2-theme-field-gap/);
  const expected={vega:12,nova:8,maia:12,lyra:8,mira:8,luma:12,sera:12,rhea:12};
  for(const [style,pixels] of Object.entries(expected)){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    const m=theme.match(/--qxframe9a7c2-theme-field-gap:\s*([^;]+);/);
    assert.ok(m,style+' has Field gap role');
    assert.equal(parseFloat(m[1])*16,pixels,style+' native Choice horizontal gap');
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
  for (const name of ['flex', 'stack', 'field-group', 'selectgroup', 'divider', 'swatch-cell']) {
    assert.ok(composition.includes('.qxframe9a7c2-' + name), 'missing shared static primitive ' + name);
  }
  for (const page of ['preview-01.html', 'preview-02.html']) {
    assert.doesNotMatch(read(page), /class="[^"]*\b(?:pv-stack|pv-field-group|pv-check-field|pv-swatch-cell|pv-separator|pv-row|pv-item|pv-field|create-grid|create-col|create-pair)\b/, 'duplicate private primitive ' + page);
  }
  assert.match(composition, /input-group-prefix/);
  assert.match(composition, /input-group-suffix/);
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
  for (const axis of data.EXT_AXES) {
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

check('CSS-only inverse Menu changes local color-scheme, never redeclares Theme tokens',()=>{
  for (const style of data.STYLES.map(s=>s.value)) for(const mode of ['default','default-translucent','inverted','inverted-translucent']){
    const body=model.compileTheme(model.normalizeConfig({style,menuColor:mode})).body;
    const inverse=mode.startsWith('inverted');
    assert.ok(body.startsWith(':root {\n  color-scheme: light;'),'single root Theme');
    assert.ok(body.includes('.dark {\n  color-scheme: dark;'),'dark only toggles scheme');
    assert.equal((body.match(/--qxframe9a7c2-theme-background:/g)||[]).length,1,'exactly one COLOR owner');
    for(const name of ['popup-surface:not(.qxframe9a7c2-popover-container)','menu-submenu-panel','menu-overflow-panel'])
      assert.equal(body.includes('qxframe9a7c2-'+name),inverse,'inverse selectors match only selected Menu mode');
    if(inverse){
      assert.ok(body.includes('color-scheme: light;\n}\n:root:not(.dark)'),'dark page Popup selects light');
      assert.ok(body.includes('color-scheme: dark;\n}'),'light page Popup selects dark');
    }
    assert.doesNotMatch(body,/data-qxframe9a7c2-scheme|data-qxframe9a7c2-theme/);
    assert.deepEqual(checkThemeFile(body).errors,[],style+'/'+mode+' exact owner/schema');
  }
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
    assert.ok(blocks, style + ' root registry + dark scheme boundary');
    const names = s => [...s.matchAll(/--qxframe9a7c2-theme-[a-z0-9-]+(?=:)/g)].map(m => m[0]);
    assert.deepEqual(names(blocks[2]), ['--qxframe9a7c2-theme-color-scheme'], style + ' .dark only overrides non-COLOR scheme keyword');
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
  assert.match(tabs,/\.qxframe9a7c2-tabs\.is-segmented \.qxframe9a7c2-tabs-tab\.is-active\{[^}]*--_qxframe9a7c2-tabs-tab-weight:var\(--qxframe9a7c2-theme-control-weight,500\)/);
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
  assert.equal((themeDefault.match(/--qxframe9a7c2-theme-card-footer-peer-flex: 0 1 auto;/g)||[]).length,1,'invariant Card footer role has one Theme owner');
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const theme=model.compileTheme(model.normalizeConfig({style})).body;
    assert.match(theme,new RegExp('--qxframe9a7c2-theme-card-footer-peer-flex: '+(style==='sera'?'1 1 0%':'0 1 auto')+';'),'theme peer action role '+style);
  }
});


check('Stage4 local-only forms use real labels, validation, QX Select and action feedback',()=>{
  const html=read('preview-02.html'),js=read('preview-cards.js');
  for(const card of ['shipping-address','feedback-form'])
    assert.ok(html.includes('data-card="'+card+'"'),'form Card '+card);
  for(const id of ['pv-address-street','pv-address-suite','pv-address-city','pv-address-state','pv-address-zip','pv-address-country','pv-form-topic','pv-form-message']){
    assert.ok(html.includes('for="'+id+'"'),'FieldLabel points to '+id);
    assert.ok(html.includes('id="'+id+'"') || html.includes('data-pv-label-id="'+id+'"'),'actual input or Select focus owner '+id);
  }
  for(const name of ['data-pv-address-save','data-pv-address-cancel','data-pv-address-status','data-pv-feedback-submit','data-pv-feedback-status'])
    assert.ok(html.includes(name),'working form hook '+name);
  assert.match(js,/previewSelects\.set\(host,mountedSelect\)/,'existing Select instance retained, no cloned controllers');
  assert.match(js,/select\.setValue\(host\.getAttribute\('data-value'\) \|\| ''\)/,'Cancel restores authored QX Select');
  assert.match(js,/Address checked locally; not saved to a server/,'address result cannot fake persistence');
  assert.match(js,/Feedback validated locally; not submitted to a server/,'feedback result cannot fake submission');
});

check('Stage5 Table filter, Transfer and JSON follow shared Theme consumer contract',()=>{
  const table=fs.readFileSync(path.join(root,'src/styles/components/table.css'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/components/table.js'),'utf8');
  const transfer=fs.readFileSync(path.join(root,'src/styles/components/transfer.css'),'utf8');
  const json=fs.readFileSync(path.join(root,'src/styles/components/json.css'),'utf8');
  for(const marker of ['.qxframe9a7c2-table-filter-option.is-selected,.qxframe9a7c2-table-filter-option:has(>input:checked){background:var(--_qxframe9a7c2-semantic-subtle-active)',
    '.qxframe9a7c2-table-filter-option.is-disabled,.qxframe9a7c2-table-filter-option:has(>input:disabled){color:var(--_qxframe9a7c2-semantic-text-disabled)',
    'color:var(--_qxframe9a7c2-popup-text);outline:0'])assert.ok(table.includes(marker),marker);
  assert.ok(table.includes('.qxframe9a7c2-table-filter-option:has(>input:checked)'),'Table native selected state does not require JS changes');
  assert.ok(table.includes('.qxframe9a7c2-table-filter-option:has(>input:disabled)'),'Table native disabled state does not require JS changes');
  assert.ok(runtime.includes("input.checked = filterDraftValues.some("),'original Table draft projection remains');
  assert.ok(transfer.includes('--_qxframe9a7c2-transfer-panel-border:var(--qxframe9a7c2-transfer-panel-border,'));
  const v2=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  assert.ok(v2.includes('.qxframe9a7c2-transfer-panel { background-color: var(--_qxframe9a7c2-transfer-panel-bg); color: inherit; border-color: var(--_qxframe9a7c2-transfer-panel-border); }'),'Transfer Theme paint must preserve public border and disabled text');
  assert.ok(transfer.includes('--_qxframe9a7c2-transfer-muted-text:var(--_qxframe9a7c2-semantic-text-disabled);color:var(--_qxframe9a7c2-semantic-text-disabled)'));
  for(const state of ['is-disabled','is-status-error','is-status-warning'])
    assert.ok(transfer.includes('.qxframe9a7c2-transfer.'+state+'{--_qxframe9a7c2-transfer-panel-border:var(--qxframe9a7c2-transfer-panel-border,'),'explicit Transfer border must survive '+state);
  assert.ok(json.includes('font-size:var(--qxframe9a7c2-json-font-size,var(--_qxframe9a7c2-control-font-size))'));
  assert.ok(json.includes('caret-color:currentColor'));
});
check('Stage5 Tree, Cascader, wheel and ColorPanel use paired popup Theme roles',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 const picker=fs.readFileSync(path.join(root,'src/styles/components/picker-family.css'),'utf8');
 assert.ok(picker.includes('.qxframe9a7c2-color-panel-format,.qxframe9a7c2-color-panel-eye,.qxframe9a7c2-color-panel-input{box-sizing:border-box;'),'ColorPanel source must paint all three fields together');
 assert.ok(picker.includes('appearance:none;border:0;border-radius:var(--_qxframe9a7c2-slider-rail-radius,'),'native ColorPanel range outer box must respect Theme Slider track radius, including radius none');
 assert.ok(picker.includes('.qxframe9a7c2-color-panel-hue::-webkit-slider-runnable-track,.qxframe9a7c2-color-panel-alpha::-webkit-slider-runnable-track{box-sizing:border-box;height:var(--_qxframe9a7c2-slider-rail,var(--qxframe9a7c2-slider-rail,0.25rem));'),'WebKit native range track must consume Slider rail size');
 assert.ok(picker.includes('.qxframe9a7c2-color-panel-hue::-moz-range-track,.qxframe9a7c2-color-panel-alpha::-moz-range-track{box-sizing:border-box;height:var(--_qxframe9a7c2-slider-rail,var(--qxframe9a7c2-slider-rail,0.25rem));'),'Gecko native range track must consume Slider rail size');
 assert.ok(picker.includes('.qxframe9a7c2-color-panel-hue::-webkit-slider-thumb,.qxframe9a7c2-color-panel-alpha::-webkit-slider-thumb{box-sizing:border-box;width:var(--_qxframe9a7c2-slider-handle-width,'),'WebKit native range thumb must consume Slider thumb size');
 assert.ok(picker.includes('.qxframe9a7c2-color-panel-hue::-moz-range-thumb,.qxframe9a7c2-color-panel-alpha::-moz-range-thumb{box-sizing:border-box;width:var(--_qxframe9a7c2-slider-handle-width,'),'Gecko native range thumb must consume Slider thumb size');
 assert.doesNotMatch(css,/\.qxframe9a7c2-color-panel-input\[class\]/,'Theme V2 must not duplicate ColorPanel leaf field skin');
 assert.ok(css.includes('.qxframe9a7c2-slider[class], .qxframe9a7c2-color-panel[class] {'),'Slider and ColorPanel must share Theme-derived rail/thumb density roles');
 const appearance=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2-style-consumers.css'),'utf8');
 assert.ok(appearance.includes('.qxframe9a7c2-slider[class],.qxframe9a7c2-color-panel[class]{'),'Slider and ColorPanel must share Style-derived rail/thumb Shape Policy');
 assert.doesNotMatch(appearance,/\.qxframe9a7c2-color-panel-input(?:\[class\]|:focus|\.is-focused|:disabled|\.is-disabled)/,'Shared Control Appearance must not override ColorPanel input alone; ColorPanel source owns input/format/eye together');
 for(const marker of ['.qxframe9a7c2-item-surface.is-open:not(.qxframe9a7c2-tree-item):not(.is-selected)', '.qxframe9a7c2-item-surface.is-descendant-selected:not(.qxframe9a7c2-tree-item):not(.is-selected)',
   '.qxframe9a7c2-tree-check:indeterminate + .qxframe9a7c2-tree-check-indicator',
   '.qxframe9a7c2-date-panel-cell.is-selected',
   '--_qxframe9a7c2-v2-menu-border-neutral: color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 26%',
   '--_qxframe9a7c2-v2-menu-hover-soft: color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 12%'])
   assert.ok(css.includes(marker),'Popup Theme consumer '+marker);
 assert.ok(picker.includes('width:min(calc(var(--qxframe9a7c2-cascader-column-count,1) * 11rem)'), 'Cascader popup follows rendered column count');
});

check('Stage5 popup state color pairs are explicit source consumers',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 for(const marker of [
   '.qxframe9a7c2-date-panel-nav:hover:not(:disabled)',
   'background: var(--_qxframe9a7c2-v2-menu-selected-soft)',
   'color: var(--qxframe9a7c2-theme-menu-accent-foreground)',
   '.qxframe9a7c2-tree-check:checked + .qxframe9a7c2-tree-check-indicator',
   '.qxframe9a7c2-item-surface.is-hover:not(.is-selected)',
   '--_qxframe9a7c2-v2-menu-hover-soft: color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 12%',
   '--_qxframe9a7c2-v2-menu-border-neutral: color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 26%',
   '--_qxframe9a7c2-v2-menu-hover-soft: color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 12%'
 ])assert.ok(css.includes(marker),'popup role '+marker);
});


check('Stage5 compound Input geometry and no horizontal Cascader overflow',()=>{
 const native=fs.readFileSync(path.join(root,'src/styles/components/native-input.css'),'utf8');
 const select=fs.readFileSync(path.join(root,'src/styles/components/collection-select.css'),'utf8');
 const picker=fs.readFileSync(path.join(root,'src/styles/components/picker-family.css'),'utf8');
 assert.ok(native.includes('.qxframe9a7c2-input.is-tags,.qxframe9a7c2-select.is-multiple{'),'TagInput and Select multiple share one sizing owner');
 assert.ok(native.includes('padding-inline:var(--_qxframe9a7c2-compound-inset);padding-block:var(--_qxframe9a7c2-compound-inset)'),'compound shell horizontal and vertical padding must match');
 assert.ok(select.includes('.qxframe9a7c2-select.is-multiple>.qxframe9a7c2-input-control{height:var(--_qxframe9a7c2-compound-item-height)}'),'Select multiple editor cannot expand single-line Input height');
 assert.ok(select.includes('min-height:var(--_qxframe9a7c2-compound-item-height,'),'Select chips follow available inner row height');
 assert.ok(native.includes('var(--qxframe9a7c2-compound-control-inset,var(--_qxframe9a7c2-control-padding-block))'),'compound inset must follow Input padding-block for all sizes');
 assert.ok(native.includes('.qxframe9a7c2-tags.is-hosted{--_qxframe9a7c2-compound-item-height:inherit;'),'hosted Tags must inherit parent Control size, not reset to default md');
 assert.ok(native.includes('--_qxframe9a7c2-compound-item-inset:var(--_qxframe9a7c2-fixed-space-2)}'),'hosted Tag chip must retain positive left/right padding independent of compound shell padding');
 assert.doesNotMatch(native,/--_qxframe9a7c2-compound-item-inset:\s*0(?:px|rem)?(?:;|})/,'hosted Tag chip padding must never be reset to zero');
 assert.ok(select.includes('.qxframe9a7c2-select.is-multiple .qxframe9a7c2-tag{font-size:inherit;line-height:1}'),'Multiple Select chip typography follows the input size');
 const tags=fs.readFileSync(path.join(root,'src/styles/components/tags.css'),'utf8');
 assert.ok(tags.includes('font-size:inherit;line-height:1}'),'hosted Tags chips and editor stay within Control inner height');
 assert.ok(tags.includes('padding-inline:var(--_qxframe9a7c2-compound-item-inset, var(--_qxframe9a7c2-control-padding-inline))'),'hosted Tag consumes its own chip inset without modifying outer Input padding');
 assert.ok(picker.includes('.qxframe9a7c2-cascader-column{') && picker.includes('flex:1 1 0%;min-width:0;max-width:100%'),'Cascader columns shrink within available width');
 assert.ok(picker.includes('.qxframe9a7c2-cascader-columns{box-sizing:border-box;display:flex;flex-wrap:nowrap;width:100%;min-width:0;align-items:stretch;overflow:hidden}'),'Cascader does not expose horizontal scrollbar');
 assert.doesNotMatch(picker,/\.qxframe9a7c2-cascader-columns\{[^}]*overflow-x:auto/,'Cascader cannot revert to horizontal scrolling');
});

check('Stage5 Input appearance, Menu open and Cascader scroll ownership',()=>{
 const compiler=read('compiler.js');
 const native=fs.readFileSync(path.join(root,'src/styles/components/native-input.css'),'utf8');
 const cascader=fs.readFileSync(path.join(root,'src/components/cascader.js'),'utf8');
 const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 for(const expr of ["outline: { bg: ['transparent', 'transparent']", "tinted: { bg: ['input/35', 'input/35']", "subtle: { bg: ['input/12', 'input/12']"])assert.ok(compiler.includes(expr),'Input background skin '+expr);
 assert.ok(compiler.includes("resolved.menuAccent === 'bold' ? src.primary : alpha(src.primary, 28)"),'Menu subtle/bold uses existing accent channel');
 assert.ok(native.includes('--_qxframe9a7c2-compound-item-inset:var(--_qxframe9a7c2-fixed-space-2)}'),'hosted Tag chip inset must be independent of outer Input shell padding and match Select chips');
 assert.ok(cascader.includes("var columnsScroll = popupFrame.attachViewport({"),'Cascader keeps PopupFrame scroll ownership');
 assert.ok(cascader.includes("axis: 'y', wheelAxis: 'y', wheelPropagation: true, scrollbarVisibility: 'hidden'"),'Cascader hides Scroll decoration and never activates horizontal axis');
 const jsParity=fs.readFileSync(path.join(root,'tools/verify-js-build-matches-main.mjs'),'utf8');
 assert.ok(jsParity.includes("'src/components/cascader.js'"),'Stage5 authorized Cascader runtime deviation must be guarded by its PopupFrame/vertical-only assertions');
 assert.ok(jsParity.includes("unauthorized=sourceChanges.filter(x=>!AUTHORIZED.has(x))"),'JS parity rejects unauthorized including Tree, TreeSelect and component contracts');
 assert.ok(jsParity.includes('src/components/cascader.js'),'JS parity remains strict on unrelated sources');
 assert.ok(cascader.includes("panel.style.setProperty('--qxframe9a7c2-cascader-column-count'"),'Cascader levels own width');
 const browser=fs.readFileSync(path.join(root,'tools/verify-create-app-browser.mjs'),'utf8');
 assert.ok(browser.includes('Stage5 real Cascader PopupFrame opens and expands three contiguous columns by item click'),'Cascader real Popup pointer-expansion Chromium guard must remain');
 assert.doesNotMatch(cascader,/axis:\s*'x',\s*wheelAxis:\s*'x'/,'Cascader cannot restore horizontal scroll');
 assert.ok(theme.includes('--_qxframe9a7c2-item-bg: var(--qxframe9a7c2-theme-menu-accent);'),'open Item consumes Menu accent not Hover');
 const menu=fs.readFileSync(path.join(root,'src/styles/components/menu.css'),'utf8');
 assert.ok(menu.includes('--_qxframe9a7c2-menu-item-bg:var(--qxframe9a7c2-theme-menu-accent)'), 'Menu Open must consume the compiled Menu accent, not the hover or legacy expanded recipe');
 assert.ok(menu.includes('--_qxframe9a7c2-menu-item-text:var(--qxframe9a7c2-theme-menu-accent-foreground)'), 'Menu Open must pair theme accent background and ink');
 assert.ok(theme.includes('--_qxframe9a7c2-menu-render-background: color-mix(in oklab,var(--qxframe9a7c2-theme-primary) 10%,transparent);'),'root Navigation Menu Open uses its own translucent Primary highlight, not inverted popup accent');
 assert.ok(theme.includes('--_qxframe9a7c2-menu-render-text: var(--qxframe9a7c2-theme-sidebar-foreground);'),'root Navigation Menu text follows Sidebar foreground independent of portalled popup');
 assert.doesNotMatch(theme,/--_qxframe9a7c2-menu-render-background:\s*var\(--_qxframe9a7c2-menu-recipe-expanded/,'legacy static expanded recipes cannot override the dynamic Menu accent');
 const choice=fs.readFileSync(path.join(root,'src/styles/components/choice-visual.css'),'utf8');
 assert.ok(choice.includes('background-color:var(--qxframe9a7c2-theme-menu-accent-foreground);'),'Choice owns inverse Checkbox background on colored open row');
 assert.ok(choice.includes('color:var(--qxframe9a7c2-theme-menu-accent-contrast)'),'Choice owns contrasting Checkbox mark in both Menu modes');
 assert.ok(compiler.includes("target['menu-accent-contrast'] = resolved.menuAccent === 'bold' ? src.primary : src.popover"),'compiler must invert Choice mark role across soft/bold menus');
 assert.doesNotMatch(choice,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-item\.is-open[^\n]*\.qxframe9a7c2-tree-check-indicator/,'Tree Open cannot invert global Checkbox');
 assert.ok(choice.includes(':not(.qxframe9a7c2-tree-item) .qxframe9a7c2-tree-check-indicator'),'Menu Item Choice logic leaves native Tree state intact');
 assert.doesNotMatch(theme,/\.qxframe9a7c2-popup-surface[^\n]*\.qxframe9a7c2-tree-check/,'Menu never repaints Tree checkboxes');
});


check('Stage5 owner screenshot dark-inverse Menu contrast roles',()=>{
  const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
  const compiler=read('compiler.js'),defaults=fs.readFileSync(path.join(root,'src/styles/main/theme.css'),'utf8');
  assert.ok(compiler.includes('const menuSource = palette;'),'Menu tokens retain normal source; CSS-only popup selector chooses opposite full Theme');
  assert.ok(compiler.includes("resolved.menuAccent === 'bold' ? src.primary : alpha(src.primary, 28)"),'subtle selected color gets sufficient contrast');
  assert.ok(defaults.includes('--qxframe9a7c2-theme-menu-accent: light-dark(oklch(0.205 0 0 / 0.28), oklch(0.922 0 0 / 0.28))'),'generated Menu accent derives both modes');
  assert.equal((defaults.match(/--qxframe9a7c2-theme-menu-accent: light-dark\(/g)||[]).length,1,'Menu accent is declared once for both modes');
  for(const name of ['date-panel-cell.is-today','date-panel-cell.is-current','wheel-panel-center-guide','scroll-thumb:hover'])assert.ok(theme.includes('qxframe9a7c2-'+name),'inverted Menu '+name+' is explicitly painted');
  assert.ok(theme.includes('background: var(--_qxframe9a7c2-v2-menu-primary-solid);'),'Today marker must retain the Menu Primary chroma');
  assert.ok(theme.includes('--_qxframe9a7c2-scroll-thumb-bg: var(--qxframe9a7c2-scroll-thumb-bg, color-mix(in oklab, var(--qxframe9a7c2-theme-menu-foreground) 26%'),'Scroll thumb reads Menu foreground');
  assert.ok(theme.includes('border-block-color: var(--qxframe9a7c2-theme-menu-accent);'),'Wheel guide consumes Menu Primary accent');
});
check('Stage5 screenshot Cascader inset, radius-item consumers and Tabs/Modal behavior',()=>{
  const picker=fs.readFileSync(path.join(root,'src/styles/components/picker-family.css'),'utf8');
  const transfer=fs.readFileSync(path.join(root,'src/styles/components/transfer.css'),'utf8');
  const upload=fs.readFileSync(path.join(root,'src/styles/components/upload.css'),'utf8');
  const tabsCSS=fs.readFileSync(path.join(root,'src/styles/components/tabs.css'),'utf8');
  const tabsJS=fs.readFileSync(path.join(root,'src/components/tabs.js'),'utf8');
  const modal=fs.readFileSync(path.join(root,'src/components/modal.js'),'utf8');
  assert.ok(picker.includes('max-width:100%;padding:var(--_qxframe9a7c2-fixed-space-2);border-inline-end'),'Cascader gets column inset');
  assert.ok(transfer.includes('--_qxframe9a7c2-transfer-panel-radius:var(--qxframe9a7c2-transfer-panel-radius,var(--qxframe9a7c2-theme-radius-item))'),'Transfer uses nested radius');
  assert.ok(upload.includes('border-radius:var(--qxframe9a7c2-upload-dropzone-radius,var(--qxframe9a7c2-upload-radius,var(--qxframe9a7c2-theme-radius-item)))'),'Upload dropzone uses nested radius');
  assert.ok(tabsCSS.includes('height:100%;padding:var(--_qxframe9a7c2-fixed-space-1) var(--_qxframe9a7c2-tabs-pad-x)'),'Tabs action vertical inset restored');
  assert.ok(tabsJS.includes("placement: 'top', type: 'segmented', activationMode: 'auto'"),'Tabs segmented is default');
  assert.ok(modal.includes('recentPointer.time <= 2500')&&modal.includes('focusedRect.width > 0 && focusedRect.height > 0'),'Modal delayed click/focused trigger origin');
});
check('Stage5 Menu Primary, ColorPanel focus and native TreeSelect projection are unified',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 assert.ok(css.includes('oklch(from var(--qxframe9a7c2-theme-menu-accent) l c h / 1)'),'Picker derives opaque Menu Primary without new Theme inputs');
 assert.ok(css.includes('background: var(--_qxframe9a7c2-v2-menu-primary-solid);'),'Today retains hue from Menu Primary');
 assert.ok(css.includes('background: var(--_qxframe9a7c2-v2-menu-selected-soft);'),'Wheel uses Menu accent tint');
 assert.ok(css.includes('border-block-color: var(--qxframe9a7c2-theme-menu-accent);'),'Wheel border matches Menu Primary');
 assert.ok(css.includes('--_qxframe9a7c2-semantic-focus-visible: var(--qxframe9a7c2-theme-menu-foreground);'),'ColorPicker keyboard outline visible against inverted popup');
 assert.ok(css.includes('--_qxframe9a7c2-semantic-focus: var(--_qxframe9a7c2-v2-menu-primary-solid);'),'ColorPicker pointer focus retains Menu color');
 assert.ok(css.includes('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree-check:indeterminate + .qxframe9a7c2-tree-check-indicator'),'Popup Tree checkbox covers indeterminate');
 assert.ok(css.includes('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree-check:checked + .qxframe9a7c2-tree-check-indicator'),'real popup checked indicator');
 assert.ok(css.includes('.qxframe9a7c2-popup-surface:not(.qxframe9a7c2-popover-container) {\n    --_qxframe9a7c2-v2-menu-primary-solid:'),'Menu solid color belongs to shared Popup root, not Date-only Picker');
 assert.doesNotMatch(css,/\.qxframe9a7c2-picker-field-panel \.qxframe9a7c2-tree-check/,'do not repeat unreachable synthetic PickerField Tree selectors');
 assert.doesNotMatch(css,/:is\(|:where\(|@layer/,'No disallowed selectors or layers');
});
check('Stage5 TreeSelect uses canonical Tree DOM and matches Tree visual demo options',()=>{
  const js=read('preview-03.js');
  const tree=fs.readFileSync(path.join(root,'src/components/tree.js'),'utf8');
  const select=fs.readFileSync(path.join(root,'src/components/tree-select.js'),'utf8');
  const treeCSS=fs.readFileSync(path.join(root,'src/styles/components/tree.css'),'utf8');
  const previewCSS=read('preview-03.css');
  assert.match(select,/import \{ Tree \} from '\.\/tree\.js'/,'TreeSelect imports canonical Tree');
  assert.match(select,/tree = Tree\.create\(\{/,'TreeSelect renders the canonical Tree runtime');
  assert.match(select,/showLine: opts\.showLine/,'TreeSelect forwards shared Tree line policy');
  assert.match(tree,/root\.classList\.toggle\('is-show-line', opts\.showLine === true\)/,'Tree owns the line DOM state');
  const direct=js.match(/mount\('workspace-tree','Tree',\{[^\n]*\}\);/)?.[0]||'';
  const nested=js.match(/mount\('workspace-tree-select','TreeSelect',\{[^\n]*\}\);/)?.[0]||'';
  assert.ok(direct.includes('showLine:true') && nested.includes('showLine:true'),'both commercial examples use the same Tree line option');
  assert.match(treeCSS,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-indicator/,'one Tree checkbox CSS owner');
  assert.doesNotMatch(previewCSS,/\.qxframe9a7c2-tree-(?:item|check|toggle|label|line-unit)\b/,'Preview03 cannot fake another Tree visual skin');
});


check('Stage5 Tree uses official main API, not experimental edits or paging',()=>{
 const tree=fs.readFileSync(path.join(root,'src/components/tree.js'),'utf8');
 const select=fs.readFileSync(path.join(root,'src/components/tree-select.js'),'utf8');
 const schema=fs.readFileSync(path.join(root,'src/core/componentContracts.js'),'utf8');
 assert.match(tree,/static options = Object\.freeze/,'original Tree definition');
 assert.doesNotMatch(tree,/loadNextPage:appendPage|retryLoad:retryLoad|finishRename\(true,event\)/,'experimental APIs removed');
 assert.doesNotMatch(select,/lazy:opts\.lazy===true|loadMore:opts\.loadMore|onOperate:opts\.onOperate/,'TreeSelect restored');
 const line=schema.split('\n').find(x=>x.includes('"TreeSelect": Object.freeze({ schema: schema(['))||'';
 for(const field of ['"beforeOperate"','"loadMore"','"onOperate"','"pageSize"'])assert.ok(!line.includes(field),'no non-main TreeSelect API '+field);
 const qa=fs.readFileSync(path.join(root,'docs/qa/tree-large-data.html'),'utf8');
 assert.ok(qa.includes('3000')&&qa.includes('virtual:true'),'official Tree still stresses 3000 nodes');
});
check('Stage5 TreeSelect state remains native, Picker visual projection uses Menu roles',()=>{
 const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
 const choice=fs.readFileSync(path.join(root,'src/styles/components/choice-visual.css'),'utf8');
 const tree=fs.readFileSync(path.join(root,'src/styles/components/tree.css'),'utf8');
 const select=fs.readFileSync(path.join(root,'src/components/tree-select.js'),'utf8');
 assert.ok(theme.includes('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree-check-indicator {'),'Only the real TreeSelect portal owns the contextual checkbox paint');
 assert.ok(theme.includes('--_qxframe9a7c2-v2-choice-bg: var(--_qxframe9a7c2-v2-menu-primary-solid);'),'Popup Choice checked fill follows Menu Primary');
 assert.match(choice,/\.qxframe9a7c2-tree-check:checked\+\.qxframe9a7c2-tree-check-indicator/,'global checked Choice');
 assert.match(choice,/\.qxframe9a7c2-tree-check:indeterminate\+\.qxframe9a7c2-tree-check-indicator/,'global mixed Choice');
 assert.match(theme,/\.qxframe9a7c2-tree-check:checked \+ \.qxframe9a7c2-tree-check-indicator/,'shared V2 checked Choice');
 assert.match(theme,/\.qxframe9a7c2-tree-check:indeterminate \+ \.qxframe9a7c2-tree-check-indicator/,'shared V2 mixed Choice');
 assert.match(select,/tree = Tree\.create\(\{/,'TreeSelect shares the Tree renderer');
 assert.doesNotMatch(tree,/theme-menu(?:-accent|-foreground)?/,'Tree itself cannot own Menu palette');
});


check('Stage5 neutral List/Tree, OTP container, Badge static and shared TimePanel',()=>{
 const source=p=>fs.readFileSync(path.join(root,p),'utf8');
 const list=source('src/styles/components/list.css'),v2=source('src/styles/main/theme-visual-v2.css');
 const otp=source('src/components/input-otp.js'),badge=source('src/styles/components/badge.css');
 const tags=source('src/styles/components/tags.css');
 assert.doesNotMatch(v2,/\.qxframe9a7c2-list, \.qxframe9a7c2-tree \{ background-color:/,'parent controls list/tree surface');
 assert.doesNotMatch(list,/max-width:100%;color:var\(--_qxframe9a7c2-semantic-text\);background:/,'list is not a painted card');
 assert.match(otp,/otpRoot\.classList\.remove\('qxframe9a7c2-input'\)/,'OTP container must not carry Input root class');
 assert.match(badge,/border:1px solid transparent/,'outlined badge owns border geometry');
 assert.doesNotMatch(v2,/\.qxframe9a7c2-badge\.is-outlined:hover/,'Badge is static');
 assert.match(tags,/--qxframe9a7c2-tag-close-icon-size,0\.625rem/,'Tag icon uses smaller scale');
 assert.doesNotMatch(v2,/\.qxframe9a7c2-tooltip-container, \.qxframe9a7c2-tooltip-arrow/,'Arrow consumes Tooltip root');
});


check('Stage5 static Outline Badge alias and inherited List radius',()=>{
 const css=p=>fs.readFileSync(path.join(root,p),'utf8');
 const badge=css('src/styles/components/badge.css'),list=css('src/styles/components/list.css'),theme=css('src/styles/main/theme-visual-v2.css');
 assert.match(badge,/\.qxframe9a7c2-badge\.is-outlined,\.qxframe9a7c2-badge\.is-outline/,'Badge supports both outline spellings in existing demos');
 assert.match(theme,/\.qxframe9a7c2-badge\.is-outline \{ background-color: transparent/,'Theme Outline Badge retains visible border');
 assert.doesNotMatch(theme,/\.qxframe9a7c2-badge\.is-outline:hover/,'Badge does not implement control hover');
 assert.match(list,/border-radius:var\(--_qxframe9a7c2-list-radius\)/,'List keeps Shape Policy geometry while being unpainted');
 assert.doesNotMatch(theme,/\.qxframe9a7c2-list, \.qxframe9a7c2-tree \{ background-color/,'List and Tree inherit container colors');
});

console.log(JSON.stringify({ ok: true, checks: checks.length, names: checks }));
