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
const report={schema:2,stage:'E/F opt-in editor',bundleBytes:Buffer.byteLength(code),themeBytes:Buffer.byteLength(theme.css),inputs:theme.statistics,defaultReplaced:false,browser:null};
if(process.argv.includes('--browser')){
  report.browser=await browserProbes({htmlContent:'<!doctype html><html><head><style>'+compileStyles().css+'\n'+fs.readFileSync(path.join(root,'docs/assets/theme-studio-v2.css'),'utf8')+'</style></head><body><section data-theme-studio-v2></section><script>'+code+'</script></body></html>',expression:`(() => {
    const api=window.QXFRAME9A7C2_THEME_STUDIO_V2,panel=document.querySelector('[data-theme-studio-v2]'),failures=[];let checks=0;
    const eq=(name,actual,expected)=>{checks++;if(JSON.stringify(actual)!==JSON.stringify(expected))failures.push({name,actual,expected});};
    const choose=(name,value)=>{const node=panel.querySelector('[data-v2-option="'+name+'"]');node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));};
    const heights=()=>[...panel.querySelectorAll('[data-qxframe9a7c2-theme="light"] .qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button')].map(node=>parseFloat(getComputedStyle(node).minHeight));
    const radius=()=>[...panel.querySelectorAll('[data-qxframe9a7c2-theme="light"] .qxframe9a7c2-v2-preview-row>.qxframe9a7c2-button')].map(node=>parseFloat(getComputedStyle(node).borderTopLeftRadius));
    eq('boot',!!api,true);eq('default options',api.getTheme().config.options,{density:'standard',radius:'sm',spacing:'normal'});eq('default five heights',heights(),[28,32,36,40,44]);
    choose('style','mira');eq('Style populates concrete options',api.getTheme().config.options,{density:'tight',radius:'xs',spacing:'compact'});eq('Style density visibly changes five heights',heights(),[20,24,28,32,36]);
    choose('density','compact');choose('spacing','roomy');eq('independent control density',heights(),[24,28,32,36,40]);
    const body=panel.querySelector('[data-qxframe9a7c2-theme="light"] .qxframe9a7c2-card-body');eq('independent roomy surface',parseFloat(getComputedStyle(body).paddingLeft),28);
    choose('radius','none');eq('none across five sizes',radius(),[0,0,0,0,0]);
    choose('style','sera');choose('radius','lg');eq('Sera follow radius can change',radius(),[10,12,14,16,18]);
    const json=panel.querySelector('[data-v2-json]'),snapshot=api.getTheme().config;json.value=JSON.stringify(snapshot);panel.querySelector('[data-v2-action="apply-json"]').click();eq('JSON roundtrip options',api.getTheme().config.options,snapshot.options);eq('JSON roundtrip geometry',api.getTheme().config.geometry,snapshot.geometry);
    const mode=panel.querySelector('[data-v2-color-mode]'),role=panel.querySelector('[data-v2-color-role]'),value=panel.querySelector('[data-v2-color-value]');mode.value='light';role.value='override-action-background';role.dispatchEvent(new Event('change'));value.value='rgb(13 57 91)';panel.querySelector('[data-v2-action="color"]').click();
    let button=panel.querySelector('[data-qxframe9a7c2-theme="light"] .qxframe9a7c2-button.is-solid');eq('explicit optional override paints consumer',getComputedStyle(button).backgroundColor,'rgb(13, 57, 91)');
    panel.querySelector('[data-v2-action="remove-color"]').click();eq('optional override deleted',Object.hasOwn(api.getTheme().config.overrides.light,'action-background'),false);button=panel.querySelector('[data-qxframe9a7c2-theme="light"] .qxframe9a7c2-button.is-solid');eq('deleted override restores role',getComputedStyle(button).backgroundColor,'rgb(37, 99, 235)');
    const before=api.getTheme().config;json.value='{"schema":1}';panel.querySelector('[data-v2-action="apply-json"]').click();eq('invalid import keeps current config',api.getTheme().config,before);eq('invalid import displays error',panel.querySelector('[data-v2-status]').dataset.error,'true');
    panel.querySelector('[data-v2-action="reset"]').click();eq('reset restores options',api.getTheme().config.options,{density:'standard',radius:'sm',spacing:'normal'});eq('export is md only',/-(?:xs|sm|lg|xl):/.test(api.getTheme().css),false);
    return {checks,failures};
  })()`});
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/theme-studio-v2.json'),JSON.stringify(report,null,2)+'\n');
  assert.deepEqual(report.browser.failures,[],'Studio v2 user flows differ from their visible configuration');
}
console.log(JSON.stringify(report));
