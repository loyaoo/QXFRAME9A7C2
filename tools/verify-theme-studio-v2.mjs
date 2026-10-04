import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {rollup} from 'rollup';
import {generateThemeV2} from '../docs/assets/theme-generator/engine-v2.mjs';
import {compileStyles} from './compile-styles.mjs';
import {browserProbes} from './audit-css-schema-acceptance.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),entry=path.join(root,'docs/assets/theme-generator/studio-v2.mjs');
const html=fs.readFileSync(path.join(root,'docs/theme-playground.html'),'utf8');
assert.match(html,/data-theme-studio-v2/);assert.match(html,/type="module" src="assets\/theme-generator\/studio-v2.mjs"/);
const built=await rollup({input:entry}),output=await built.generate({format:'iife',name:'QXThemeV2Editor'});await built.close();
assert.equal(output.output.length,1);const code=output.output[0].code,theme=generateThemeV2();
assert.doesNotMatch(theme.css,/palette-|--_qxframe|color-mix|-(?:xs|sm|lg|xl):/);
assert.equal(Object.hasOwn(theme.config,'foundation'),false,'Theme config must not expose legacy scale foundation');
assert.equal(theme.config.styleRules,'qx-style-3');
assert.equal(theme.statistics.styleNames>25,true);
const report={schema:2,stage:'E/F canonical editor',bundleBytes:Buffer.byteLength(code),themeBytes:Buffer.byteLength(theme.css),inputs:theme.statistics,defaultReplaced:true,browser:null};
if(process.argv.includes('--browser')){
  report.browser=await browserProbes({htmlContent:'<!doctype html><html><head><style>'+compileStyles().css+'\n'+fs.readFileSync(path.join(root,'docs/assets/theme-studio-v2.css'),'utf8')+'</style></head><body><section data-theme-studio-v2></section></body></html>',expression:`(async () => {
    ${code}
    const api=window.QXFRAME9A7C2_THEME_STUDIO_V2,panel=document.querySelector('[data-theme-studio-v2]'),failures=[];let checks=0;
    const eq=(name,actual,expected)=>{checks++;if(JSON.stringify(actual)!==JSON.stringify(expected))failures.push({name,actual,expected});};
    const yes=(name,value)=>{checks++;if(!value)failures.push({name,actual:value,expected:true});};
    const settle=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const transparent=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return ctx.getImageData(0,0,1,1).data[3]===0;};
    const choose=(name,value)=>{const node=panel.querySelector('[data-v2-option="'+name+'"]');node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));};
    const appearance=(name,value)=>{const node=panel.querySelector('[data-v2-appearance="'+name+'"]');node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));};
    const shape=(name,value)=>{const node=panel.querySelector('[data-v2-shape="'+name+'"]');node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));};
    const light=()=>panel.querySelector('[data-qxframe9a7c2-theme="light"]');
    const heights=()=>[...light().querySelectorAll('.qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button')].map(node=>parseFloat(getComputedStyle(node).minHeight));
    const radius=()=>[...light().querySelectorAll('.qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button')].map(node=>parseFloat(getComputedStyle(node).borderTopLeftRadius));
    const defaultAppearance={typography:'standard',textStyle:'standard',controlAppearance:'outline',fontBody:'system-ui',fontHeading:'inherit',fontMono:'ui-monospace',border:'hairline',shadow:'xs',motion:'standard',surface:'default',shape:{choice:'intrinsic',toggle:'intrinsic',range:'intrinsic',compact:'follow',identity:'intrinsic'}};
    eq('boot',!!api,true);eq('unique editor marker',document.querySelectorAll('[data-theme-studio-v2]').length,1);eq('default options',api.getTheme().config.options,{density:'standard',radius:'sm',spacing:'normal'});eq('default appearance',api.getTheme().config.appearance,defaultAppearance);eq('default five heights',heights(),[28,32,36,40,44]);
    choose('style','mira');eq('Style populates concrete options',api.getTheme().config.options,{density:'tight',radius:'xs',spacing:'compact'});eq('Style populates typography',api.getTheme().config.appearance.typography,'compact');eq('Style populates shadow',api.getTheme().config.appearance.shadow,'none');eq('Style populates control appearance',api.getTheme().config.appearance.controlAppearance,'tinted-subtle');eq('Style density visibly changes five heights',heights(),[20,24,28,32,36]);
    const bodyFontBeforeDensity=getComputedStyle(light().querySelector('.qxframe9a7c2-card-body')).fontSize;
    choose('density','compact');eq('density option committed',api.getTheme().config.options.density,'compact');choose('spacing','roomy');eq('spacing option committed',api.getTheme().config.options.spacing,'roomy');eq('independent control density',heights(),[24,28,32,36,40]);
    const body=light().querySelector('.qxframe9a7c2-card-body');eq('independent roomy surface',parseFloat(getComputedStyle(body).paddingLeft),28);eq('control density does not change Card body typography',getComputedStyle(body).fontSize,bodyFontBeforeDensity);
    choose('radius','none');eq('radius option committed',api.getTheme().config.options.radius,'none');eq('none across five sizes',radius(),[0,0,0,0,0]);
    choose('style','sera');choose('radius','lg');eq('Sera follow radius can change',radius(),[10,12,14,16,18]);
    eq('Sera visible text recipe',api.getTheme().config.appearance.textStyle,'editorial');eq('Sera visible control appearance',api.getTheme().config.appearance.controlAppearance,'underline');eq('Sera heading font default',api.getTheme().config.appearance.fontHeading,'serif');
    let seraButton=light().querySelector('.qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button'),seraTitle=light().querySelector('.qxframe9a7c2-card-title');
    eq('Sera button semibold',getComputedStyle(seraButton).fontWeight,'600');eq('Sera button uppercase',getComputedStyle(seraButton).textTransform,'uppercase');yes('Sera button wide tracking',parseFloat(getComputedStyle(seraButton).letterSpacing)>0);yes('Sera title serif',getComputedStyle(seraTitle).fontFamily.includes('Georgia'));eq('Chinese text remains source text',seraButton.textContent,'超小');eq('Sera md control font source size',getComputedStyle(light().querySelector('.qxframe9a7c2-input.is-md')).fontSize,'12px');
    let seraInput=light().querySelector('.qxframe9a7c2-input.is-md');yes('Sera underline top transparent',transparent(getComputedStyle(seraInput).borderTopColor));yes('Sera underline bottom visible',!transparent(getComputedStyle(seraInput).borderBottomColor));
    appearance('controlAppearance','outline');eq('control appearance can reset Sera',api.getTheme().config.appearance.controlAppearance,'outline');seraInput=light().querySelector('.qxframe9a7c2-input.is-md');yes('outline top visible',!transparent(getComputedStyle(seraInput).borderTopColor));yes('outline light fill transparent',transparent(getComputedStyle(seraInput).backgroundColor));
    appearance('controlAppearance','soft');eq('soft control appearance committed',api.getTheme().config.appearance.controlAppearance,'soft');seraInput=light().querySelector('.qxframe9a7c2-input.is-md');yes('soft default border transparent',transparent(getComputedStyle(seraInput).borderTopColor));yes('soft fill visible',!transparent(getComputedStyle(seraInput).backgroundColor));seraInput.classList.add('is-focused');await settle(300);yes('soft focused border visible',!transparent(getComputedStyle(seraInput).borderTopColor));seraInput.classList.remove('is-focused');
    appearance('textStyle','standard');eq('editorial recipe can be reset',api.getTheme().config.appearance.textStyle,'standard');eq('standard text transform paints',getComputedStyle(light().querySelector('.qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button')).textTransform,'none');

    appearance('typography','roomy');eq('typography option committed',api.getTheme().config.appearance.typography,'roomy');eq('KPI typography paints',getComputedStyle(light().querySelector('.qxframe9a7c2-typography-kpi')).fontSize,'40px');
    appearance('fontBody','humanist');yes('Body font paints',getComputedStyle(light().querySelector('.qxframe9a7c2-button')).fontFamily.includes('Trebuchet'));
    appearance('fontHeading','serif');yes('Heading font paints',getComputedStyle(light().querySelector('.qxframe9a7c2-card-title')).fontFamily.includes('Georgia'));
    appearance('fontMono','system-mono');yes('Mono font paints',getComputedStyle(light().querySelector('code')).fontFamily.includes('Cascadia'));
    appearance('border','strong');eq('Border option paints controls',getComputedStyle(light().querySelector('.qxframe9a7c2-button')).borderTopWidth,'4px');eq('Border option paints Card',getComputedStyle(light().querySelector('.qxframe9a7c2-card')).borderTopWidth,'4px');
    appearance('shadow','md');eq('Shadow option committed',api.getTheme().config.appearance.shadow,'md');yes('Shadow option paints Card',getComputedStyle(light().querySelector('.qxframe9a7c2-card')).boxShadow!=='none');
    appearance('motion','relaxed');eq('Motion option committed',api.getTheme().config.appearance.motion,'relaxed');yes('Motion option paints transition',getComputedStyle(light().querySelector('.qxframe9a7c2-button')).transitionDuration.includes('0.32s'));
    shape('choice','square');eq('Choice Shape committed',api.getTheme().config.appearance.shape.choice,'square');eq('Checkbox Shape paints',getComputedStyle(light().querySelector('.qxframe9a7c2-form-check-input[type="checkbox"]')).borderTopLeftRadius,'0px');eq('Radio Shape paints',getComputedStyle(light().querySelector('.qxframe9a7c2-form-check-input[type="radio"]')).borderTopLeftRadius,'0px');
    shape('toggle','square');eq('Toggle Shape committed',api.getTheme().config.appearance.shape.toggle,'square');eq('Switch track Shape paints',getComputedStyle(light().querySelector('.qxframe9a7c2-switch-track')).borderTopLeftRadius,'0px');eq('Switch thumb Shape paints',getComputedStyle(light().querySelector('.qxframe9a7c2-switch-thumb')).borderTopLeftRadius,'0px');

    const json=panel.querySelector('[data-v2-json]'),snapshot=api.getTheme().config;json.value=JSON.stringify(snapshot);panel.querySelector('[data-v2-action="apply-json"]').click();eq('JSON roundtrip options',api.getTheme().config.options,snapshot.options);eq('JSON roundtrip geometry',api.getTheme().config.geometry,snapshot.geometry);eq('JSON roundtrip appearance',api.getTheme().config.appearance,snapshot.appearance);
    const mode=panel.querySelector('[data-v2-color-mode]'),role=panel.querySelector('[data-v2-color-role]'),value=panel.querySelector('[data-v2-color-value]');mode.value='light';role.value='override-action-background';role.dispatchEvent(new Event('change'));value.value='rgb(13 57 91)';panel.querySelector('[data-v2-action="color"]').click();
    let button=light().querySelector('.qxframe9a7c2-button.is-solid');eq('explicit optional override paints consumer',getComputedStyle(button).backgroundColor,'rgb(13, 57, 91)');
    panel.querySelector('[data-v2-action="remove-color"]').click();eq('optional override deleted',Object.hasOwn(api.getTheme().config.overrides.light,'action-background'),false);button=light().querySelector('.qxframe9a7c2-button.is-solid');eq('deleted override restores role',getComputedStyle(button).backgroundColor,'rgb(37, 99, 235)');
    eq('physical previews both modes',panel.querySelectorAll('[data-v2-physical-type]').length,28);
    const physical=()=>light().querySelector('[data-v2-physical-type="blue"]');
    const blueDefault=getComputedStyle(physical()).backgroundColor;
    role.value='type-blue';role.dispatchEvent(new Event('change'));value.value='rgb(17 73 119)';panel.querySelector('[data-v2-action="color"]').click();eq('physical input paints actual preview',getComputedStyle(physical()).backgroundColor,'rgb(17, 73, 119)');
    role.value='type-blue-foreground';role.dispatchEvent(new Event('change'));value.value='rgb(227 239 241)';panel.querySelector('[data-v2-action="color"]').click();eq('physical foreground paints actual preview',getComputedStyle(physical()).color,'rgb(227, 239, 241)');
    role.value='primary';role.dispatchEvent(new Event('change'));value.value='rgb(91 23 107)';panel.querySelector('[data-v2-action="color"]').click();eq('primary edit preserves physical input',getComputedStyle(physical()).backgroundColor,'rgb(17, 73, 119)');
    const physicalConfig=api.getTheme().config;json.value=JSON.stringify(physicalConfig);panel.querySelector('[data-v2-action="apply-json"]').click();eq('physical input JSON roundtrip',api.getTheme().config.colors.light['type-blue'],'rgb(17 73 119)');
    role.value='type-blue';role.dispatchEvent(new Event('change'));panel.querySelector('[data-v2-action="remove-color"]').click();eq('physical delete restores framework reference',getComputedStyle(physical()).backgroundColor,blueDefault);eq('physical deletion is sparse',Object.hasOwn(api.getTheme().config.colors.light,'type-blue'),false);
    const before=api.getTheme().config;json.value='{"schema":1}';panel.querySelector('[data-v2-action="apply-json"]').click();eq('invalid import keeps current config',api.getTheme().config,before);eq('invalid import displays error',panel.querySelector('[data-v2-status]').dataset.error,'true');
    panel.querySelector('[data-v2-action="reset"]').click();eq('reset restores options',api.getTheme().config.options,{density:'standard',radius:'sm',spacing:'normal'});eq('reset restores appearance',api.getTheme().config.appearance,defaultAppearance);eq('export is md only',/-(?:xs|sm|lg|xl):/.test(api.getTheme().css),false);
    return {checks,failures};
  })()`});
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/theme-studio-v2.json'),JSON.stringify(report,null,2)+'\n');
  assert.deepEqual(report.browser.failures,[],'Studio user flows differ from their visible configuration');
}
console.log(JSON.stringify(report));
